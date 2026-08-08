import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const generateToken = (userId) => {
  return jwt.sign(
    { sub: userId.toString() },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export default {
  generateToken,
  verifyToken
};
