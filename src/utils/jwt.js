import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import {
  accessTokenSecret,
  issuer,
  audience,
  accessTokenExpiry,
  refreshTokenExpiry,
  refreshTokenSecret,
} from '../config/env.config.js';

export const signAccessToken = (payload) => {
  const iat = Math.floor(Date.now() / 1000);
  const jti = uuidv4();
  const opts = {
    algorithm: 'HS256',
    expiresIn: accessTokenExpiry,
    issuer,
    audience,
  };
  return jwt.sign(
    { ...payload, typ: 'access', iat, jti },
    accessTokenSecret,
    opts,
  );
};

export const signRefreshToken = (payload) => {
  const iat = Math.floor(Date.now() / 1000);
  const jti = uuidv4();
  const opts = {
    algorithm: 'HS256',
    expiresIn: refreshTokenExpiry,
    issuer,
    audience,
  };
  return jwt.sign(
    { ...payload, typ: 'refresh', iat, jti },
    refreshTokenSecret,
    opts,
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, accessTokenSecret, {
    algorithms: ['HS256'],
    issuer,
    audience,
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshTokenSecret, {
    algorithms: ['HS256'],
    issuer,
    audience,
  });
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
