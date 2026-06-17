import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import User from '../models/User.js'; // Ensure registered with mongoose

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cinebysecretkey12345';

// Middleware to protect routes and verify JWT
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.user = {
      id: user.id || user._id.toString(),
      username: user.username,
      email: user.email,
      watchlist: user.watchlist || [],
      history: user.history || []
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await db.createUser({
      username,
      email,
      password: hashedPassword
    });

    const userId = newUser.id || newUser._id.toString();

    // Create JWT Token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        watchlist: [],
        history: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const userId = user.id || user._id.toString();

    // Create JWT Token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        watchlist: user.watchlist || [],
        history: user.history || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
