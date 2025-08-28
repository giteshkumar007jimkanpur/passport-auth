export const register = async (req, res, next) => {
  try {
    console.log(`req.body`, req.body);
    return res.status(201).json({
      message: 'User Registered Successfully',
    });
  } catch (error) {
    next(error);
  }
};
