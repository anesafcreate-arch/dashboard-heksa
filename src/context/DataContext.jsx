import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext(null);

const normalizeRow = (row) => ({
  id: row.id,
  kodeAlat: row.kode_alat || '',
  namaAlat: row.nama_alat || '',
  jenisLayanan: row.jenis_layanan || '',
  tanggalMasuk: row.tanggal_masuk || null,
  dokumenNama: row.dokumen_nama || null,
  statusKalibrasi: row.status_kalibrasi || 'MENUNGGU',
  tanggalDiambil: row.tanggal_diambil || null,
});

export function DataProvider({ children }) {
  const [rows, setRows] = useState([]);

  const loadRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('alat_kalibrasi')
      .select('*')
      .order('tanggal_masuk', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadRows();

    const dbChannel = supabase
      .channel('data-alat-kalibrasi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alat_kalibrasi' }, () => {
        loadRows();
      })
      .subscribe();

    // Fallback realtime: saat admin broadcast input alat masuk,
    // paksa reload agar Recent Activity user lain langsung update tanpa refresh.
    const notifChannel = supabase
      .channel('global-notif')
      .on('broadcast', { event: 'alat_masuk' }, () => {
        loadRows();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [loadRows]);

  const alatMasuk = useMemo(() => rows.map(normalizeRow), [rows]);

  const alatKeluar = useMemo(
    () =>
      rows.map((row) => {
        const item = normalizeRow(row);
        return {
          ...item,
          sudahDiambil: item.statusKalibrasi === 'DIAMBIL',
        };
      }),
    [rows]
  );

  const databaseKalibrasi = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        kodeAlat: row.kode_alat || '',
        namaAlat: row.nama_alat || '',
        kategori: row.jenis_layanan || '',
      })),
    [rows]
  );

  const addAlatMasuk = useCallback(async (item) => {
    await supabase.from('alat_kalibrasi').insert({
      kode_alat: item.kodeAlat,
      nama_alat: item.namaAlat,
      jenis_layanan: item.jenisLayanan,
      tanggal_masuk: item.tanggalMasuk || new Date().toISOString().split('T')[0],
      dokumen_nama: item.dokumenNama || null,
      status_kalibrasi: 'MENUNGGU',
    });
    await loadRows();
  }, [loadRows]);

  const editAlatMasuk = useCallback(async (item) => {
    await supabase
      .from('alat_kalibrasi')
      .update({
        kode_alat: item.kodeAlat,
        nama_alat: item.namaAlat,
        jenis_layanan: item.jenisLayanan,
      })
      .eq('id', item.id);
    await loadRows();
  }, [loadRows]);

  const updateStatus = useCallback(async (id, status) => {
    await supabase
      .from('alat_kalibrasi')
      .update({
        status_kalibrasi: status,
        tanggal_diambil: status === 'DIAMBIL' ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', id);
    await loadRows();
  }, [loadRows]);

  const deleteAlatMasuk = useCallback(async (id) => {
    await supabase.from('alat_kalibrasi').delete().eq('id', id);
    await loadRows();
  }, [loadRows]);

  const addDatabase = useCallback(async (item) => {
    await supabase.from('alat_kalibrasi').insert({
      kode_alat: item.kodeAlat,
      nama_alat: item.namaAlat,
      jenis_layanan: item.kategori,
      tanggal_masuk: new Date().toISOString().split('T')[0],
      status_kalibrasi: 'MENUNGGU',
    });
    await loadRows();
  }, [loadRows]);

  const editDatabase = useCallback(async (item) => {
    await supabase
      .from('alat_kalibrasi')
      .update({
        kode_alat: item.kodeAlat,
        nama_alat: item.namaAlat,
        jenis_layanan: item.kategori,
      })
      .eq('id', item.id);
    await loadRows();
  }, [loadRows]);

  const deleteDatabase = useCallback(async (id) => {
    await supabase.from('alat_kalibrasi').delete().eq('id', id);
    await loadRows();
  }, [loadRows]);

  return (
    <DataContext.Provider
      value={{
        alatMasuk,
        alatKeluar,
        databaseKalibrasi,
        addAlatMasuk,
        editAlatMasuk,
        updateStatus,
        deleteAlatMasuk,
        addDatabase,
        editDatabase,
        deleteDatabase,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}

export default DataContext;