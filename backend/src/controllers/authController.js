import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper function to safely extract and normalize upload file paths across Windows/Linux
const extractFilePath = (fileArray) => {
  if (!fileArray || !fileArray[0]) return null;
  const fileObj = fileArray[0];
  
  // If using Cloudinary / S3 remote storage
  if (fileObj.secure_url) return fileObj.secure_url;
  if (fileObj.url) return fileObj.url;

  // If using local multer storage, normalize Windows backslashes (\) to standard URIs (/)
  if (fileObj.path) {
    return fileObj.path.replace(/\\/g, '/');
  }
  return null;
};

export const register = async (req, res, next) => {
  try {
    // 1. Destructure parameter fields passed from multi-part FormData
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

    // 2. Prevent duplicate profile registrations
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'USER_EXISTS', message: 'Email or phone number already registered' } 
      });
    }

    // 3. Extract uploaded media file locations safely
    const licenseUrl = extractFilePath(req.files?.licenseFile);
    const ghanaCardFrontUrl = extractFilePath(req.files?.ghanaCardFront);
    const ghanaCardBackUrl = extractFilePath(req.files?.ghanaCardBack);
    const insuranceUrl = extractFilePath(req.files?.insuranceFile);
    const registrationUrl = extractFilePath(req.files?.registrationFile);
    
    // 4. Save everything directly to your unified User schema document
    const user = await User.create({ 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      role: role || 'driver',
      isApproved: false,  
      isSuspended: false,

      // Vehicle field assignments
      vehicleType: vehicleType || vehicleModel || 'Sedan',
      vehicleModel: vehicleModel || vehicleType || 'Not Specified',
      vehicleLicensePlate: vehicleLicensePlate || 'N/A',
      vehicleColor: vehicleColor || 'Unspecified',
      nationalIdNumber: nationalIdNumber || 'N/A',

      // Upload file destination mappings
      licenseImg: licenseUrl,
      ghanaCardImg: ghanaCardFrontUrl,
      ghanaCardBackImg: ghanaCardBackUrl,
      insuranceImg: insuranceUrl,
      registrationImg: registrationUrl
    });

    console.log(`[Auth API Hub] New driver registration logged successfully for: ${user.fullName}`);

    // 5. Send response payload back to mobile app
    res.status(201).json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          fullName: user.fullName, 
          email: user.email, 
          role: user.role,
          avatarUri: user.avatarUri || user.avatarUrl || null,  
          avatarUrl: user.userAvatar || user.avatarUrl || null   
        },
        token: generateToken(user._id)
      }
    });

  } catch (error) { 
    console.error(" Registration execution crash inside controller layer:", error);
    next(error); 
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
      //  ACCOUNT SUSPENSION ENFORCEMENT CHECK
      if (user.isSuspended || user.isBlocked) {
        return res.status(403).json({ 
          success: false, 
          error: { 
            code: 'ACCOUNT_SUSPENDED', 
            message: 'Your account has been suspended by administration. Please contact support.' 
          } 
        });
      }

      // Check driver approval status
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

      res.json({
        success: true,
        data: {
          user: { 
            id: user._id, 
            fullName: user.fullName, 
            email: user.email, 
            role: user.role,
            avatarUri: formattedAvatarUri,  
            avatarUrl: formattedAvatarUri
          },
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } });
    }
  } catch (error) { next(error); }
};