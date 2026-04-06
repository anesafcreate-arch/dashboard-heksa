import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, Award } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    if (!username || !password) return;
    const success = login(username, password);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="Logo PT. Heksa Instrumen Sinergi" />
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
              />
            </div>
          </div>



          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" id="login-submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <LogIn size={18} /> Masuk
          </button>
        </form>

        <div className="login-footer">
          <span className="login-footer-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} /> ISO/IEC 17025 — 2017
          </span>
          <div className="login-demo-info">
            *Gunakan kredensial yang telah diberikan
          </div>
        </div>
      </div>
    </div>
  );
}
