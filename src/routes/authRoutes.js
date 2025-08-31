import express from 'express';
import rateLimit from 'express-rate-limit';

import passport, { requireAuth } from '../config/passport.config.js';
const router = express.Router();
import { authController } from '../controllers/index.js';
import validateRequest from '../middlewares/request.validation.middleware.js';
import authValidation from '../validations/auth.validations.js';

// Rate limiters
const loginLimiter = rateLimit({
  legacyHeaders: false,
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

const refreshLimiter = rateLimit({
  legacyHeaders: false,
  max: 30,
  message: { message: 'Too many refresh attempts. Slow down.' },
  standardHeaders: true,
  windowMs: 5 * 60 * 1000,
});

const oauthLimiter = rateLimit({
  legacyHeaders: false,
  max: 20,
  message: { message: 'Too many OAuth attempts. Please try again later.' },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

router.post(
  '/register',
  validateRequest(authValidation.register),
  authController.register,
);

/** Login with email/password */
router.post(
  '/login',
  loginLimiter,
  validateRequest(authValidation.login),
  authController.login,
);

/** Alternate Passport Local login endpoint */
router.post(
  '/login-passport',
  loginLimiter,
  validateRequest(authValidation.login),
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    session: true,
    failureRedirect: false,
  }),
  authController.loginWithPassport,
);

router.post('/refresh', refreshLimiter, authController.refresh);

router.post('/logout', requireAuth, authController.logout);

router.post('/logout-all', requireAuth, authController.logoutAll);

/**
 * Initiate Google OAuth login
 */
router.get(
  '/google',
  oauthLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true, // Use sessions for OAuth flow
  }),
);

/**
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: true,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error`,
  }),
  authController.googleCallback,
);

export default router;
