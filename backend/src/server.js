import app from './app.js';
import config from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 EventSphere AI Backend running on port ${config.port} [${config.env}]`);
  console.log(`Health check endpoint: http://localhost:${config.port}/api/v1/health`);
});

// Basic handling for unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

export default server;
