import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtConfig.js';
import { normalizePhoneNumber } from '../utils/phoneNormalizer.js';

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '7d' });
};

const extractFilePath = (fileArray) => {
  if (!fileArray || !fileArray[0]) return null;
  const fileObj = fileArray[0];
  if (fileObj.secure_url) return fileObj.secure_url;
  if (fileObj.url) return fileObj.url;
  if (fileObj.path) {
    return fileObj.path.replace(/\\/g, '/');
  }
  return null;
};

const publicAssetUrl = (req, value) => {
  if (!value || typeof value !== 'string') return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get('host')}/${value.replace(/^\/+/, '')}`;
};

export const register = async (req, res, next) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      role,
      vehicleType, 
      vehicleModel, 
      vehicleLicensePlate, 
      vehicleColor, 
      physicalCapacity,
      chosenSharedCapacity,
      nationalIdNumber 
    } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Full name, email, phone number, and password are required' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

    const userExists = await User.findOne({ $or: [{ email: cleanEmail }, { phoneNumber: cleanPhone }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'USER_EXISTS', message: 'Email or phone number already registered' } 
      });
    }

    // Canonical role assignment
    let targetRole = (role || 'passenger').toLowerCase();
    if (targetRole === 'student' || targetRole === 'rider') {
      targetRole = 'passenger';
    }

    const licenseUrl = extractFilePath(req.files?.licenseFile);
    const ghanaCardFrontUrl = extractFilePath(req.files?.ghanaCardFront);
    const ghanaCardBackUrl = extractFilePath(req.files?.ghanaCardBack);
    const insuranceUrl = extractFilePath(req.files?.insuranceFile);
    const registrationUrl = extractFilePath(req.files?.registrationFile);

    const parsedPhysicalCapacity = Number(physicalCapacity) || 4;
    const parsedSharedCapacity = Math.min(Number(chosenSharedCapacity) || 3, parsedPhysicalCapacity);

    const driverProfileData = targetRole === 'driver' ? {
      vehicle: {
        make: null,
        model: vehicleModel || vehicleType || 'Standard Vehicle',
        licensePlate: vehicleLicensePlate || 'N/A',
        color: vehicleColor || 'Unspecified',
        physicalCapacity: parsedPhysicalCapacity
      },
      capacity: {
        chosenSharedCapacity: parsedSharedCapacity
      },
      documents: {
        licenseImg: licenseUrl,
        ghanaCardFront: ghanaCardFrontUrl,
        ghanaCardBack: ghanaCardBackUrl,
        insuranceImg: insuranceUrl,
        registrationImg: registrationUrl
      }
    } : undefined;
    
    const user = await User.create({ 
      fullName: fullName.trim(), 
      email: cleanEmail, 
      phoneNumber: cleanPhone, 
      password, 
      role: targetRole,
      approvalStatus: targetRole === 'driver' ? 'pending' : 'approved',
      isSuspended: false,
      driverProfile: driverProfileData
    });

    return res.status(201).json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          phoneNumber: user.phoneNumber,
          role: user.role,
          approvalStatus: user.approvalStatus,
          isApproved: user.isApproved
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) { 
    console.error("Register Error:", error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role: requestedRole } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'MISSING_CREDENTIALS', message: 'Email/phone and password are required.' } 
      });
    }

    const rawInput = email.trim();
    const isEmailInput = rawInput.includes('@');
    
    let query;
    if (isEmailInput) {
      query = { email: rawInput.toLowerCase() };
    } else {
      const cleanPhone = rawInput.replace(/\s+/g, "");
      let normalizedPhone = cleanPhone;
      try {
        normalizedPhone = normalizePhoneNumber(cleanPhone);
      } catch (err) {
        // Fallback
      }
      query = {
        $or: [
          { phoneNumber: cleanPhone },
          { phoneNumber: normalizedPhone }
        ]
      };
    }

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      
      // Normalized requested role comparison
      let normalizedReqRole = requestedRole ? requestedRole.toLowerCase() : null;
      if (normalizedReqRole === 'student' || normalizedReqRole === 'rider') {
        normalizedReqRole = 'passenger';
      }

      const effectiveUserRole = user.role === 'student' ? 'passenger' : user.role;

      if (normalizedReqRole && effectiveUserRole !== normalizedReqRole) {
        return res.status(403).json({ 
          success: false, 
          error: { 
            code: 'ROLE_MISMATCH', 
            message: `This account is registered as a ${user.role}. Please use the correct login portal.` 
          } 
        });
      }

      if (user.isSuspended || user.isBlocked) {
        return res.status(403).json({ 
          success: false, 
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by administration.' } 
        });
      }

      if (user.role === 'driver' && user.approvalStatus !== 'approved' && user.isApproved !== true) {
        return res.status(403).json({ 
          success: false, 
          error: { code: 'PENDING_APPROVAL', message: 'Driver account is pending administrator approval.' } 
        });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      let formattedAvatarUri = user.avatarUri || user.avatarUrl || null;
      if (formattedAvatarUri && !formattedAvatarUri.startsWith('http')) {
        formattedAvatarUri = `${protocol}://${host}/${formattedAvatarUri}`;
      }

      // If Driver: Direct instant session issuance
      if (user.role === 'driver' || user.role === 'admin') {
        return res.json({
          success: true,
          data: {
            user: { 
              id: user._id, 
              fullName: user.fullName, 
              email: user.email, 
              phoneNumber: user.phoneNumber,
              role: user.role,
              approvalStatus: user.approvalStatus,
              isApproved: user.isApproved,
              avatarUri: formattedAvatarUri,  
              avatarUrl: formattedAvatarUri,
              rating: user.ratingAverage
            },
            token: generateToken(user._id)
          }
        });
      }

      // If Passenger: Instant login or OTP verification flow
      // Instant login mode for smooth testing & UX
      return res.json({
        success: true,
        data: {
          user: { 
            id: user._id, 
            fullName: user.fullName, 
            email: user.email, 
            phoneNumber: user.phoneNumber,
            role: user.role === 'student' ? 'passenger' : user.role,
            avatarUri: formattedAvatarUri,  
            avatarUrl: formattedAvatarUri
          },
          token: generateToken(user._id)
        }
      });

    } else {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'AUTH_FAILED', message: 'Invalid email/phone or password credentials' } 
      });
    }
  } catch (error) { 
    console.error("Login Error:", error);
    next(error);
  }
};

export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email/phone and OTP code are required.' } 
      });
    }

    const query = email.includes('@') 
      ? { email: email.trim().toLowerCase() } 
      : { phoneNumber: email.trim().replace(/\s+/g, "") };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    if (!user.otpCode || user.otpCode !== otpCode.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Incorrect OTP verification code.' } });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, error: { message: 'OTP code has expired. Please request a new one.' } });
    }

    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) { 
    next(error);
  }
};

/**
 * Returns the authenticated user's profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User record not found' }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          approvalStatus: user.approvalStatus,
          isApproved: user.isApproved,
          avatarUri: publicAssetUrl(req, user.avatarUri || user.avatarUrl),
          avatarUrl: publicAssetUrl(req, user.avatarUrl || user.avatarUri),
          rating: user.ratingAverage || 5.0,
          totalTrips: user.totalTrips || 0,
          driverProfile: user.driverProfile
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates profile attributes for the authenticated user
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.fullName) updates.fullName = req.body.fullName.trim();
    if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber.trim();
    if (req.body.expoPushToken) updates.expoPushToken = req.body.expoPushToken.trim();

    if (req.file?.path) {
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      updates.avatarUri = normalizedPath;
      updates.avatarUrl = normalizedPath;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    const responseUser = updatedUser.toObject();
    responseUser.avatarUri = publicAssetUrl(req, updatedUser.avatarUri || updatedUser.avatarUrl);
    responseUser.avatarUrl = publicAssetUrl(req, updatedUser.avatarUrl || updatedUser.avatarUri);

    res.json({
      success: true,
      data: {
        user: responseUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google Authentication Gateway Scaffold
 * Explicitly disabled / not configured until Google OAuth2 client credentials and verification are provided.
 */
export const googleAuth = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'GOOGLE_AUTH_NOT_CONFIGURED',
      message: 'Google authentication is not configured in this environment. Please use standard email/phone and password authentication.'
    }
  });
};
