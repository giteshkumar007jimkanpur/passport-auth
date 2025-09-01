import ms from 'ms';

import { isProd, refreshTokenExpiry } from '../config/env.config.js';

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    maxAge: ms(refreshTokenExpiry),
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
};

export const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0), // past date to force expire
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  });
};
