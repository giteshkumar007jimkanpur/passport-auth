import { configDotenv } from 'dotenv';
configDotenv();
import Joi from 'joi';

const envSchema = Joi.object({
  PORT: Joi.string().default(3000),
  MONGO_URI: Joi.string().uri().required(),
  SESSION_SECRET: Joi.string().required(),

  ACCESS_TOKEN_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),

  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),

JWT_ISSUER: Joi.string().default('advance-jwt-auth'),
JWT_AUDIENCE: Joi.string().default('advance-jwt-auth-client'),
  

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
  abortEarly: false,
});

if (error) {
  throw new Error(`❌ Env validation error: ${error.message}`);
}
export const isProd = process.env.NODE_ENV === 'production';

const secretMin = isProd ? 64 : 32;

Joi.assert(envVars.SESSION_SECRET, Joi.string().min(secretMin));
Joi.assert(envVars.ACCESS_TOKEN_SECRET, Joi.string().min(secretMin));
Joi.assert(envVars.REFRESH_TOKEN_SECRET, Joi.string().min(secretMin));

export const port = envVars.PORT;
export const mongoUri = envVars.MONGO_URI;
export const sessionSecret = envVars.SESSION_SECRET;

export const accessTokenExpiry = envVars.ACCESS_TOKEN_EXPIRY;
export const accessTokenSecret = envVars.ACCESS_TOKEN_SECRET;

export const refreshTokenExpiry = envVars.REFRESH_TOKEN_EXPIRY;
export const refreshTokenSecret = envVars.REFRESH_TOKEN_SECRET;

export const audience = envVars.JWT_AUDIENCE;
export const issuer = envVars.JWT_ISSUER;

export const googleClientId = envVars.GOOGLE_CLIENT_ID;
export const googleClientSecret = envVars.GOOGLE_CLIENT_SECRET;
export const clientUrl = envVars.CLIENT_URL;
