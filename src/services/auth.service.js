import ms from 'ms';
import sanitize from 'sanitize-html';

import { refreshTokenExpiry } from '../config/env.config.js';
import RefreshToken from '../models/RefreshToken.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import logger from '../utils/logger.js';

const sanitizeUserAgent = (ua) => {
  if (!ua || typeof ua !== 'string') {
    return 'unknown';
  }
  return sanitize(ua, {
    allowedAttributes: [],
    allowedTags: [],
  }).slice(0, 255);
};

export const createTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken({
    email: user.email,
    sub: user._id.toString(),
  });

  const refreshToken = signRefreshToken({
    email: user.email,
    sub: user._id.toString(),
  });

  const refreshTokenHash = hashToken(refreshToken);

  const expiresIn = refreshTokenExpiry;
  const msIn = ms(expiresIn);
  const expiresAt = new Date(msIn + Date.now());
  const query = {
    tokenHash: refreshTokenHash,
    user: user._id,
    userAgent: sanitizeUserAgent(meta?.userAgent),
    ip: typeof meta?.ip === 'string' ? meta?.ip.slice(0, 45) : undefined,
    expiresAt,
  };
  await RefreshToken.create(query);

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (token, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    err.cause = error.message;
    throw err;
  }

  const tokenHash = hashToken(token);

  const existing = await RefreshToken.findOne({ tokenHash }).populate('user');

  if (!existing) {
    logger.warn(`Refresh token resuse detected`, {
      sub: payload.sub,
      tokenHashPrefix: tokenHash.slice(0, 8),
    });
    if (payload.sub) {
      await RefreshToken.updateMany(
        {
          user: payload.sub,
          revoked: null,
        },
        {
          $set: {
            revoked: new Date(),
          },
        },
      );
      const err = new Error(
        'Refresh token reuse detected, all sessions revoked',
      );
      err.status = 401;
      throw err;
    }
  }
  console.log(`existing.isActive`, existing.isActive);
  if (!existing.isActive) {
    const err = new Error('Refresh token not active');
    err.status = 401;
    throw err;
  }

  existing.revoked = new Date();
  const tokens = await createTokens(existing.user, meta);
  existing.replacedByHash = hashToken(tokens.refreshToken);
  await existing.save();
  return tokens;
};

export const revokeRefreshToken = async (tokenHash) => {
  const result = await RefreshToken.updateOne(
    {
      tokenHash,
      revoked: null,
    },
    {
      $set: {
        revoked: new Date(),
      },
    },
  );

  return result.modifiedCount === 1;
};

export const revokeAllRefreshTokens = async (user) => {
  const result = await RefreshToken.updateMany(
    {
      user,
      revoked: null,
    },
    {
      $set: {
        revoked: new Date(),
      },
    },
  );

  return result.modifiedCount;
};
