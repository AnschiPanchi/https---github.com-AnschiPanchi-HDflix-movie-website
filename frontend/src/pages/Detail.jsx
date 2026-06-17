import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Plus, Check, Play, Film, User, Layers } from 'lucide-react';
import MovieSlider from '../components/MovieSlider';
import './Detail.css';
import { API_BASE_URL } from '../config';

export default function Detail({ user, onWatchlistUpdate }) {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  // TV specific state
  const [selectedServer, setSelectedServer] = useState('vidking');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);

  // Fetch movie/tv show details and recommendations
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Get details
        const detailsRes = await fetch(`${API_BASE_URL}/api/movies/${type}/${id}`);
        if (!detailsRes.ok) throw new Error('Failed to fetch details');
        const detailsData = await detailsRes.json();
        setItem(detailsData);

        // Get recommendations
        const recsRes = await fetch(`${API_BASE_URL}/api/movies/${type}/${id}/recommendations`);
        const recsData = await recsRes.json();
        setRecommendations(recsData.results || []);

        // Initialize TV seasons/episodes
        if (type === 'tv') {
          const firstSeason = detailsData.seasons && detailsData.seasons.length > 0
            ? detailsData.seasons[0].season_number
            : 1;
          // If user had history for this show, load their last watched season/episode
          const historyEntry = user?.history?.find(h => h.id.toString() === id.toString());
          if (historyEntry) {
            setSelectedSeason(historyEntry.season || firstSeason);
            setSelectedEpisode(historyEntry.episode || 1);
          } else {
            setSelectedSeason(firstSeason);
            setSelectedEpisode(1);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching details:', err);
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, id]);

  // Sync Watchlist Check
  useEffect(() => {
    if (user && item) {
      const exists = user.watchlist?.some(w => w.id.toString() === item.id.toString());
      setInWatchlist(exists);
    }
  }, [user, item]);

  // Compute episodes count for selected season
  useEffect(() => {
    if (item && type === 'tv' && item.seasons) {
      const seasonObj = item.seasons.find(s => s.season_number === Number(selectedSeason));
      if (seasonObj) {
        const count = seasonObj.episode_count || 10;
        setEpisodesList(Array.from({ length: count }, (_, i) => i + 1));
      } else {
        setEpisodesList(Array.from({ length: 8 }, (_, i) => i + 1));
      }
    }
  }, [item, type, selectedSeason]);

  // Auto save watch progress to backend history when page loads / media changes
  useEffect(() => {
    if (user && item) {
      const saveHistory = async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${API_BASE_URL}/api/user/history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: item.id,
              title: item.title || item.name,
              poster_path: item.poster_path,
              type: type,
              season: type === 'tv' ? Number(selectedSeason) : undefined,
              episode: type === 'tv' ? Number(selectedEpisode) : undefined
            })
          });
        } catch (err) {
          console.error('Error saving history:', err);
        }
      };

      // Debounce slightly
      const timer = setTimeout(saveHistory, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, item, selectedSeason, selectedEpisode]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setWatchlistLoading(true);
      const token = localStorage.getItem('token');
      if (inWatchlist) {
        // Remove
        const res = await fetch(`${API_BASE_URL}/api/user/watchlist/${item.id}`, {
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
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            type: type
          })
        });
        const data = await res.json();
        if (res.ok) {
          onWatchlistUpdate(data.watchlist);
          setInWatchlist(true);
        }
      }
      setWatchlistLoading(false);
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="error-container">
        <h2>Content Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  // Construct dynamic Embed URL based on server selection
  let embedUrl = '';
  if (selectedServer === 'vidking') {
    embedUrl = type === 'movie'
      ? `https://www.vidking.net/embed/movie/${item.id}?color=e50914`
      : `https://www.vidking.net/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}?color=e50914`;
  } else if (selectedServer === 'vidsrcto') {
    embedUrl = type === 'movie'
      ? `https://vidsrc.to/embed/movie/${item.id}`
      : `https://vidsrc.to/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}`;
  } else if (selectedServer === 'vidsrcme') {
    embedUrl = type === 'movie'
      ? `https://vidsrc.me/embed/movie/${item.id}`
      : `https://vidsrc.me/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}`;
  } else if (selectedServer === 'superembed') {
    embedUrl = type === 'movie'
      ? `https://multiembed.to/direct.php?video_id=${item.id}`
      : `https://multiembed.to/direct.php?video_id=${item.id}&s=${selectedSeason}&e=${selectedEpisode}`;
  } else if (selectedServer === 'smashystream') {
    embedUrl = type === 'movie'
      ? `https://embed.smashystream.com/playere.php?tmdb=${item.id}`
      : `https://embed.smashystream.com/playere.php?tmdb=${item.id}&season=${selectedSeason}&episode=${selectedEpisode}`;
  } else if (selectedServer === 'vidsrccc') {
    embedUrl = type === 'movie'
      ? `https://vidsrc.cc/v2/embed/movie/${item.id}`
      : `https://vidsrc.cc/v2/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}`;
  } else if (selectedServer === 'twoembed') {
    embedUrl = type === 'movie'
      ? `https://www.2embed.cc/embed/${item.id}`
      : `https://www.2embed.cc/embedtv/${item.id}&s=${selectedSeason}&e=${selectedEpisode}`;
  }

  const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0];
  const durationText = type === 'movie' 
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : `${item.seasons ? item.seasons.length : 1} Seasons`;

  return (
    <div className="detail-page fade-in">
      {/* Player Section */}
      <div className="player-wrapper">
        <div className="player-container">
          <div className="player-server-selector">
            <span className="server-label">Server</span>
            <select 
              value={selectedServer} 
              onChange={(e) => setSelectedServer(e.target.value)}
              className="player-server-dropdown"
            >
              <option value="vidking">Server 1 (Vidking)</option>
              <option value="vidsrcto">Server 2 (Vidsrc.to)</option>
              <option value="vidsrcme">Server 3 (Vidsrc.me)</option>
              <option value="superembed">Server 4 (Superembed)</option>
              <option value="smashystream">Server 5 (SmashyStream)</option>
              <option value="vidsrccc">Server 6 (Vidsrc.cc)</option>
              <option value="twoembed">Server 7 (2Embed)</option>
            </select>
          </div>
          <iframe 
            src={embedUrl}
            className="vidking-iframe"
            title={item.title || item.name}
            allowFullScreen
            scrolling="no"
            frameBorder="0"
          ></iframe>
        </div>
      </div>

      {/* Media Details */}
      <div className="details-container">
        <div className="details-main-grid">
          {/* Info Block */}
          <div className="details-info">
            <h1 className="details-title">{item.title || item.name}</h1>
            
            <div className="details-meta-row">
              <span className="details-rating">
                <Star size={16} fill="currentColor" /> {Number(item.vote_average || 0).toFixed(1)}
              </span>
              <span className="meta-bullet">•</span>
              <span className="details-year">{releaseYear}</span>
              <span className="meta-bullet">•</span>
              <span className="details-duration">{durationText}</span>
              <span className="meta-bullet">•</span>
              <span className="details-type">{type === 'tv' ? 'TV Show' : 'Movie'}</span>
            </div>

            <p className="details-overview">{item.overview}</p>

            {/* TV Show Episode Selectors */}
            {type === 'tv' && item.seasons && (
              <div className="episode-selectors-box glass">
                <h3 className="selector-title">
                  <Layers size={18} /> Select Episode
                </h3>
                <div className="selectors-row">
                  <div className="selector-group">
                    <label>Season</label>
                    <select 
                      value={selectedSeason} 
                      onChange={(e) => {
                        setSelectedSeason(Number(e.target.value));
                        setSelectedEpisode(1); // Reset episode
                      }}
                      className="selector-dropdown"
                    >
                      {item.seasons.map(s => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="selector-group">
                    <label>Episode</label>
                    <select 
                      value={selectedEpisode} 
                      onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                      className="selector-dropdown"
                    >
                      {episodesList.map(ep => (
                        <option key={ep} value={ep}>
                          Episode {ep}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="details-actions">
              <button 
                onClick={handleWatchlistToggle} 
                disabled={watchlistLoading}
                className={`btn ${inWatchlist ? 'btn-secondary' : 'btn-primary'}`}
              >
                {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>

          {/* Poster & Cast Sidebar */}
          <div className="details-sidebar">
            <img 
              src={item.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} 
              alt={item.title || item.name} 
              className="details-poster glass"
            />
            {item.cast && item.cast.length > 0 && (
              <div className="cast-box glass">
                <h3>Cast</h3>
                <div className="cast-list">
                  {item.cast.slice(0, 5).map((actor, idx) => (
                    <div key={idx} className="cast-item">
                      <div className="cast-icon">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="cast-name">{actor.name}</div>
                        <div className="cast-role">{actor.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations Slider */}
      {recommendations.length > 0 && (
        <div className="detail-recommendations">
          <MovieSlider 
            title="You May Also Like" 
            items={recommendations} 
          />
        </div>
      )}
    </div>
  );
}
