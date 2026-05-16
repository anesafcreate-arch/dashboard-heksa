import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isRoleAllowed } from '../../utils/roles';

export default function RoleGuard({ allowedRoles, children, redirectPath = null }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
        Memuat data pengguna...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !isRoleAllowed(user?.role, allowedRoles)) {
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
        <h2>Akses Ditolak</h2>
        <p>Role kamu di database: <strong>"{user?.role}"</strong></p>
        <p>Role yang diizinkan untuk halaman ini: <strong>{allowedRoles.join(', ')}</strong></p>
      </div>
    );
  }

  return children;
}
