import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, name, interests } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      name: name || username,
      interests: interests || ['reading', 'music', 'programming']
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        interests: user.interests
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        interests: user.interests
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      interests: req.user.interests,
      preferences: req.user.preferences
    }
  });
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, interests, preferences } = req.body;
    const updated = await User.updateById(req.user._id, {
      name: name || req.user.name,
      interests: interests || req.user.interests,
      preferences: preferences || req.user.preferences
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user profile', error: err.message });
  }
});

export default router;
