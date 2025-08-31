const validateRequest = (schema) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      message: 'Request Body must be a valid JSON object.',
    });
  }
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return next(error);
  }
  req.body = value;
  next();
};

export default validateRequest;
