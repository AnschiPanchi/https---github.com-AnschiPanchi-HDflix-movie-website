import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Trash2, Calendar, Film } from 'lucide-react';
import './Watchlist.css';
import { API_BASE_URL } from '../config';

export default function Watchlist({ user, onWatchlistUpdate }) {
  const navigate = useNavigate();

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/user/watchlist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        onWatchlistUpdate(data.watchlist);
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  if (!user) {
    return (
      <div className="watchlist-page unauth-watchlist flex-center">
        <div className="unauth-box glass text-center">
          <Film size={48} className="unauth-icon" />
          <h2>Manage Your Watchlist</h2>
          <p>Please sign in to save movies, TV shows, and track your watch progress.</p>
          <button className="btn btn-primary" onClick={() => navigate('/auth')}>
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const { watchlist = [], history = [] } = user;

  return (
    <div className="watchlist-page fade-in">
      <div className="watchlist-container">
        {/* Watch History / Continue Watching */}
        {history.length > 0 && (
          <section className="watchlist-section">
            <h2 className="section-title">Continue Watching</h2>
            <div className="history-grid">
              {history.map(item => {
                const isTv = item.type === 'tv';
                return (
                  <div 
                    key={item.id} 
                    className="history-card glass"
                    onClick={() => navigate(`/watch/${item.type}/${item.id}`)}
                  >
                    <div className="history-poster-wrapper">
                      <img 
                        src={item.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                        alt={item.title} 
                        className="history-poster"
                      />
                      <div className="history-play-overlay">
                        <Play size={24} fill="white" />
                      </div>
                    </div>
                    <div className="history-details">
                      <h4 className="history-title">{item.title}</h4>
                      <div className="history-progress-label">
                        {isTv ? `Season ${item.season} · Episode ${item.episode}` : 'Watched'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Watchlist */}
        <section className="watchlist-section">
          <h2 className="section-title">My Watchlist</h2>
          {watchlist.length > 0 ? (
            <div className="watchlist-grid">
              {watchlist.map(item => {
                const releaseYear = (item.release_date || '').split('-')[0] || 'N/A';
                return (
                  <div 
                    key={item.id} 
                    className="watchlist-card"
                    onClick={() => navigate(`/watch/${item.type || 'movie'}/${item.id}`)}
                  >
                    <div className="watchlist-card-poster-wrapper">
                      <img 
                        src={item.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                        alt={item.title} 
                        className="watchlist-card-poster"
                      />
                      <div className="watchlist-card-overlay">
                        <div className="watchlist-card-play">
                          <Play size={18} fill="white" />
                        </div>
                        <button 
                          className="watchlist-remove-btn"
                          onClick={(e) => handleRemove(e, item.id)}
                          title="Remove from watchlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="watchlist-card-details">
                      <h4 className="watchlist-card-title">{item.title}</h4>
                      <div className="watchlist-card-meta">
                        <span className="watchlist-card-rating">
                          <Star size={12} fill="currentColor" /> {Number(item.vote_average || 0).toFixed(1)}
                        </span>
                        <span>{releaseYear}</span>
                        <span className="watchlist-card-type">
                          {item.type === 'tv' ? 'TV' : 'Movie'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-watchlist-box glass">
              <p>Your watchlist is empty. Add titles from the Home or Search pages to keep track of them here.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/search')}>
                Browse Titles
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
