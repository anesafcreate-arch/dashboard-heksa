import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useNotification } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

export default function AppLayout() {
  const { addNotification } = useNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const syncSidebarState = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };

    syncSidebarState();
    window.addEventListener('resize', syncSidebarState);
    return () => window.removeEventListener('resize', syncSidebarState);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/notifku.mp3');
    audioRef.current.preload = 'auto';

    const unlockAudio = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        })
        .catch(() => {
          audio.volume = 1;
        });
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const handleIncomingTool = (newRow) => {
      if (!newRow) return;
      const payload = {
        id: newRow?.id,
        noOrder: newRow?.no_order || newRow?.kode_alat || '',
        kodeAlat: newRow?.kode_alat || '',
        namaAlat: newRow?.nama_alat || '',
        spesifikasi: newRow?.spesifikasi || '',
        jumlah: newRow?.jumlah ?? '',
        lab: newRow?.lab || '',
        pesananKhusus: newRow?.pesanan_khusus || '',
        jenisLayanan: newRow?.jenis_layanan || '',
        tanggalMasuk: newRow?.tanggal_masuk || null,
        dokumen: newRow?.dokumen || newRow?.dokumen_nama || null,
        dokumenNama: newRow?.dokumen_nama || null,
      };

      window.dispatchEvent(new CustomEvent('alat-masuk-broadcast', { detail: payload }));
      addNotification(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Alat masuk baru: {payload.namaAlat || '-'} ({payload.noOrder || '-'})
        </div>
      );
      const realtimeAudio = new Audio('/notifku.mp3');
      realtimeAudio.play().catch((err) => {
        const fallbackAudio = audioRef.current;
        if (!fallbackAudio) {
          console.log('Autoplay blocked', err);
          return;
        }
        fallbackAudio.currentTime = 0;
        fallbackAudio.play().catch((fallbackErr) => {
          console.log('Autoplay blocked', fallbackErr);
        });
      });
    };

    const channel = supabase
      .channel('alat-masuk-global-listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alat_kalibrasi' }, ({ new: newRow }) => handleIncomingTool(newRow))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alat_masuk' }, ({ new: newRow }) => handleIncomingTool(newRow))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [addNotification]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="app-layout-content">
        <Header onToggleSidebar={() => setIsSidebarOpen((value) => !value)} />
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
