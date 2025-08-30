import { User } from '../models/index.js';

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
      password: passwordHash,
      name,
    });
    return res.status(201).json({
      message: 'User Registered Successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'User Logged-In Successful ...',
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'This is a protected route',
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const wasAuthenticated = req.isAuthenticated();
    const userEmail = req.user ? req.user?.email : null;
    const sessionId = req.sessionID;
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        return res.status(200).json({
          message: 'Logged out successfully',
          wasAuthenticated,
          userEmail,
          sessionId,
        });
      });
    });
  } catch (error) {
    next(error);
  }
};
