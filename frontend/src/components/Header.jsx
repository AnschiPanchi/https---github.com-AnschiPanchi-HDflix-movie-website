import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, User, LogOut, ChevronDown, List } from 'lucide-react';
import './Header.css';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBrowse, setShowBrowse] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="main-header glass">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo-container">
          <div className="logo-icon">
            <span>HD</span>
          </div>
          <span className="logo-text">HDflix</span>
        </Link>

        {/* Navigation Items */}
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <div className="nav-dropdown" onMouseEnter={() => setShowBrowse(true)} onMouseLeave={() => setShowBrowse(false)}>
            <button className="nav-dropdown-btn">
              Browse <ChevronDown size={14} />
            </button>
            {showBrowse && (
              <div className="dropdown-menu glass">
                <Link to="/search?type=movie" className="dropdown-item">Movies</Link>
                <Link to="/search?type=tv" className="dropdown-item">TV Series</Link>
                <Link to="/search?filter=top_rated" className="dropdown-item">Top Rated</Link>
              </div>
            )}
          </div>
          {user && (
            <Link to="/watchlist" className={`nav-link ${location.pathname === '/watchlist' ? 'active' : ''}`}>
              My List
            </Link>
          )}
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search movies, tv shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-submit-btn">
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Auth / Profile Area */}
        <div className="auth-profile-area">
          {user ? (
            <div 
              className="profile-menu-container"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button className="profile-btn">
                <div className="avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="username">{user.username}</span>
                <ChevronDown size={14} />
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown-menu glass scale-in">
                  <Link to="/watchlist" className="dropdown-item">
                    <List size={16} /> Watchlist
                  </Link>
                  <button onClick={onLogout} className="dropdown-item logout-btn">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary signin-btn">
              <User size={16} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
