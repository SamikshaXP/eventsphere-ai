import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired authentication token');
    }

    if (!decoded || !decoded.sub) {
      throw new ApiError(401, 'Invalid token payload');
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new ApiError(401, 'User associated with token no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
