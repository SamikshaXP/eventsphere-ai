import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET || 'eventsphere_dev_jwt_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
};

export default config;