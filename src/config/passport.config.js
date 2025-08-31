import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';

import {
  accessTokenSecret,
  issuer,
  audience,
  googleClientId,
  googleClientSecret,
  clientUrl,
} from './env.config.js';
import { User } from '../models/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

/** Local Strategy */
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      // NOSONAR
      passwordField: 'password',
      passReqToCallback: false,
    },
    /** This fn will fetch user, then user.id will be used in serializer fn to store id in cookie */
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user || !(await user.comparePassword(password))) {
          logger.error('Invalid credentials!!!');
          return done(null, false, { message: 'Invalid credentials!!!' });
        }
        user.passwordHash = undefined;
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

/** JWT Strategy */
passport.use(
  'JWT',
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessTokenSecret,
      issuer,
      audience,
      algorithms: ['HS256'],
      passReqToCallback: false,
    },
    async (payload, done) => {
      try {
        if (payload.typ !== 'access') {
          return done(null, false, { message: 'Invalid token type' });
        }
        const user = await User.findById(payload.sub);
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }
        return done(null, user);
      } catch (error) {
        logger.error('JWT Auth error :', error);
        return done(error, false);
      }
    },
  ),
);

/** Google OAuth Strategy */
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: `${clientUrl}/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          $or: [
            {
              googleId: profile.id,
              email: profile.emails[0].value,
            },
          ],
        });

        if (user) {
          /** Update existing user If google info not already set */
          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = 'google';
            await user.save();
          }
          return done(null, user);
        }
        user = await User.create({
          googleId: profile.id,
          provider: 'google',
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value || '',
          isVerified: true,
        });
        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error: ', error);
        return done(error, null);
      }
    },
  ),
);

// Serialize user for session storage
/** Serialize the user to decide which key to be kept in the cookies */
passport.serializeUser((user, done) => {
  done(null, user._id.toString()); // Store only user ID in session
});

// Deserialize user from session
/** deserialize the user from the key in the cookies */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error);
  }
});

/** Session based authentication */
export const requireSession = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    message: 'Session authentication required',
    authenticated: false,
  });
};

/** JWT authentication middleware */
export const requireJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer')) {
      return res.status(401).json({
        message: 'Access token missing or malformed',
      });
    }
    const accessToken = authHeader.split(' ')[1];

    const payload = verifyAccessToken(accessToken);
    req.user = {
      email: payload.email,
      id: payload.sub,
      jti: payload.jti,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access token expired', { error: error.message });
      return res.status(401).json({
        message: 'Access token expired',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid Access token', { error: error.message });
      return res.status(401).json({
        message: 'Invalid Access token',
      });
    }
    next(error);
  }
};

/** Combined auth middleware - check both session and JWT */
export const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return requireJWT(req, res, next);
};

export default passport;
