import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  useEffect(() => {
    const playSound = () => {
      const audio = new Audio('/notifku.wav');
      audio.play().catch(() => {});
    };

    const channel = supabase
      .channel('global-notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alat_kalibrasi' }, 
        () => playSound()
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}