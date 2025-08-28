import Joi from 'joi';

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/['a-z']/, 'lowercase')
  .pattern(/['A-Z']/, 'uppercase')
  .pattern(/\d/, 'digit')
  .pattern(/['A-Za-z0-9']/, 'symbol')
  .required()
  .messages({
    'string.min': 'Password must be atleast 8 characters long',
    'string.patter.name': `Password must include at least one {#name}`,
  });

const register = Joi.object({
  name: Joi.string().allow('').optional(),
  email: Joi.string().email().lowercase().required(),
  password: passwordRules,
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Confirm password must match password.',
  }),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

export default { register, login };
