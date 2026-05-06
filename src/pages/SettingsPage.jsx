import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, UserPlus, Lock, Eye, EyeOff, Shield, User, CheckCircle, AlertCircle, Save, Plus } from 'lucide-react';
import { supabase, supabaseSignupClient } from '../supabaseClient';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { APP_ROLES, canAccessSettings, getRoleGroup, normalizeRole, resolveRole, toRoleLabel } from '../utils/roles';
import './SettingsPage.css';

const ROLE_OPTIONS = APP_ROLES.map((role) => ({ value: role, label: toRoleLabel(role) }));

const EMPTY_USER_FORM = {
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER_FORM);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const canManageUsers = canAccessSettings(user?.role);

  const fetchProfiles = useCallback(async () => {
    if (!canManageUsers) return;
    setProfilesLoading(true);
    setProfilesMsg(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,created_at')
        .order('email', { ascending: true });
      if (error) throw error;
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setProfilesMsg({ type: 'error', text: err?.message || 'Gagal memuat daftar user.' });
    } finally {
      setProfilesLoading(false);
    }
  }, [canManageUsers]);

  useEffect(() => {
    if (activeTab === 'users') fetchProfiles();
  }, [activeTab, canManageUsers, fetchProfiles]);

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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const currentUser = userData?.user;
      if (!currentUser?.email) throw new Error('Email user aktif tidak ditemukan.');

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
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

  const updateProfile = useCallback(async (id, patch) => {
    if (!canManageUsers) return;
    setProfilesMsg(null);
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
      await fetchProfiles();
      setProfilesMsg({ type: 'success', text: 'Perubahan user tersimpan.' });
    } catch (err) {
      setProfilesMsg({ type: 'error', text: err?.message || 'Gagal menyimpan perubahan user.' });
    }
  }, [canManageUsers, fetchProfiles]);

  const getRoleBadge = (role) => {
    const colors = {
      adminutama: 'green',
      direktur: 'green',
      manager: 'blue',
      supervisor: 'blue',
      admin: 'blue',
      teknisi: 'amber',
    };
    return colors[getRoleGroup(role)] || 'blue';
  };

  const getProfileUsername = (profile) => {
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
    if (!username || !newUser.password || !newUser.role) {
      setProfilesMsg({ type: 'error', text: 'Username, password, dan role wajib diisi.' });
      return;
    }
    if (newUser.password.length < 6) {
      setProfilesMsg({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data: signUpData, error: signUpError } = await supabaseSignupClient.auth.signUp({
        email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
          },
        },
      });
      if (signUpError) throw signUpError;

      const createdUserId = signUpData?.user?.id;
      if (createdUserId) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: createdUserId,
          email,
          role: resolveRole(newUser.role, email),
        });
        if (profileError) throw profileError;
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
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <div className="settings-table-user">
          <div className="settings-user-avatar">
            <User size={18} />
          </div>
          <span>{row.email || '-'}</span>
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
            {toRoleLabel(resolveRole(row.role, row.email))}
          </span>
          {canManageUsers && (
            <select
              className="form-select settings-role-select"
              value={resolveRole(row.role, row.email)}
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
  ], [canManageUsers, updateProfile]);

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
              Fitur ini hanya untuk AdminUtama.
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
                  searchPlaceholder="Cari email atau role..."
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
              {ROLE_OPTIONS.map((option) => (
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
    </div>
  );
}
