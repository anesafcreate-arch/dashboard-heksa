import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import RoleGuard from './components/guards/RoleGuard';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlatMasukPage from './pages/AlatMasukPage';
import AlatKeluarPage from './pages/AlatKeluarPage';
import JadwalOnsitePage from './pages/JadwalOnsitePage';
import DatabasePage from './pages/DatabasePage';
import SettingsPage from './pages/SettingsPage';

const APP_ALLOWED_ROLES = ['adminutama', 'direktur', 'manager', 'supervisor', 'admin', 'teknisi'];
const DASHBOARD_ALLOWED_ROLES = ['adminutama', 'direktur', 'manager', 'supervisor', 'admin'];
const SETTINGS_ALLOWED_ROLES = ['adminutama'];

export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role?.toLowerCase();
  const isTeknisi = role === 'teknisi';
  const defaultAuthedPath = isTeknisi ? '/status-alat' : '/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? defaultAuthedPath : '/login'} replace />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultAuthedPath} replace /> : <LoginPage />}
      />

      <Route
        element={(
          <RoleGuard allowedRoles={APP_ALLOWED_ROLES}>
            <AppLayout />
          </RoleGuard>
        )}
      >
        <Route
          path="/dashboard"
          element={(
            <RoleGuard allowedRoles={DASHBOARD_ALLOWED_ROLES}>
              <DashboardPage />
            </RoleGuard>
          )}
        />
        <Route path="/alat-masuk" element={<AlatMasukPage />} />
        <Route path="/status-alat" element={<AlatKeluarPage />} />
        <Route path="/alat-keluar" element={<Navigate to="/status-alat" replace />} />
        <Route path="/barang-keluar" element={<Navigate to="/status-alat" replace />} />
        <Route path="/jadwal-onsite" element={<JadwalOnsitePage />} />
        <Route path="/database" element={<DatabasePage />} />

        <Route
          path="/settings"
          element={(
            <RoleGuard allowedRoles={SETTINGS_ALLOWED_ROLES}>
              <SettingsPage />
            </RoleGuard>
          )}
        />
        <Route
          path="/settings/umum"
          element={(
            <RoleGuard allowedRoles={SETTINGS_ALLOWED_ROLES}>
              <SettingsPage />
            </RoleGuard>
          )}
        />
        <Route
          path="/settings/password"
          element={(
            <RoleGuard allowedRoles={SETTINGS_ALLOWED_ROLES}>
              <SettingsPage />
            </RoleGuard>
          )}
        />
        <Route
          path="/settings/users"
          element={(
            <RoleGuard allowedRoles={SETTINGS_ALLOWED_ROLES}>
              <SettingsPage />
            </RoleGuard>
          )}
        />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? defaultAuthedPath : '/login'} replace />} />
    </Routes>
  );
}
