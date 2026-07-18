import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res, next) => {
  try {
    // 1. Destructure all textual parameter fields passed from the multi-part FormData layout
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

    // 3. Extract uploaded media file locations safely using chaining (?.) to prevent null exceptions
     const licenseUrl = req.files?.licenseFile?.[0] ? (req.files.licenseFile[0].path || req.files.licenseFile[0].secure_url) : null;
    const ghanaCardFrontUrl = req.files?.ghanaCardFront?.[0] ? (req.files.ghanaCardFront[0].path || req.files.ghanaCardFront[0].secure_url) : null;
    const ghanaCardBackUrl = req.files?.ghanaCardBack?.[0] ? (req.files.ghanaCardBack[0].path || req.files.ghanaCardBack[0].secure_url) : null;
    const insuranceUrl = req.files?.insuranceFile?.[0] ? (req.files.insuranceFile[0].path || req.files.insuranceFile[0].secure_url) : null;
    const registrationUrl = req.files?.registrationFile?.[0] ? (req.files.registrationFile[0].path || req.files.registrationFile[0].secure_url) : null;
    
    // 4. Save everything directly to your unified User schema document
    const user = await User.create({ 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      role: role || 'driver',
      isApproved: false, // Remains false for driver applicants until Admin clicks verify

      // Flat vehicle fields integration
      vehicleType: vehicleType || 'Campus Sedan',
      vehicleModel: vehicleModel || 'Campus Sedan',
      vehicleLicensePlate: vehicleLicensePlate || 'GA-2026-X',
      vehicleColor: vehicleColor || 'Silver/Gray',
      nationalIdNumber: nationalIdNumber || 'N/A',

      // Upload files destinations mapping
      licenseImg: licenseUrl,
      ghanaCardImg: ghanaCardFrontUrl,
      ghanaCardBackImg: ghanaCardBackUrl,
      insuranceImg: insuranceUrl,
      registrationImg: registrationUrl
    });

    console.log(`[Auth API Hub] New registration created successfully for user: ${user.fullName}`);

    // 5. Send back response payload in the exact shape your mobile app expects to receive
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
    console.error("❌ Registration execution crash inside controller layer:", error);
    next(error); 
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
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