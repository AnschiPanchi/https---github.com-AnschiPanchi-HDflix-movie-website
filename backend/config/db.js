import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DB_PATH = path.join(__dirname, '..', 'db_fallback.json');

// Memory cache for local JSON database
let localDb = {
  users: []
};

// Load local database
const loadLocalDb = () => {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      localDb = JSON.parse(data);
    } else {
      saveLocalDb();
    }
  } catch (error) {
    console.error('Error loading fallback JSON database:', error);
  }
};

// Save local database
const saveLocalDb = () => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving fallback JSON database:', error);
  }
};

let useFallback = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cineby';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Timeout after 3s
    });
    console.log('MongoDB Connected Successfully!');
    useFallback = false;
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to local JSON database storage...');
    useFallback = true;
    loadLocalDb();
  }
};

// Unified database helper methods to support both MongoDB & JSON File seamlessly
export const db = {
  isFallback: () => useFallback,

  // Find user by email
  findUserByEmail: async (email) => {
    if (useFallback) {
      return localDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    // Using mongoose model (we will import models inside router/queries to prevent circular dependency)
    return await mongoose.model('User').findOne({ email: new RegExp(`^${email}$`, 'i') });
  },

  // Find user by id
  findUserById: async (id) => {
    if (useFallback) {
      return localDb.users.find(u => u.id === id);
    }
    return await mongoose.model('User').findById(id);
  },

  // Create user
  createUser: async (userData) => {
    if (useFallback) {
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        watchlist: [],
        history: [],
        createdAt: new Date().toISOString()
      };
      localDb.users.push(newUser);
      saveLocalDb();
      return newUser;
    }
    const User = mongoose.model('User');
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  },

  // Add to watchlist
  addToWatchlist: async (userId, movieItem) => {
    if (useFallback) {
      const user = localDb.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      if (!user.watchlist) user.watchlist = [];
      
      // Check if already in watchlist
      if (!user.watchlist.some(item => item.id.toString() === movieItem.id.toString())) {
        user.watchlist.push(movieItem);
        saveLocalDb();
      }
      return user.watchlist;
    }
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (!user.watchlist.some(item => item.id.toString() === movieItem.id.toString())) {
      user.watchlist.push(movieItem);
      await user.save();
    }
    return user.watchlist;
  },

  // Remove from watchlist
  removeFromWatchlist: async (userId, itemId) => {
    if (useFallback) {
      const user = localDb.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      if (!user.watchlist) user.watchlist = [];
      
      user.watchlist = user.watchlist.filter(item => item.id.toString() !== itemId.toString());
      saveLocalDb();
      return user.watchlist;
    }
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.watchlist = user.watchlist.filter(item => item.id.toString() !== itemId.toString());
    await user.save();
    return user.watchlist;
  },

  // Update history
  updateHistory: async (userId, historyItem) => {
    if (useFallback) {
      const user = localDb.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      if (!user.history) user.history = [];
      
      // Remove previous entry of the same movie/tv show if exists
      user.history = user.history.filter(item => item.id.toString() !== historyItem.id.toString());
      
      // Prepend the new one so it shows up first
      user.history.unshift({
        ...historyItem,
        updatedAt: new Date().toISOString()
      });
      
      // Limit history to 30 items
      if (user.history.length > 30) {
        user.history.pop();
      }
      
      saveLocalDb();
      return user.history;
    }
    
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.history = user.history.filter(item => item.id.toString() !== historyItem.id.toString());
    user.history.unshift({
      id: historyItem.id,
      title: historyItem.title,
      poster_path: historyItem.poster_path,
      type: historyItem.type,
      season: historyItem.season,
      episode: historyItem.episode,
      updatedAt: new Date()
    });
    
    if (user.history.length > 30) {
      user.history.pop();
    }
    
    await user.save();
    return user.history;
  }
};
