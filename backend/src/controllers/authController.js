import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'Email or phone number already registered' } });
    }

    const user = await User.create({ fullName, email, phoneNumber, password, role });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
        token: generateToken(user._id)
      }
    });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
      if (user.role === 'driver' && !user.isApproved) {
        return res.status(403).json({ success: false, error: { code: 'PENDING_APPROVAL', message: 'Driver account is pending Admin approval.' } });
      }

      res.json({
        success: true,
        data: {
          user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } });
    }
  } catch (error) { next(error); }
};