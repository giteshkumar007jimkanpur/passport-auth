import ms from 'ms';

import { isProd, refreshTokenExpiry } from '../config/env.config.js';

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    maxAge: ms(refreshTokenExpiry) / 1000,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
};

export const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    // <-- Add empty string value
    httpOnly: true,
    expires: new Date(0), // <-- Add expiration
    sameSite: 'strict',
    secure: isProd,
  });
};
