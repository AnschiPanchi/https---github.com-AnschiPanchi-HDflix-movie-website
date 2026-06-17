import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import './MovieSlider.css';

export default function MovieSlider({ title, items, subtitle, showNumbers = false }) {
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      sliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="slider-section">
      <div className="slider-header-container">
        <h2 className="slider-title">
          {title} {subtitle && <span className="slider-subtitle">{subtitle}</span>}
        </h2>
        <div className="slider-controls">
          <button className="slider-control-btn" onClick={() => scroll('left')}>
            <ChevronLeft size={20} />
          </button>
          <button className="slider-control-btn" onClick={() => scroll('right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="slider-outer-wrapper">
        <div className="slider-track" ref={sliderRef}>
          {items.map((item, index) => {
            const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
            const mediaTypeLabel = item.media_type === 'tv' ? 'TV Show' : 'Movie';

            return (
              <div 
                key={item.id} 
                className={`movie-card-wrapper ${showNumbers ? 'has-number' : ''}`}
                onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
              >
                {showNumbers && (
                  <div className="card-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                )}
                <div className="movie-card">
                  <img 
                    src={item.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                    alt={item.title || item.name} 
                    className="movie-poster"
                    loading="lazy"
                  />
                  <div className="card-overlay">
                    <button className="card-play-btn">
                      <Play size={20} fill="white" />
                    </button>
                    <div className="card-meta">
                      <h4 className="card-title">{item.title || item.name}</h4>
                      <div className="card-submeta">
                        <span className="card-rating">
                          <Star size={12} fill="currentColor" /> {Number(item.vote_average || 0).toFixed(1)}
                        </span>
                        <span className="card-year">{releaseYear}</span>
                        <span className="card-type">{mediaTypeLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
