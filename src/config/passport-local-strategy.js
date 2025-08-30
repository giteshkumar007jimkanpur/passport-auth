import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

passport.use(
  'local',
  new LocalStrategy(
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
          logger.error('Invalid credentials!!!');
          return done(null, false, { message: 'Invalid credentials!!!' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// Serialize user for session storage
/** Serialize the user to decide which key to be kept in the cookies */
passport.serializeUser((user, done) => {
  done(null, user._id); // Store only user ID in session
});

// Deserialize user from session
/** deserialize the user from the key in the cookies */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    authenticated: false,
    message: 'Not authenticated',
  });
};

export default passport;
