import mongoose from 'mongoose';

const WatchlistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  poster_path: { type: String },
  vote_average: { type: Number },
  release_date: { type: String },
  type: { type: String, enum: ['movie', 'tv'], required: true }
});

const HistoryItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  poster_path: { type: String },
  type: { type: String, enum: ['movie', 'tv'], required: true },
  season: { type: Number },
  episode: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  watchlist: [WatchlistItemSchema],
  history: [HistoryItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
