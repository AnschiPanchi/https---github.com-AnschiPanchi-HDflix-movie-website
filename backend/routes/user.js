import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// @route   POST api/user/watchlist
// @desc    Add a movie/show to user's watchlist
router.post('/watchlist', authenticateToken, async (req, res) => {
  const { id, title, poster_path, vote_average, release_date, type } = req.body;

  if (!id || !title || !type) {
    return res.status(400).json({ message: 'Movie ID, Title, and Type are required.' });
  }

  try {
    const updatedWatchlist = await db.addToWatchlist(req.user.id, {
      id: id.toString(),
      title,
      poster_path,
      vote_average: Number(vote_average) || 0,
      release_date,
      type
    });
    res.json({ watchlist: updatedWatchlist });
  } catch (error) {
    console.error('Watchlist add error:', error);
    res.status(500).json({ message: 'Server error adding to watchlist.' });
  }
});

// @route   DELETE api/user/watchlist/:id
// @desc    Remove a movie/show from watchlist
router.delete('/watchlist/:id', authenticateToken, async (req, res) => {
  const itemId = req.params.id;

  try {
    const updatedWatchlist = await db.removeFromWatchlist(req.user.id, itemId);
    res.json({ watchlist: updatedWatchlist });
  } catch (error) {
    console.error('Watchlist remove error:', error);
    res.status(500).json({ message: 'Server error removing from watchlist.' });
  }
});

// @route   POST api/user/history
// @desc    Save/update watch progress history
router.post('/history', authenticateToken, async (req, res) => {
  const { id, title, poster_path, type, season, episode } = req.body;

  if (!id || !title || !type) {
    return res.status(400).json({ message: 'Movie ID, Title, and Type are required.' });
  }

  try {
    const updatedHistory = await db.updateHistory(req.user.id, {
      id: id.toString(),
      title,
      poster_path,
      type,
      season: type === 'tv' ? Number(season) || 1 : undefined,
      episode: type === 'tv' ? Number(episode) || 1 : undefined
    });
    res.json({ history: updatedHistory });
  } catch (error) {
    console.error('History update error:', error);
    res.status(500).json({ message: 'Server error updating watch history.' });
  }
});

export default router;
