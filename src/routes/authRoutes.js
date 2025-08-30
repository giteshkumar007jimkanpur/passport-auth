import express from 'express';
import passport from '../config/passport-local-strategy.js';
import { authController } from '../controllers/index.js';
const router = express.Router();
import authValidation from '../validations/auth.validations.js';
import validateRequest from '../middlewares/request.validation.middleware.js';

router.post(
  '/register',
  validateRequest(authValidation.register),
  authController.register,
);
router.post(
  '/login',
  validateRequest(authValidation.login),
  passport.authenticate('local', { failureRedirect: '/auth/login' }),
  authController.login,
);

router.get('/profile', passport.checkAuthentication, authController.profile);

router.post('/logout', authController.logout);

export default router;
