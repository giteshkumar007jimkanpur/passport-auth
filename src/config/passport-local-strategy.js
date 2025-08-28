import passport from 'passport';
import { Strategy } from 'passport-local';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

passport.use(
  new Strategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    /** This fn will fetch user, then user.id will be used in serializer fn to store id in cookie */
    async (_req, email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
          logger.error('Invalid credentials');
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

/** Serialize the user to decide which key to be kept in the cookies */
passport.serializeUser((user, done) => {
  done(null, user.email);
});

/** deserialize the user from the key in the cookies */
passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error);
  }
});

passport.checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/auth/login');
};

passport.setAuthenticatedUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  }
  next();
};

export default passport;
