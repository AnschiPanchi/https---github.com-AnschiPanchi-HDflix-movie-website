import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Plus, Check } from 'lucide-react';
import MovieSlider from '../components/MovieSlider';
import './Home.jsx.css';
import { API_BASE_URL } from '../config';

export default function Home({ user, onWatchlistUpdate }) {
  const navigate = useNavigate();
  const [heroMovie, setHeroMovie] = useState(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [netflixOriginals, setNetflixOriginals] = useState([]);
  
  const [trendingTab, setTrendingTab] = useState('movie'); // 'movie' or 'tv'
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch API details
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        // Get trending all
        const trendingRes = await fetch(`${API_BASE_URL}/api/movies/trending?type=all`);
        const trendingData = await trendingRes.json();
        
        // Pick high quality hero movie (e.g. Pressure, or first result with backdrop)
        if (trendingData.results && trendingData.results.length > 0) {
          // Try to find "The Shawshank Redemption" first for hero banner
          const shawshank = trendingData.results.find(m => m.id === '278');
          setHeroMovie(shawshank || trendingData.results[0]);
        }

        // Get trending movies
        const moviesRes = await fetch(`${API_BASE_URL}/api/movies/trending?type=movie`);
        const moviesData = await moviesRes.json();
        setTrendingMovies(moviesData.results || []);

        // Get trending tv
        const tvRes = await fetch(`${API_BASE_URL}/api/movies/trending?type=tv`);
        const tvData = await tvRes.json();
        setTrendingTV(tvData.results || []);

        // Get top rated
        const topRatedRes = await fetch(`${API_BASE_URL}/api/movies/top_rated?type=movie`);
        const topRatedData = await topRatedRes.json();
        setTopRated(topRatedData.results || []);

        // Get Only on Netflix (using TV shows as Netflix original representation)
        const netflixRes = await fetch(`${API_BASE_URL}/api/movies/popular?type=tv`);
        const netflixData = await netflixRes.json();
        setNetflixOriginals(netflixData.results || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching home page data:', error);
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Check if hero movie is in user's watchlist
  useEffect(() => {
    if (user && heroMovie) {
      const exists = user.watchlist?.some(item => item.id.toString() === heroMovie.id.toString());
      setInWatchlist(exists);
    }
  }, [user, heroMovie]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (inWatchlist) {
        // Remove
        const res = await fetch(`${API_BASE_URL}/api/user/watchlist/${heroMovie.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          onWatchlistUpdate(data.watchlist);
          setInWatchlist(false);
        }
      } else {
        // Add
        const res = await fetch(`${API_BASE_URL}/api/user/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: heroMovie.id,
            title: heroMovie.title || heroMovie.name,
            poster_path: heroMovie.poster_path,
            vote_average: heroMovie.vote_average,
            release_date: heroMovie.release_date || heroMovie.first_air_date,
            type: heroMovie.media_type || 'movie'
          })
        });
        const data = await res.json();
        if (res.ok) {
          onWatchlistUpdate(data.watchlist);
          setInWatchlist(true);
        }
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader"></div>
      </div>
    );
  }

  const releaseYear = heroMovie ? (heroMovie.release_date || heroMovie.first_air_date || '').split('-')[0] : '';
  const heroGenres = heroMovie?.genres?.map(g => g.name).join(' · ') || (heroMovie?.media_type === 'tv' ? 'TV Series' : 'Movie');

  return (
    <div className="home-page fade-in">
      {/* Hero Banner Section */}
      {heroMovie && (
        <section 
          className="hero-banner"
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(6, 6, 8, 0.95) 20%, rgba(6, 6, 8, 0.6) 50%, rgba(6, 6, 8, 0.1) 80%, rgba(6, 6, 8, 0.95) 100%), linear-gradient(to bottom, rgba(6, 6, 8, 0.4) 0%, rgba(6, 6, 8, 0) 50%, rgba(6, 6, 8, 0.7) 80%, rgba(6, 6, 8, 0.95) 100%), url(${heroMovie.backdrop_path})` 
          }}
        >
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.title || heroMovie.name}</h1>
            
            <div className="hero-meta">
              <span className="hero-rating">
                <Star size={16} fill="currentColor" /> {Number(heroMovie.vote_average || 0).toFixed(1)}
              </span>
              <span className="hero-divider">|</span>
              <span className="hero-year">{releaseYear}</span>
              <span className="hero-divider">|</span>
              <span className="hero-genres">{heroGenres}</span>
            </div>
            
            <p className="hero-overview">{heroMovie.overview}</p>
            
            <div className="hero-actions">
              <button 
                onClick={() => navigate(`/watch/${heroMovie.media_type || 'movie'}/${heroMovie.id}`)}
                className="btn btn-primary btn-play"
              >
                <Play size={20} fill="white" /> Play
              </button>
              <button 
                onClick={handleWatchlistToggle}
                className="btn btn-secondary btn-more"
              >
                {inWatchlist ? <Check size={20} /> : <Plus size={20} />} 
                {inWatchlist ? 'Added to List' : 'Add to List'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main categories listing sliders */}
      <div className="home-sliders-container">
        {/* Top 10 Today */}
        <MovieSlider 
          title="TOP 10 Today" 
          items={[...trendingMovies, ...trendingTV].slice(0, 10)} 
          showNumbers={true}
        />

        {/* Trending Today (With Tab selectors) */}
        <div className="tab-slider-wrapper">
          <div className="tab-slider-header">
            <div className="slider-header-left">
              <h2 className="slider-title">Trending Today</h2>
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${trendingTab === 'movie' ? 'active' : ''}`}
                  onClick={() => setTrendingTab('movie')}
                >
                  Movies
                </button>
                <button 
                  className={`tab-btn ${trendingTab === 'tv' ? 'active' : ''}`}
                  onClick={() => setTrendingTab('tv')}
                >
                  Series
                </button>
              </div>
            </div>
          </div>
          <MovieSlider 
            title="" 
            items={trendingTab === 'movie' ? trendingMovies : trendingTV} 
          />
        </div>

        {/* Only on Netflix */}
        <MovieSlider 
          title="Only on Netflix" 
          items={netflixOriginals} 
        />

        {/* Top rated */}
        <MovieSlider 
          title="Top rated" 
          items={topRated} 
        />
      </div>
    </div>
  );
}
