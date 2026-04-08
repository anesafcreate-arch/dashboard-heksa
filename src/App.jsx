
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import AppLayout from './components/layout/AppLayout';
import RoleGuard from './components/guards/RoleGuard';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlatMasukPage from './pages/AlatMasukPage';
import AlatKeluarPage from './pages/AlatKeluarPage';
import DatabasePage from './pages/DatabasePage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        element={
          <RoleGuard allowedRoles={['Admin', 'Teknisi', 'Direktur']}>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alat-masuk" element={<AlatMasukPage />} />
        <Route path="/alat-keluar" element={<AlatKeluarPage />} />
        <Route
          path="/database"
          element={
            <RoleGuard allowedRoles={['Administrasi', 'Direktur']}>
              <DatabasePage />
            </RoleGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleGuard allowedRoles={['Direktur']}>
              <SettingsPage />
            </RoleGuard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

