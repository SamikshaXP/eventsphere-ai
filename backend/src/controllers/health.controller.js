import config from '../config/env.js';

export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventSphere AI API is healthy',
    data: {
      status: 'UP',
      environment: config.env,
      timestamp: new Date().toISOString()
    }
  });
};
