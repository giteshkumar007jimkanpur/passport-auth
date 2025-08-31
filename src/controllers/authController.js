import ms from 'ms';

import { accessTokenExpiry } from '../config/env.config.js';
import { User } from '../models/index.js';
import { authService } from '../services/index.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/cookie.helper.js';
import { hashToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import authValidation from '../validations/auth.validations.js';

export const register = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: 'Email already registered!!!',
      });
    }
    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
      provider: 'local',
      isVerified: false,
    });
    const userObj = {
      id: user._id,
      name: user.name,
      email: user.email,
      provider: 'local',
    };
    logger.info('User registered', { user: userObj });

    const tokens = await authService.createTokens(user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    setRefreshCookie(res, tokens.refreshToken);
    return res.status(201).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const exists = await User.findOne({ email }).select('+passwordHash');
    if (!exists || !(await exists.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid Credentails ...',
      });
    }

    if (exists.provider !== 'local') {
      return res.status(404).json({
        message: `Please login with ${exists.provider}`,
      });
    }

    const tokens = await authService.createTokens(exists, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);
    const userObj = {
      id: exists._id,
      name: exists.name,
      email: exists.email,
      provider: exists.provider,
    };
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const loginWithPassport = async (req, res, next) => {
  try {
    const user = req.user;
    const tokens = await authService.createTokens(user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    setRefreshCookie(res, tokens.refreshToken);
    const userObj = {
      email: user.email,
      id: user._id,
      name: user.name,
      provider: user.provider,
    };
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      tokenType: 'Bearer',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const tokens = await authService.createTokens(user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    setRefreshCookie(res, tokens.refreshToken);
    const successUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/users/me`;
    return res.redirect(successUrl);
  } catch (error) {
    logger.error('Google callback error:', error);
    const errorUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/error`;
    return res.redirect(errorUrl);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { error, value } = authValidation.refreshToken.validate(
      req.cookies || {},
    );
    if (error) {
      return next(error);
    }
    const tokens = await authService.rotateRefreshToken(value.refreshToken, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    setRefreshCookie(res, tokens.refreshToken);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      expiresIn: ms(accessTokenExpiry) / 1000,
      message: 'Tokens refreshed successfully...',
      tokenType: 'Bearer',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};

export const logout = async (req, res) => {
  try {
    const wasAuthenticated = req.isAuthenticated() || !!req.user;
    const userEmail = req.user ? req.user?.email : null;
    const sessionId = req.sessionID;

    const { error, value } = authValidation.refreshToken.validate(
      req.cookies || {},
    );

    if (!error && value.refreshToken) {
      const tokenHash = hashToken(value.refreshToken);
      const wasRevoked = await authService.revokeRefreshToken(tokenHash);

      if (wasRevoked) {
        logger.info(
          `Refresh token revoked successfully, token (hash= ${tokenHash.slice(0, 8)})`,
        );
      }
    }

    if (req.session && !req.session.regenerate) {
      req.session.regenerate = function (callback) {
        if (callback) {
          callback();
        }
      };
    }

    if (req.session && !req.session.save) {
      req.session.save = function (callback) {
        if (callback) {
          callback();
        }
      };
    }

    if (req.logout) {
      req.logout((err) => {
        if (err) {
          logger.error('Passport logout error:', err);
        }
      });
    }

    clearRefreshCookie(res);

    res.clearCookie('sessionId');
    res.clearCookie('connect.sid');

    return res.status(200).json({
      message: 'Logout Successfully...',
      wasAuthenticated,
      userEmail,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    clearRefreshCookie(res);
    logger.error('Error during logout', { error: error.message });
    return res.status(500).json({
      error: error.message,
      message: 'Internal Server Error !',
    });
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const revokedCount = await authService.revokeAllRefreshTokens(userId);

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destroy error', err);
        }
      });
    }
    clearRefreshCookie(res);
    res.clearCookie('sessionId');
    res.clearCookie('connect.sid');

    if (revokedCount) {
      logger.info(`Revoked ${revokedCount} refresh tokens for user: ${userId}`);
      return res.status(200).json({
        message: 'Logged out from all devices',
      });
    }

    logger.info(`No active refresh tokens to revoke for user: ${userId}`);
    return res.status(200).json({
      message: 'No active session to logout from',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};
