import { configDotenv } from "dotenv";
configDotenv();
import Joi from "joi";

const envSchema = Joi.object({
  PORT: Joi.string().default(3000),
  MONGO_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().required(),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
  abortEarly: false,
});

if (error) {
  throw new Error(`❌ Env validation error: ${error.message}`);
}
export const isProd = process.env.NODE_ENV === "production";

const secretMin = isProd ? 64 : 32;

Joi.assert(envVars.JWT_SECRET, Joi.string().min(secretMin));

export const port = envVars.PORT;
export const mongoUri = envVars.MONGO_URI;
export const jwtSecret = envVars.JWT_SECRET;
