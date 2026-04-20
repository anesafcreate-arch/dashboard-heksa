import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, Award } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!username || !password) return;
    
    setIsLoggingIn(true);

    const normalizedUsername = username.trim().toLowerCase();
    const emailLogin = normalizedUsername.includes('@')
      ? normalizedUsername
      : `${normalizedUsername}@heksa.com`;

    try {
      const success = await login(emailLogin, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error("Authentication Error:", err);
    } finally {
      setTimeout(() => setIsLoggingIn(false), 300);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="PT. Heksa Instrumen Sinergi" />
          <h1>Heksa Instrumen</h1>
          <p>SINERGI</p>
        </div>

        <p className="login-subtitle">
          Dashboard Laboratorium Kalibrasi
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="login-input-wrapper">
              <span className="login-input-icon"><User size={18} /></span>
              <input
                id="login-username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoggingIn}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="login-input-wrapper">
              <span className="login-input-icon"><Lock size={18} /></span>
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoggingIn}
                required
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button 
            type="submit" 
            className="login-btn" 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              "Memproses..."
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} /> Masuk
              </span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span className="login-footer-badge">
            <Award size={14} /> LKN-264-IDN
          </span>
          <div className="login-demo-info">
            *Gunakan kredensial yang telah diberikan oleh IT
          </div>
        </div>
      </div>
    </div>
  );
}
