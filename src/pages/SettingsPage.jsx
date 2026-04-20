import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, UserPlus, Lock, Eye, EyeOff, Trash2, Shield, User, CheckCircle, AlertCircle, Save, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import DataTable from '../components/ui/DataTable';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { canAccessSettings, getRoleGroup, normalizeRole } from '../utils/roles';
import './SettingsPage.css';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'admin' },
  { value: 'managermutu', label: 'managermutu' },
  { value: 'managerkeuangan', label: 'managerkeuangan' },
  { value: 'managerpemasaran', label: 'managerpemasaran' },
  { value: 'teknisi', label: 'teknisi' },
  { value: 'direktur', label: 'direktur' },
  { value: 'disabled', label: 'disabled' },
];

const EMPTY_USER_FORM = {
  namaLengkap: '',
  username: '',
  password: '',
  role: 'teknisi',
};

const toUsername = (value) => normalizeRole(value).replace(/@.*/, '').replace(/\s/g, '');

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('password');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesMsg, setProfilesMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER_FORM);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const roleKey = normalizeRole(user?.role);
  const canManageUsers = canAccessSettings(roleKey);

  const fetchProfiles = async () => {
    if (!canManageUsers) return;
    setProfilesLoading(true);
    setProfilesMsg(null);
    try {
      const { data, error } = await supabase
        .from('Profile')
        .select('*')
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
      manager: 'blue',
      disabled: 'gray',
    };
    return colors[getRoleGroup(role)] || 'blue';
  };

  const getProfileUsername = (profile) => {
    if (profile?.username) return profile.username;
    if (profile?.email) return String(profile.email).replace(/@heksa\.com$/i, '');
    return String(profile?.id || '').slice(0, 8);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setNewUser(EMPTY_USER_FORM);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!canManageUsers || isCreatingUser) return;
    setProfilesMsg(null);

    const username = toUsername(newUser.username);
    const email = `${username}@heksa.com`;
    if (!newUser.namaLengkap.trim() || !username || !newUser.password || !newUser.role) {
      setProfilesMsg({ type: 'error', text: 'Nama lengkap, username, password, dan role wajib diisi.' });
      return;
    }
    if (newUser.password.length < 6) {
      setProfilesMsg({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: newUser.password,
        options: {
          data: {
            nama_lengkap: newUser.namaLengkap.trim(),
            username,
            role: newUser.role,
          },
        },
      });
      if (signUpError) throw signUpError;

      if (currentSession?.access_token && currentSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }

      const createdUserId = signUpData?.user?.id;
      if (createdUserId) {
        const payload = {
          id: createdUserId,
          nama_lengkap: newUser.namaLengkap.trim(),
          username,
          role: newUser.role,
        };
        const { error: profileError } = await supabase.from('Profile').upsert(payload);
        if (profileError) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.username;
          const { error: fallbackError } = await supabase.from('Profile').upsert(fallbackPayload);
          if (fallbackError) throw fallbackError;
        }
      }

      closeUserModal();
      await fetchProfiles();
      setProfilesMsg({ type: 'success', text: `User ${email} berhasil dibuat.` });
    } catch (err) {
      setProfilesMsg({ type: 'error', text: err?.message || 'Gagal membuat user baru.' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const userColumns = useMemo(() => [
    {
      header: 'Nama Lengkap',
      accessor: 'nama_lengkap',
      render: (row) => (
        <div className="settings-table-user">
          <div className="settings-user-avatar">
            <User size={18} />
          </div>
          <span>{row.nama_lengkap || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Username/ID',
      accessor: 'username',
      render: (row) => <span className="settings-username-id">{getProfileUsername(row)}</span>,
    },
    {
      header: 'Role/Kelas',
      accessor: 'role',
      render: (row) => (
        <div className="settings-role-cell">
          <span className={`settings-role-badge ${getRoleBadge(row.role)}`}>
            {String(row.role || '-')}
          </span>
          {canManageUsers && (
            <select
              className="form-select settings-role-select"
              value={normalizeRole(row.role)}
              onChange={(e) => updateProfile(row.id, { role: e.target.value })}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </div>
      ),
    },
    {
      header: 'Aksi',
      width: '90px',
      render: (row) => (
        canManageUsers && row.id !== user?.id ? (
          <button
            className="settings-delete-btn"
            onClick={() => requestDisableUser(row.id)}
            title="Nonaktifkan User"
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <span className="settings-action-muted">-</span>
        )
      ),
    },
  ], [canManageUsers, user?.id]);

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} /> Pengaturan
        </h1>
      </div>

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

      <div className="settings-content">
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
                  <button type="button" className="settings-eye-btn" onClick={() => setShowCurrentPw(!showCurrentPw)}>
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
                  <button type="button" className="settings-eye-btn" onClick={() => setShowNewPw(!showNewPw)}>
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

        {activeTab === 'users' && (
          <div className="settings-card settings-users-full animate-fade-in-up">
            <div className="settings-table-header">
              <div className="settings-card-header">
                <div className="settings-card-icon amber">
                  <Shield size={24} />
                </div>
                <div>
                  <h2>Manajemen User</h2>
                  <p>{profilesLoading ? 'Memuat...' : `${profiles.length} user terdaftar`}</p>
                </div>
              </div>

              {canManageUsers && (
                <button className="btn-primary" onClick={() => { setProfilesMsg(null); setShowUserModal(true); }}>
                  <Plus size={16} /> Tambah User Baru
                </button>
              )}
            </div>

            {!canManageUsers ? (
              <div className="settings-message error">
                <AlertCircle size={16} />
                Fitur ini hanya untuk Direktur, Manager Keuangan, dan Manager Pemasaran.
              </div>
            ) : (
              <>
                {profilesMsg && (
                  <div className={`settings-message ${profilesMsg.type}`}>
                    {profilesMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {profilesMsg.text}
                  </div>
                )}
                <DataTable
                  columns={userColumns}
                  data={profiles}
                  searchPlaceholder="Cari nama, username, atau role..."
                  emptyIcon={<User size={32} color="var(--color-text-muted)" />}
                  emptyText="Belum ada user"
                />
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showUserModal}
        onClose={closeUserModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} /> Tambah User Baru
          </div>
        }
        footer={
          <>
            <button className="btn-secondary" onClick={closeUserModal}>Batal</button>
            <button className="btn-primary" onClick={handleCreateUser} disabled={isCreatingUser}>
              <Save size={16} /> {isCreatingUser ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <form className="settings-user-modal-form" onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nama lengkap user"
              value={newUser.namaLengkap}
              onChange={(e) => setNewUser({ ...newUser, namaLengkap: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username/ID *</label>
            <div className="settings-username-modal-cell">
              <input
                className="form-input"
                type="text"
                placeholder="fida"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: toUsername(e.target.value) })}
              />
              <span>@heksa.com</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              className="form-select"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {ROLE_OPTIONS.filter((option) => option.value !== 'disabled').map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </form>
        {profilesMsg && (
          <div className={`settings-message ${profilesMsg.type}`} style={{ marginTop: '16px' }}>
            {profilesMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {profilesMsg.text}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDisable}
        title="Nonaktifkan User?"
        message="User tidak akan bisa masuk sampai role diaktifkan lagi."
        confirmText="Ya, Nonaktifkan"
      />
    </div>
  );
}
