import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleGuard({ allowedRoles, children }) {
  // Tambahkan loading di sini
  const { user, isAuthenticated, loading } = useAuth();

  // 1. Tahan layar jangan dirender dulu kalau data Supabase masih ditarik
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
        Memuat data pengguna...
      </div>
    );
  }

  // 2. Kalau beneran belum login, lempar ke halaman login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Cek Role (Bikin jadi huruf kecil semua biar gak error gara-gara typo)
  const userRole = user?.role?.toLowerCase() || '';
  const allowed = allowedRoles ? allowedRoles.map(r => r.toLowerCase()) : [];

  if (allowedRoles && !allowed.includes(userRole)) {
    // JANGAN LEMPAR KE DASHBOARD LAGI! Tampilkan pesan error saja biar ketahuan.
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
        <h2>Akses Ditolak 🛑</h2>
        <p>Role kamu saat ini terbaca sebagai: <strong>{user?.role || 'KOSONG'}</strong></p>
        <p style={{ marginTop: '10px' }}>Jika role kosong, pastikan RLS Policy di Supabase sudah diset ke 'true'.</p>
      </div>
    );
  }

  // Kalau aman, silakan masuk ke halamannya
  return children;
}