import express from 'express';
import passport from 'passport';
import { authController } from '../controllers/index.js';
const router = express.Router();

router.post('/register', authController.register);
// router.post(
//   '/login',
//   passport.authenticate('local', { failureRedirect: '/auth/login' }),
//   authController.login,
// );

export default router;
