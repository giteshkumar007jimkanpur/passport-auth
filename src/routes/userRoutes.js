import express from 'express';

import {
  requireAuth,
  requireJWT,
  requireSession,
} from '../config/passport.config.js';
import { userController } from '../controllers/index.js';
const router = express.Router();

router.get('/me', requireAuth, userController.me);

router.get('/profile-jwt', requireJWT, (req, res) => {
  res.json({
    success: true,
    message: 'JWT protected route accessed',
    user: req.user,
    authMethod: 'JWT',
  });
});

router.get('/profile-session', requireSession, (req, res) => {
  res.json({
    success: true,
    message: 'Session protected route accessed',
    user: req.user,
    authMethod: 'Session',
  });
});

/**
 * Protected route using combined auth (JWT or Session)
 */
router.get('/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed',
    user: req.user,
  });
});

export default router;
