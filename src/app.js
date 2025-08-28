import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { isProd } from './config/env.config.js';
import logger from './utils/logger.js';
import compression from 'compression';
import router from './routes/index.js';
import errorHandler from './middlewares/error.handler.middleware.js';
const app = express();

// /** Hide tech stack */
// app.disabled('x-powered-by');

// /** When behind reverse proxies, trust proxy for corrsct IPs */
// app.set('trust proxy', 1);

// /** Middleware for request context ID */
// // app.use(requestContext)

// /** Setting security headers as expres does not */
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: 'cross-origin' },
//   }),
// );

// /** Telling browser which extrenal origins can talk to your APIs */
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     maxAge: 600,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   }),
// );

// /** Protection from html paramater pollution */
// app.use(hpp());

// /** Basic rate limit to protect against spam */
// const limiter = rateLimit({
//   legacyHeaders: false,
//   standardHeaders: true,
//   limit: 100,
//   windowMs: 15 * 60 * 1000,
// });
// app.use(limiter);

/** Body Parsers */
app.use(cookieParser);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/** Morgan - for request logging middlware */
/** Pipes to winston in prod, otherwise dev-friendly logging in console */
/** You need to log every request for debugging and auditing */
const morganFormat = isProd ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (msg) =>
        logger.http ? logger.http(msg.trim()) : logger.info(msg.trim()),
    },
  }),
);

/** Compress HTTP response before they are sent to client */
app.use(compression());

app.get('/', (_req, res) => {
  return res.status(200).json({
    status: 'home',
  });
});

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

// app.use(router);

app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
