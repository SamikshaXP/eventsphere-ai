import config from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    error: {
      code: statusCode === 404 ? 'RESOURCE_NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
      message: message || 'An unexpected error occurred',
      details: [],
      ...(config.env === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
