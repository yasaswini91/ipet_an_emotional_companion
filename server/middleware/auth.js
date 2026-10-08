import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('FATAL: JWT_SECRET environment variable is required in production.'); })()
    : 'ipet_dev_jwt_secret_2026_case_study_secure'
);

export function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User belonging to token no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired', error: err.message });
  }
}
