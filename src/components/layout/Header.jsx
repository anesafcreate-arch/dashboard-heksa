import { useEffect, useRef, useState } from 'react';
import { Bell, Camera, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import './Header.css';

export default function Header({ onToggleSidebar }) {
  const { user, updateProfilePhoto } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';

    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstName = () => {
    if (!user?.nama_lengkap && !user?.nama) return 'Pengguna';

    const fullName = user?.nama_lengkap || user?.nama || 'Pengguna';
    return fullName.split(' ')[0];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatDate = () =>
    new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const timeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
    setShowProfileMenu(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-hamburger" onClick={onToggleSidebar}>
          <Menu size={22} />
        </button>
        <div className="header-greeting">
          {getGreeting()}, <strong>{getFirstName()}</strong>
        </div>
      </div>

      <div className="header-right">
        <span className="header-date">{formatDate()}</span>

        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className={`notification-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            id="notification-bell"
            aria-label="Buka notifikasi"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>Notifikasi</h4>
                {unreadCount > 0 && (
                  <button className="notification-mark-read" onClick={markAllRead}>
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="notification-list">
                {(notifications || []).length === 0 ? (
                  <div className="notification-empty">
                    Belum ada notifikasi
                  </div>
                ) : (
                  (notifications || []).map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => markRead(notif.id)}
                    >
                      <div className="notification-item-content">
                        <div className="notification-item-message">{notif.message}</div>
                        <div className="notification-item-time">{timeAgo(notif.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-photo-container">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user?.nama_lengkap || user?.nama || 'Profil'} className="profile-photo" />
              ) : (
                <div className="profile-photo-fallback">
                  {getInitials(user?.nama_lengkap || user?.nama)}
                </div>
              )}
            </div>
            <span className="profile-trigger-name">{getFirstName()}</span>
            <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-photo">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user?.nama_lengkap || user?.nama || 'Profil'} />
                  ) : (
                    <div className="profile-photo-fallback large">
                      {getInitials(user?.nama_lengkap || user?.nama)}
                    </div>
                  )}
                </div>
                <div className="profile-dropdown-info">
                  <div className="profile-dropdown-name">{user?.nama_lengkap || user?.nama || 'Pengguna'}</div>
                  <div className="profile-dropdown-role">@{user?.role || 'user'}</div>
                </div>
              </div>
              <div className="profile-dropdown-divider" />
              <button
                className="profile-dropdown-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
                Ganti Foto Profil
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
