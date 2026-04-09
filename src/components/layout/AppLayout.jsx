import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

export default function AppLayout() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const syncSidebarState = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };

    syncSidebarState();
    window.addEventListener('resize', syncSidebarState);
    return () => window.removeEventListener('resize', syncSidebarState);
  }, []);

  useEffect(() => {
    const playSound = () => {
      const audio = new Audio('/notifku.wav');
      audio.play().catch(() => {});
    };

    const channel = supabase
      .channel('global-notif')
      .on(
        'broadcast',
        { event: 'alat_masuk' },
        ({ payload }) => {
          // Hindari notifikasi ganda untuk pengirim (karena sudah dapat notif lokal)
          if (payload?.senderId && payload.senderId === user?.id) return;
          window.dispatchEvent(new CustomEvent('alat-masuk-broadcast'));
          addNotification(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              📥 Alat masuk baru: {payload?.namaAlat || '-'} ({payload?.kodeAlat || '-'})
            </div>
          );
          playSound();
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alat_kalibrasi' }, () => {
        playSound();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [addNotification, user?.id]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="app-layout-content">
        <Header onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}