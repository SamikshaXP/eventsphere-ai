import User from '../models/user.model.js';
import Membership from '../models/membership.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Invalid email address format');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword
    });

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: 'ACTIVE'
    }).populate('organization', 'name description logo owner');

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        memberships
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please clear token on client side.'
    });
  } catch (error) {
    next(error);
  }
};
