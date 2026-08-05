import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/env.js';
import routes from './routes/index.js';
import notFoundHandler from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging in development
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// API Routes mounted under /api/v1
app.use('/api/v1', routes);

// 404 Handler for unmatched routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
