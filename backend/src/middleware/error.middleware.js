import config from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (!statusCode) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    error: {
      code:
        statusCode === 400
          ? 'BAD_REQUEST'
          : statusCode === 404
          ? 'RESOURCE_NOT_FOUND'
          : 'INTERNAL_SERVER_ERROR',
      message: message || 'An unexpected error occurred',
      details: err.errors ? Object.keys(err.errors) : [],
      ...(config.env === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
