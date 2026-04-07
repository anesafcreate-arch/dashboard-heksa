import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Database, LogOut, Settings } from 'lucide-react';
import AlatKeluarIcon from '../ui/AlatKeluarIcon';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const MENU_ITEMS = {
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/alat-masuk', label: 'Alat Masuk', icon: <Package size={20} /> },
    { path: '/alat-keluar', label: 'Alat Keluar', icon: <AlatKeluarIcon size={20} /> },
    { path: '/database', label: 'Summary Kalibrasi', icon: <Database size={20} /> },
  ],
  teknisi: [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/alat-masuk', label: 'Alat Masuk', icon: <Package size={20} /> },
    { path: '/alat-keluar', label: 'Alat Keluar', icon: <AlatKeluarIcon size={20} /> },
  ],
  direktur: [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/alat-masuk', label: 'Alat Masuk', icon: <Package size={20} /> },
    { path: '/alat-keluar', label: 'Alat Keluar', icon: <AlatKeluarIcon size={20} /> },
    { path: '/alat', label: 'Summary Kalibrasi', icon: <Database size={20} /> },
    { path: '/settings', label: 'Pengaturan', icon: <Settings size={20} />, section: 'Pengaturan' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const menuItems = MENU_ITEMS[user?.role] || [];

  // Separate main menu from settings
  const mainItems = menuItems.filter((item) => !item.section);
  const settingsItems = menuItems.filter((item) => item.section);

  const getRoleLabel = (role) => {
    const labels = { admin: 'Administrasi', teknisi: 'Teknisi', direktur: 'Direktur' };
    return labels[role] || role;
  };

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
          {mainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {settingsItems.length > 0 && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: '16px' }}>
                Pengaturan
              </div>
              {settingsItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
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
