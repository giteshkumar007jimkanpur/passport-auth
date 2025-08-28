import { isProd } from '../config/env.config.js';
import logger from '../utils/logger.js';

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isValidationError = err.isJoi && err.details;
  const payload = {
    message: isValidationError
      ? 'Request Validation Error'
      : err.publicMessgae || err.message || 'Interbal Server Error',
    status,
  };

  if (isValidationError) {
    payload.details = err.details.map((d) => d.message);
  }
  if (!isProd && err.stack) {
    payload.stack = err.stack;
  }

  logger.error({ ...payload });
  res.status(status).json(payload);
};

export default errorHandler;
