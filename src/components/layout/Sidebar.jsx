import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Database, LogOut, Settings, CalendarDays } from 'lucide-react';
import AlatKeluarIcon from '../ui/AlatKeluarIcon';
import { useAuth } from '../../context/AuthContext';
import { canAccessDashboard, canAccessSettings, resolveRole } from '../../utils/roles';
import './Sidebar.css';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const role = resolveRole(user?.role, user?.email);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo PT. Heksa Instrumen Sinergi" />
          <div className="sidebar-logo-text">
            <span>Heksa Instrumen</span>
            <span>SINERGI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Utama</div>

          {canAccessDashboard(role) && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-nav-icon"><LayoutDashboard size={20} /></span>
              Dashboard
            </NavLink>
          )}

          <NavLink
            to="/alat-masuk"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-nav-icon"><Package size={20} /></span>
            Alat Masuk
          </NavLink>

          <NavLink
            to="/status-alat"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-nav-icon"><AlatKeluarIcon size={20} /></span>
            Status Alat
          </NavLink>

          <NavLink
            to="/jadwal-onsite"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-nav-icon"><CalendarDays size={20} /></span>
            Jadwal Onsite
          </NavLink>

          <NavLink
            to="/summary-kalibrasi"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-nav-icon"><Database size={20} /></span>
            Summary Kalibrasi
          </NavLink>

          {canAccessSettings(role) && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: '16px' }}>
                Pengaturan
              </div>
              <NavLink
                to="/settings/users"
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar-nav-icon"><Settings size={20} /></span>
                Pengaturan
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
