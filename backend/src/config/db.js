import mongoose from 'mongoose';
import config from './env.js';

const connectDB = async () => {
  try {
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is not defined in environment configuration');
    }

    await mongoose.connect(config.mongodbUri);

    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
