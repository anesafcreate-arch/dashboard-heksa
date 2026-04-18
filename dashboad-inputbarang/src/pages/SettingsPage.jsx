import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, UserPlus, Lock, Eye, EyeOff, Trash2, Shield, User, CheckCircle, AlertCircle } from 'lucide-react';
import './SettingsPage.css';

// Get stored users from localStorage or use defaults
const getStoredUsers = () => {
  try {
    const stored = localStorage.getItem('app_users');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [
    { id: 1, username: 'admin', password: 'admin123', nama: 'Amel', role: 'admin' },
    { id: 2, username: 'teknisi', password: 'teknisi123', nama: 'Budi Santoso', role: 'teknisi' },
    { id: 3, username: 'direktur', password: 'direktur123', nama: 'Ir. Ahmad Hidayat', role: 'direktur' },
    { id: 4, username: 'manager_dian', password: 'manager123', nama: 'Dian', role: 'manager_dian' },
    { id: 5, username: 'manager_fida', password: 'manager123', nama: 'Fida', role: 'manager_fida' },
    { id: 6, username: 'manager_uko', password: 'manager123', nama: 'Uko', role: 'manager_uko' },
  ];
};

const saveUsers = (users) => {
  try {
    localStorage.setItem('app_users', JSON.stringify(users));
  } catch {}
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('password');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  // User Management State
  const [users, setUsers] = useState(getStoredUsers);
  const [newUser, setNewUser] = useState({ username: '', password: '', nama: '', role: 'teknisi' });
  const [addUserMsg, setAddUserMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Handle Password Change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPwMessage(null);

    const storedUsers = getStoredUsers();
    const currentUser = storedUsers.find((u) => u.username === user?.username);

    if (!currentUser || currentUser.password !== currentPassword) {
      setPwMessage({ type: 'error', text: 'Password saat ini salah!' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
      return;
    }

    const updatedUsers = storedUsers.map((u) =>
      u.username === user.username ? { ...u, password: newPassword } : u
    );
    setUsers(updatedUsers);
    setPwMessage({ type: 'success', text: 'Password berhasil diubah!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Add User
  const handleAddUser = (e) => {
    e.preventDefault();
    setAddUserMsg(null);

    if (!newUser.username || !newUser.password || !newUser.nama) {
      setAddUserMsg({ type: 'error', text: 'Semua field wajib diisi!' });
      return;
    }
    if (newUser.password.length < 6) {
      setAddUserMsg({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }
    if (users.some((u) => u.username === newUser.username)) {
      setAddUserMsg({ type: 'error', text: 'Username sudah digunakan!' });
      return;
    }

    const newId = Math.max(...users.map((u) => u.id)) + 1;
    const updatedUsers = [...users, { ...newUser, id: newId }];
    setUsers(updatedUsers);
    setAddUserMsg({ type: 'success', text: `User "${newUser.nama}" berhasil ditambahkan!` });
    setNewUser({ username: '', password: '', nama: '', role: 'teknisi' });
  };

  // Handle Delete User
  const handleDeleteUser = (userId) => {
    if (userId === user?.id) return; // Can't delete self
    setDeleteConfirm(userId);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setUsers(users.filter((u) => u.id !== deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'blue',
      teknisi: 'amber',
      direktur: 'green',
      manager_dian: 'green',
      manager_fida: 'green',
      manager_uko: 'green',
    };
    return colors[role] || 'blue';
  };

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} /> Pengaturan
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={16} /> Ganti Password
        </button>
        <button
          className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <UserPlus size={16} /> Manajemen User
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* === Change Password === */}
        {activeTab === 'password' && (
          <div className="settings-card animate-fade-in-up">
            <div className="settings-card-header">
              <div className="settings-card-icon blue">
                <Lock size={24} />
              </div>
              <div>
                <h2>Ganti Password</h2>
                <p>Perbarui password akun Anda untuk keamanan</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label className="form-label">Password Saat Ini</label>
                <div className="settings-input-wrapper">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Masukkan password saat ini"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="settings-eye-btn"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <div className="settings-input-wrapper">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="settings-eye-btn"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {pwMessage && (
                <div className={`settings-message ${pwMessage.type}`}>
                  {pwMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {pwMessage.text}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                <Lock size={16} /> Simpan Password
              </button>
            </form>
          </div>
        )}

        {/* === User Management === */}
        {activeTab === 'users' && (
          <div className="settings-users-grid animate-fade-in-up">
            {/* Add New User */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon green">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2>Tambah User Baru</h2>
                  <p>Buat akun login baru untuk staf</p>
                </div>
              </div>

              <form onSubmit={handleAddUser} className="settings-form">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Ahmad Santoso"
                    value={newUser.nama}
                    onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: ahmad_s"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="teknisi">Teknisi</option>
                    <option value="direktur">Direktur</option>
                    <option value="manager_dian">Manager Dian</option>
                    <option value="manager_fida">Manager Fida</option>
                    <option value="manager_uko">Manager Uko</option>
                  </select>
                </div>

                {addUserMsg && (
                  <div className={`settings-message ${addUserMsg.type}`}>
                    {addUserMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {addUserMsg.text}
                  </div>
                )}

                <button type="submit" className="btn-primary">
                  <UserPlus size={16} /> Tambah User
                </button>
              </form>
            </div>

            {/* User List */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon amber">
                  <Shield size={24} />
                </div>
                <div>
                  <h2>Daftar User</h2>
                  <p>{users.length} user terdaftar</p>
                </div>
              </div>

              <div className="settings-user-list">
                {users.map((u) => (
                  <div key={u.id} className="settings-user-item">
                    <div className="settings-user-avatar">
                      <User size={18} />
                    </div>
                    <div className="settings-user-info">
                      <div className="settings-user-name">{u.nama}</div>
                      <div className="settings-user-username">@{u.username}</div>
                    </div>
                    <span className={`settings-role-badge ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                    {u.id !== user?.id && (
                      <button
                        className="settings-delete-btn"
                        onClick={() => handleDeleteUser(u.id)}
                        title="Hapus User"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-body" style={{ padding: '32px' }}>
              <div className="confirm-dialog-icon">⚠️</div>
              <div className="confirm-dialog-message">
                Apakah Anda yakin ingin menghapus user ini?
                <br />Tindakan ini tidak dapat dibatalkan.
              </div>
              <div className="confirm-dialog-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Batal
                </button>
                <button className="btn-danger" onClick={confirmDelete}>
                  <Trash2 size={16} /> Hapus User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
