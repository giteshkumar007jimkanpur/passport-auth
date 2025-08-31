import compression from 'compression';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';

import { isProd, mongoUri, sessionSecret } from './config/env.config.js';
import errorHandler from './middlewares/error.handler.middleware.js';
import router from './routes/index.js';
import logger from './utils/logger.js';

const app = express();

import './config/passport.config.js';

/** Hide tech stack */
app.disabled('x-powered-by');

/** When behind reverse proxies, trust proxy for corrsct IPs */
app.set('trust proxy', 1);

/** Middleware for request context ID */
// app.use(requestContext)

/** Setting security headers as expres does not */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

/** Telling browser which extrenal origins can talk to your APIs */
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

/** Protection from html paramater pollution */
app.use(hpp());

/** Basic rate limit to protect against spam */
const limiter = rateLimit({
  legacyHeaders: false,
  standardHeaders: true,
  limit: 100,
  windowMs: 15 * 60 * 1000,
});
app.use(limiter);

/** Body Parsers */
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    store: MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600, // Lazy session update
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      secure: isProd,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'strict' : 'lax',
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

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

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

app.use(router);

app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
