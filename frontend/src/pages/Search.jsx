import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Star, Play } from 'lucide-react';
import './Search.css';
import { API_BASE_URL } from '../config';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all'; // 'all', 'movie', 'tv'
  const filterParam = searchParams.get('filter') || 'popular'; // 'popular', 'top_rated'

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync state with url params
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Fetch search or list results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (queryParam) {
          // Search query
          endpoint = `${API_BASE_URL}/api/movies/search?query=${encodeURIComponent(queryParam)}`;
        } else {
          // Category browsing
          const type = typeParam === 'all' ? 'movie' : typeParam;
          endpoint = `${API_BASE_URL}/api/movies/${filterParam}?type=${type}`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        
        let fetchedResults = data.results || [];
        
        // Filter by media type if browse mode and 'all' is selected
        if (!queryParam && typeParam !== 'all') {
          fetchedResults = fetchedResults.filter(x => x.media_type === typeParam);
        } else if (queryParam && typeParam !== 'all') {
          fetchedResults = fetchedResults.filter(x => x.media_type === typeParam);
        }

        setResults(fetchedResults);
      } catch (err) {
        console.error('Error fetching search results:', err);
      }
      setLoading(false);
    };

    fetchResults();
  }, [queryParam, typeParam, filterParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchInput, type: typeParam, filter: filterParam });
  };

  const handleTypeChange = (newType) => {
    setSearchParams({ q: queryParam, type: newType, filter: filterParam });
  };

  const handleFilterChange = (newFilter) => {
    setSearchParams({ q: queryParam, type: typeParam, filter: newFilter });
  };

  return (
    <div className="search-page fade-in">
      <div className="search-container">
        {/* Search header with controls */}
        <div className="search-header glass">
          <form onSubmit={handleSearchSubmit} className="search-form-row">
            <div className="search-box">
              <SearchIcon className="search-box-icon" size={20} />
              <input
                type="text"
                placeholder="Type to search movies or TV series..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-main-input"
              />
              <button type="submit" className="btn btn-primary search-btn">
                Search
              </button>
            </div>
          </form>

          {/* Filtering row */}
          <div className="filter-row">
            <div className="filter-group">
              <span className="filter-label"><Filter size={14} /> Type:</span>
              <div className="filter-options">
                <button
                  className={`filter-opt-btn ${typeParam === 'all' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('all')}
                >
                  All
                </button>
                <button
                  className={`filter-opt-btn ${typeParam === 'movie' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('movie')}
                >
                  Movies
                </button>
                <button
                  className={`filter-opt-btn ${typeParam === 'tv' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('tv')}
                >
                  TV Shows
                </button>
              </div>
            </div>

            {!queryParam && (
              <div className="filter-group">
                <span className="filter-label">Sort:</span>
                <div className="filter-options">
                  <button
                    className={`filter-opt-btn ${filterParam === 'popular' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('popular')}
                  >
                    Popular
                  </button>
                  <button
                    className={`filter-opt-btn ${filterParam === 'top_rated' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('top_rated')}
                  >
                    Top Rated
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          {queryParam ? (
            <h3>Search results for "{queryParam}" ({results.length} found)</h3>
          ) : (
            <h3>Explore {typeParam === 'all' ? 'Movies & TV Series' : typeParam === 'movie' ? 'Movies' : 'TV Series'}</h3>
          )}
        </div>

        {/* Results grid */}
        {loading ? (
          <div className="search-loading-box">
            <div className="loader"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="results-grid">
            {results.map(item => {
              const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
              return (
                <div
                  key={item.id}
                  className="search-card"
                  onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
                >
                  <div className="search-card-poster-wrapper">
                    <img
                      src={item.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'}
                      alt={item.title || item.name}
                      className="search-card-poster"
                      loading="lazy"
                    />
                    <div className="search-card-overlay">
                      <div className="search-card-play">
                        <Play size={20} fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="search-card-details">
                    <h4 className="search-card-title">{item.title || item.name}</h4>
                    <div className="search-card-meta">
                      <span className="search-card-rating">
                        <Star size={12} fill="currentColor" /> {Number(item.vote_average || 0).toFixed(1)}
                      </span>
                      <span>{releaseYear}</span>
                      <span className="search-card-type">{item.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results-box glass">
            <p>No titles found. Try adjusting your query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
