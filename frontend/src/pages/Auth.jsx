import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, User, Mail, Lock, AlertCircle } from 'lucide-react';
import './Auth.css';
import { API_BASE_URL } from '../config';

export default function Auth({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' 
      ? `${API_BASE_URL}/api/auth/login` 
      : `${API_BASE_URL}/api/auth/register`;

    const body = mode === 'login'
      ? { email, password }
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store JWT token
      localStorage.setItem('token', data.token);
      
      // Update app state
      onLoginSuccess(data.user);
      
      // Navigate to Home
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      {/* Background decoration */}
      <div className="auth-bg-overlay"></div>

      <div className="auth-card glass scale-in">
        {/* Logo */}
        <div className="auth-logo-header">
          <div className="auth-logo-icon">
            <div className="auth-logo-play"></div>
          </div>
          <span className="auth-logo-text">HDflix</span>
        </div>

        <h2 className="auth-title">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <div className="auth-error-box">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="input-field-group">
              <label>Username</label>
              <div className="auth-input-wrapper">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="auth-input-field"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-field-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input-field"
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input-field"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle-footer">
          {mode === 'login' ? (
            <p>
              New to HDflix?{' '}
              <button onClick={() => setMode('register')} className="auth-mode-toggle">
                Sign up now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="auth-mode-toggle">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
