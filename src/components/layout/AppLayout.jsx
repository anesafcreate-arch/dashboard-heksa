import { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Di dalam fungsi AppLayout
export default function AppLayout() {
  
  useEffect(() => {
    const playSound = () => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    };

    const channel = supabase
      .channel('global-notif')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alat_kalibrasi' },
        (payload) => {
          playSound();
          alert(`🔔 NOTIF HEKSA: Ada alat baru masuk (${payload.new.nama_barang})!`);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ... sisa kode layout kamu ...
}
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-layout-content">
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

