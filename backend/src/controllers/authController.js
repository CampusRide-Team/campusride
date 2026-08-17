import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

export const register = async (req, res) => {
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
      nationalIdNumber 
    } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'USER_EXISTS', message: 'Email or phone number already registered' } 
      });
    }

    const licenseUrl = extractFilePath(req.files?.licenseFile);
    const ghanaCardFrontUrl = extractFilePath(req.files?.ghanaCardFront);
    const ghanaCardBackUrl = extractFilePath(req.files?.ghanaCardBack);
    const insuranceUrl = extractFilePath(req.files?.insuranceFile);
    const registrationUrl = extractFilePath(req.files?.registrationFile);
    
    const user = await User.create({ 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      role: role || 'driver',
      isApproved: false,  
      isSuspended: false,
      vehicleType: vehicleType || vehicleModel || 'Sedan',
      vehicleModel: vehicleModel || vehicleType || 'Not Specified',
      vehicleLicensePlate: vehicleLicensePlate || 'N/A',
      vehicleColor: vehicleColor || 'Unspecified',
      nationalIdNumber: nationalIdNumber || 'N/A',
      licenseImg: licenseUrl,
      ghanaCardImg: ghanaCardFrontUrl,
      ghanaCardBackImg: ghanaCardBackUrl,
      insuranceImg: insuranceUrl,
      registrationImg: registrationUrl
    });

    return res.status(201).json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          role: user.role,
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) { 
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role: requestedRole } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email/phone and password are required.' } });
    }

    const isEmailInput = email.includes('@');
    const query = isEmailInput 
      ? { email: email.trim().toLowerCase() } 
      : { phoneNumber: email.trim().replace(/\s+/g, "") };

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      
      // BLOCK ROLE CROSS-LOGIN: Prevent a driver from logging into student portal & vice versa
      if (requestedRole && user.role !== requestedRole) {
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
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended.' } 
        });
      }

      if (user.role === 'driver' && !user.isApproved) {
        return res.status(403).json({ 
          success: false, 
          error: { code: 'PENDING_APPROVAL', message: 'Driver account is pending Admin approval.' } 
        });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      
      let formattedAvatarUri = user.avatarUri || user.avatarUrl || null;
      if (formattedAvatarUri && !formattedAvatarUri.startsWith('http')) {
        formattedAvatarUri = `${protocol}://${host}/${formattedAvatarUri}`;
      }

      // IF USER IS A DRIVER: Skip OTP and return token & profile instantly
      if (user.role === 'driver') {
        return res.json({
          success: true,
          data: {
            user: { 
              id: user._id, 
              fullName: user.fullName, 
              email: user.email, 
              phoneNumber: user.phoneNumber,
              role: user.role,
              avatarUri: formattedAvatarUri,  
              avatarUrl: formattedAvatarUri
            },
            token: generateToken(user._id)
          }
        });
      }

      // IF PASSENGER: Keep the OTP flow
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await user.save();

      if (isEmailInput) {
        console.log(`[CampusRide Mailer] 📧 Sending OTP email to Gmail (${user.email}): Your verification code is ${otpCode}`);
      } else {
        console.log(`[CampusRide SMS Gateway] 📱 Sending SMS text to Phone Number (${user.phoneNumber}): Your verification code is ${otpCode}`);
      }

      return res.json({
        success: true,
        message: isEmailInput ? 'OTP sent to your Gmail address.' : 'OTP sent via SMS to your phone number.',
        data: { requiresOtp: true }
      });

    } else {
      return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } });
    }
  } catch (error) { 
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: { message: 'Email/phone and OTP code are required.' } });
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

    const host = req.get('host');
    const protocol = req.protocol;
    let formattedAvatarUri = user.avatarUri || user.avatarUrl || null;
    if (formattedAvatarUri && !formattedAvatarUri.startsWith('http')) {
      formattedAvatarUri = `${protocol}://${host}/${formattedAvatarUri}`;
    }

    return res.json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          phoneNumber: user.phoneNumber,
          role: user.role,
          avatarUri: formattedAvatarUri,  
          avatarUrl: formattedAvatarUri
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) { 
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
};