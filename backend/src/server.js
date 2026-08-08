import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(config.port, () => {
      console.log(`🚀 EventSphere AI Backend running on port ${config.port} [${config.env}]`);
      console.log(`Health check endpoint: http://localhost:${config.port}/api/v1/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Basic handling for unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

export default server;
