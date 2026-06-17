import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Search from './pages/Search';
import Auth from './pages/Auth';
import Watchlist from './pages/Watchlist';
import './App.css';
import { API_BASE_URL } from './config';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticate user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleWatchlistUpdate = (updatedWatchlist) => {
    setUser(prev => prev ? { ...prev, watchlist: updatedWatchlist } : null);
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Header user={user} onLogout={handleLogout} />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={<Home user={user} onWatchlistUpdate={handleWatchlistUpdate} />} 
            />
            <Route 
              path="/watch/:type/:id" 
              element={<Detail user={user} onWatchlistUpdate={handleWatchlistUpdate} />} 
            />
            <Route 
              path="/search" 
              element={<Search />} 
            />
            <Route 
              path="/watchlist" 
              element={<Watchlist user={user} onWatchlistUpdate={handleWatchlistUpdate} />} 
            />
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/" /> : <Auth onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
