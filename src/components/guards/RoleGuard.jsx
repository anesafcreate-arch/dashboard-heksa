import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isRoleAllowed, normalizeRole } from '../../utils/roles';

export default function RoleGuard({ allowedRoles, children }) {
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

  // PENGAMAN FINAL: toLowerCase() untuk samakan huruf, trim() untuk buang spasi gaib
  const userRole = normalizeRole(user?.role);
  const allowed = Array.isArray(allowedRoles) 
    ? allowedRoles.map((r) => normalizeRole(r))
    : [];

  // Jika role tidak ada di daftar yang diizinkan
  if (allowedRoles && !isRoleAllowed(userRole, allowedRoles)) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
        <h2>Akses Ditolak 🛑</h2>
        <p>Role kamu di database: <strong>"{user?.role}"</strong></p>
        <p>Role yang diizinkan untuk halaman ini: <strong>{allowed.join(', ')}</strong></p>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#94a3b8' }}>
          *Perhatikan apakah ada spasi berlebih di dalam tanda kutip role kamu.
        </p>
      </div>
    );
  }

  return children;
}
