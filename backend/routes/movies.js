import express from 'express';
import axios from 'axios';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

const router = express.Router();

// TMDB API Details
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper to get TMDB URL prefix
const getApiKey = () => process.env.TMDB_API_KEY;

// Robust helper to perform requests to TMDB with automatic retry on network glitches
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 8000 });
    } catch (err) {
      const isNetworkError = !err.response || err.code === 'ECONNRESET' || err.code === 'ETIMEOUT' || err.code === 'EADDRINUSE';
      if (isNetworkError && i < retries - 1) {
        console.warn(`TMDB request failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms... Error: ${err.message}`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
};

// Helper to normalize TV/Movie fields and build full image URLs
const normalize = (item) => {
  if (!item) return null;
  const isMovie = item.title !== undefined || item.media_type === 'movie';
  
  // Format poster path to a full URL
  let poster = item.poster_path;
  if (poster && !poster.startsWith('http')) {
    poster = `https://image.tmdb.org/t/p/w500${poster}`;
  }
  
  // Format backdrop path to a full URL
  let backdrop = item.backdrop_path;
  if (backdrop && !backdrop.startsWith('http')) {
    backdrop = `https://image.tmdb.org/t/p/original${backdrop}`;
  }

  return {
    id: item.id.toString(),
    title: isMovie ? (item.title || item.original_title) : (item.name || item.original_name),
    name: isMovie ? (item.title || item.original_title) : (item.name || item.original_name),
    original_title: isMovie ? item.original_title : item.original_name,
    overview: item.overview,
    poster_path: poster,
    backdrop_path: backdrop,
    media_type: isMovie ? 'movie' : 'tv',
    vote_average: item.vote_average,
    release_date: isMovie ? item.release_date : item.first_air_date,
    first_air_date: isMovie ? item.release_date : item.first_air_date,
    genres: item.genres || [],
    runtime: item.runtime || 0,
    tagline: item.tagline || ''
  };
};

// Route: Get base /api/movies endpoint list (useful for initial tests/debugging)
router.get('/', async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }
  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/trending/all/day?api_key=${apiKey}`);
    const normalized = (response.data.results || []).map(item => normalize({ ...item, media_type: item.media_type }));
    res.json({ results: normalized });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies from TMDB' });
  }
});

// Route: Get Trending Today
router.get('/trending', async (req, res) => {
  const apiKey = getApiKey();
  const type = req.query.type || 'all'; // 'all', 'movie', 'tv'
  
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/trending/${type}/day?api_key=${apiKey}`);
    const results = (response.data.results || []).map(item => normalize({
      ...item,
      media_type: item.media_type || (type === 'all' ? undefined : type)
    }));
    return res.json({
      page: response.data.page,
      results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('TMDB trending fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending content' });
  }
});

// Route: Get Popular
router.get('/popular', async (req, res) => {
  const apiKey = getApiKey();
  const type = req.query.type || 'movie'; // 'movie', 'tv'

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/${type}/popular?api_key=${apiKey}`);
    const results = (response.data.results || []).map(item => normalize({ ...item, media_type: type }));
    return res.json({
      page: response.data.page,
      results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('TMDB popular fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch popular content' });
  }
});

// Route: Get Top Rated
router.get('/top_rated', async (req, res) => {
  const apiKey = getApiKey();
  const type = req.query.type || 'movie'; // 'movie', 'tv'

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/${type}/top_rated?api_key=${apiKey}`);
    const results = (response.data.results || []).map(item => normalize({ ...item, media_type: type }));
    return res.json({
      page: response.data.page,
      results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('TMDB top rated fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch top rated content' });
  }
});

// Route: Search Movies & TV Shows
router.get('/search', async (req, res) => {
  const apiKey = getApiKey();
  const query = req.query.query || '';

  if (!query) {
    return res.json({ results: [] });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
    const results = (response.data.results || [])
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => normalize(item));
    
    return res.json({
      page: response.data.page,
      results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('TMDB search fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to search content' });
  }
});

// Route: Get details by ID and Type
router.get('/:type/:id', async (req, res) => {
  const apiKey = getApiKey();
  const { type, id } = req.params;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const details = await fetchWithRetry(`${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}`);
    const credits = await fetchWithRetry(`${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${apiKey}`);
    
    const detailsData = details.data;
    
    // Normalize basic properties, preserving fields like cast/seasons
    const normalized = normalize({ ...detailsData, media_type: type });
    normalized.cast = credits.data.cast ? credits.data.cast.slice(0, 10) : [];
    
    // TV show seasons list (excludes Season 0 Specials & empty seasons)
    if (type === 'tv') {
      normalized.seasons = (detailsData.seasons || [])
        .filter(s => s.season_number > 0 && s.episode_count > 0)
        .map(s => ({
          season_number: s.season_number,
          episode_count: s.episode_count,
          name: s.name || `Season ${s.season_number}`
        }));
    }

    return res.json(normalized);
  } catch (error) {
    console.error('TMDB details fetch failed:', error.message);
    res.status(404).json({ message: 'Content not found' });
  }
});

// Route: Get recommendations/related
router.get('/:type/:id/recommendations', async (req, res) => {
  const apiKey = getApiKey();
  const { type, id } = req.params;

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  try {
    const response = await fetchWithRetry(`${TMDB_BASE_URL}/${type}/${id}/recommendations?api_key=${apiKey}`);
    const results = (response.data.results || []).map(item => normalize({ ...item, media_type: type }));
    return res.json({
      page: response.data.page,
      results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results
    });
  } catch (error) {
    console.error('TMDB recommendations fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
