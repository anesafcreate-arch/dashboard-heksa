import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, UserPlus, Lock, Eye, EyeOff, Trash2, Shield, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SettingsPage.css';

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
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesMsg, setProfilesMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id profile yang akan dinonaktifkan

  const roleKey = String(user?.role || '').toLowerCase().trim();
  const canManageUsers = roleKey === 'direktur';

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
      return;
    }

    try {
      const email = user?.email;
      if (!email) throw new Error('Email user tidak ditemukan.');

      // Verifikasi password lama (reauth)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) throw reauthError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setPwMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ type: 'error', text: err?.message || 'Gagal mengubah password.' });
    }
  };

  const fetchProfiles = async () => {
    if (!canManageUsers) return;
    setProfilesLoading(true);
    setProfilesMsg(null);
    try {
      const { data, error } = await supabase
        .from('Profile')
        .select('id,nama_lengkap,role')
        .order('nama_lengkap', { ascending: true });
      if (error) throw error;
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setProfilesMsg({ type: 'error', text: err?.message || 'Gagal memuat daftar user.' });
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canManageUsers]);

  const updateProfile = async (id, patch) => {
    if (!canManageUsers) return;
    setProfilesMsg(null);
    try {
      const { error } = await supabase.from('Profile').update(patch).eq('id', id);
      if (error) throw error;
      await fetchProfiles();
      setProfilesMsg({ type: 'success', text: 'Perubahan user tersimpan.' });
    } catch (err) {
      setProfilesMsg({ type: 'error', text: err?.message || 'Gagal menyimpan perubahan user.' });
    }
  };

  const requestDisableUser = (profileId) => {
    // Untuk keamanan, hindari menonaktifkan diri sendiri
    if (profileId === user?.id) return;
    setDeleteConfirm(profileId);
  };

  const confirmDisable = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm;
    setDeleteConfirm(null);
    await updateProfile(id, { role: 'disabled' });
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'blue',
      teknisi: 'amber',
      direktur: 'green',
      disabled: 'gray',
    };
    return colors[String(role || '').toLowerCase().trim()] || 'blue';
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
            {/* Info / Add User */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon green">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2>Manajemen User</h2>
                  <p>Atur role dan akses user yang sudah terdaftar</p>
                </div>
              </div>

              {!canManageUsers ? (
                <div className="settings-message error">
                  <AlertCircle size={16} />
                  Fitur ini hanya untuk role <strong>Direktur</strong>.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    Penambahan akun login baru perlu dibuat di <strong>Supabase Auth</strong> (demi keamanan).
                    Setelah akun dibuat, role aksesnya diatur lewat daftar user di sebelah.
                  </div>
                  <button className="btn-secondary" onClick={fetchProfiles} disabled={profilesLoading}>
                    Muat Ulang Daftar User
                  </button>
                  {profilesMsg && (
                    <div className={`settings-message ${profilesMsg.type}`}>
                      {profilesMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      {profilesMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User List */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon amber">
                  <Shield size={24} />
                </div>
                <div>
                  <h2>Daftar User</h2>
                  <p>{profilesLoading ? 'Memuat…' : `${profiles.length} user terdaftar`}</p>
                </div>
              </div>

              <div className="settings-user-list">
                {profiles.map((p) => (
                  <div key={p.id} className="settings-user-item">
                    <div className="settings-user-avatar">
                      <User size={18} />
                    </div>
                    <div className="settings-user-info">
                      <div className="settings-user-name">{p.nama_lengkap || '—'}</div>
                      <div className="settings-user-username" style={{ fontSize: '0.78rem' }}>
                        ID: {p.id}
                      </div>
                    </div>
                    <span className={`settings-role-badge ${getRoleBadge(p.role)}`}>
                      {String(p.role || '—')}
                    </span>
                    {canManageUsers ? (
                      <select
                        className="form-select"
                        value={String(p.role || '').toLowerCase().trim()}
                        onChange={(e) => updateProfile(p.id, { role: e.target.value })}
                        style={{ width: '160px' }}
                      >
                        <option value="admin">admin</option>
                        <option value="teknisi">teknisi</option>
                        <option value="direktur">direktur</option>
                        <option value="disabled">disabled</option>
                      </select>
                    ) : null}
                    {canManageUsers && p.id !== user?.id && (
                      <button
                        className="settings-delete-btn"
                        onClick={() => requestDisableUser(p.id)}
                        title="Nonaktifkan User"
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
                Nonaktifkan user ini?
                <br />User tidak akan bisa masuk sampai role diaktifkan lagi.
              </div>
              <div className="confirm-dialog-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Batal
                </button>
                <button className="btn-danger" onClick={confirmDisable}>
                  <Trash2 size={16} /> Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
