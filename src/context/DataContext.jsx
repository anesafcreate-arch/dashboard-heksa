/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext(null);

const JENIS_LAYANAN_ID = [
  'Kalibrasi Massa dan Timbangan',
  'Kalibrasi Dimensi',
  'Kalibrasi Tekanan',
  'Kalibrasi Gaya',
  'Kalibrasi Kelistrikan',
  'Kalibrasi Suhu',
  'Kalibrasi Instrumen Analitik',
  'Kalibrasi Volumetrik',
];

const LEGACY_JENIS_LAYANAN_MAP = {
  'Weight and Balance Calibration': 'Kalibrasi Massa dan Timbangan',
  'Dimensional Calibration': 'Kalibrasi Dimensi',
  'Pressure Calibration': 'Kalibrasi Tekanan',
  'Force Calibration': 'Kalibrasi Gaya',
  'Electrical Calibration': 'Kalibrasi Kelistrikan',
  'Temperature Calibration': 'Kalibrasi Suhu',
  'Analytical Instrument Calibration': 'Kalibrasi Instrumen Analitik',
  'Volumetric Calibration': 'Kalibrasi Volumetrik',
  'Other Calibration': 'Kalibrasi Volumetrik',
};

const normalizeJenisLayanan = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (JENIS_LAYANAN_ID.includes(raw)) return raw;
  return LEGACY_JENIS_LAYANAN_MAP[raw] || raw;
};

const STATUS_ALIASES = {
  MENUNGGU: 'MENUNGGU',
  menunggu: 'MENUNGGU',
  Menunggu: 'MENUNGGU',
  PENDING_CUSTOMER: 'PENDING_CUSTOMER',
  pending_customer: 'PENDING_CUSTOMER',
  'PENDING CUSTOMER': 'PENDING_CUSTOMER',
  'pending customer': 'PENDING_CUSTOMER',
  'Pending Customer': 'PENDING_CUSTOMER',
  PROSES: 'PROSES',
  proses: 'PROSES',
  Proses: 'PROSES',
  'PROSES KALIBRASI': 'PROSES',
  'proses kalibrasi': 'PROSES',
  'Proses Kalibrasi': 'PROSES',
  DIBATALKAN: 'DIBATALKAN',
  dibatalkan: 'DIBATALKAN',
  Dibatalkan: 'DIBATALKAN',
  DIAMBIL: 'DIAMBIL',
  diambil: 'DIAMBIL',
  Diambil: 'DIAMBIL',
  SELESAI: 'SELESAI',
  selesai: 'SELESAI',
  Selesai: 'SELESAI',
  'SELESAI KALIBRASI': 'SELESAI',
  'selesai kalibrasi': 'SELESAI',
  'Selesai Kalibrasi': 'SELESAI',
};

const ALAT_TABLE_CANDIDATES = ['alat_masuk'];

const normalizeIdentity = (value) => String(value ?? '').trim().toLowerCase();

const buildUniqueOrderSignature = (row) =>
  [
    normalizeIdentity(row.no_order || row.noOrder || row.kode_alat || row.kodeAlat || ''),
    normalizeIdentity(row.no_sertifikat || row.noSertifikat || ''),
    normalizeIdentity(row.nama_alat || row.namaAlat || ''),
    normalizeIdentity(row.spesifikasi || row.specification || ''),
    String(row.jumlah ?? ''),
    normalizeIdentity(row.lab || row.laboratorium || ''),
    normalizeIdentity(row.pesanan_khusus || row.pesananKhusus || row.pesanan || ''),
    normalizeIdentity(row.kurang_kelengkapan || ''),
    normalizeIdentity(row.onsite_inlab || row.onsiteInlab || ''),
    normalizeIdentity(row.durasi_onsite || row.durasiOnsite || ''),
    normalizeIdentity(row.remarks || row.catatan || ''),
    normalizeIdentity(normalizeJenisLayanan(row.jenis_layanan || row.jenisLayanan || '')),
    normalizeIdentity(row.tanggal_masuk || row.tanggalMasuk || ''),
    normalizeIdentity(row.dokumen || row.dokumen_nama || row.dokumenNama || ''),
  ].join('|');

const dedupeRowsByOrderSignature = (rows) => {
  if (!Array.isArray(rows)) return [];

  const seen = new Set();
  const dedupedRows = [];

  for (const row of rows) {
    const signature = buildUniqueOrderSignature(row);
    if (seen.has(signature)) continue;
    seen.add(signature);
    dedupedRows.push(row);
  }

  return dedupedRows;
};

const normalizeStatusKalibrasi = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'MENUNGGU';
  return STATUS_ALIASES[raw] || STATUS_ALIASES[raw.toUpperCase()] || 'MENUNGGU';
};

const getMissingColumn = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
    /column\s+([\w.]+)\s+does not exist/i,
    /column '([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const preparePayloadForMissingColumn = (payload, missingColumn) => {
  if (!missingColumn) return null;
  const normalizedMissingColumn = String(missingColumn).split('.').pop();

  if (normalizedMissingColumn === 'status_kalibrasi' && payload.status_kalibrasi !== undefined) {
    const next = { ...payload };
    next.status_layanan = next.status_layanan || next.status_kalibrasi;
    delete next.status_kalibrasi;
    return next;
  }

  if (Object.prototype.hasOwnProperty.call(payload, normalizedMissingColumn)) {
    const next = { ...payload };
    delete next[normalizedMissingColumn];
    return next;
  }

  if (Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
    const next = { ...payload };
    delete next[missingColumn];
    return next;
  }

  return null;
};

const runMutationWithColumnFallback = async (mutationFactory, initialPayload, maxAttempts = 12) => {
  let payload = { ...initialPayload };
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await mutationFactory(payload);
    if (!result.error) return result;

    lastError = result.error;

    const missingColumn = getMissingColumn(result.error);
    const nextPayload = preparePayloadForMissingColumn(payload, missingColumn);
    if (!nextPayload || JSON.stringify(nextPayload) === JSON.stringify(payload)) {
      break;
    }

    payload = nextPayload;
  }

  if (lastError) {
    console.error('Supabase Error:', lastError);
  }
  return { data: null, error: lastError };
};

const normalizeRow = (row) => ({
  id: row.id,
  noOrder: row.no_order || row.noOrder || row.kode_alat || row.kodeAlat || '',
  noSertifikat: row.no_sertifikat || row.noSertifikat || '',
  kodeAlat: row.kode_alat || row.kodeAlat || row.no_order || row.noOrder || '',
  namaAlat: row.nama_alat || row.namaAlat || '',
  spesifikasi: row.spesifikasi || row.specification || '',
  jumlah: row.jumlah ?? '',
  lab: row.lab || row.laboratorium || '',
  pesananKhusus: row.pesanan_khusus || row.pesananKhusus || row.pesanan || '',
  kurangKelengkapan: row.kurang_kelengkapan || '',
  onsiteInlab: row.onsite_inlab || row.onsiteInlab || '',
  durasiOnsite: row.durasi_onsite || row.durasiOnsite || '',
  remarks: row.remarks || row.catatan || '',
  jenisLayanan: normalizeJenisLayanan(row.jenis_layanan || row.jenisLayanan),
  tanggalMasuk: row.tanggal_masuk || row.tanggalMasuk || null,
  dokumen: row.dokumen || row.dokumen_nama || row.dokumenNama || '',
  dokumenNama: row.dokumen_nama || row.dokumenNama || null,
  statusKalibrasi: normalizeStatusKalibrasi(row.status_layanan || row.status_kalibrasi || row.statusKalibrasi),
  tanggalSelesai: row.tanggal_selesai || row.tanggalSelesai || null,
  tanggalDiambil: row.tanggal_diambil || row.tanggal_ambil || row.tanggalDiambil || null,
  createdAt: row.created_at || row.id,
});

const normalizeJadwalOnsite = (row) => ({
  id: row.id,
  noOrder: row.no_order || row.noOrder || '',
  tanggalOnsite: row.tanggal_onsite || null,
  pelanggan: row.pelanggan || '',
  lokasi: row.lokasi || '',
  teknisi: row.teknisi || '',
  durasiOnsite: row.durasi_onsite || row.durasiOnsite || '',
  remarks: row.remarks || row.catatan || '',
  jenisLayanan: row.jenis_layanan || '',
  status: row.status || 'TERJADWAL',
  catatan: row.catatan || '',
});

export function DataProvider({ children }) {
  const [rows, setRows] = useState([]);
  const [jadwalOnsiteRows, setJadwalOnsiteRows] = useState([]);
  const alatTableRef = useRef(null);

  const resolveAlatTable = useCallback(async () => {
    const candidates = [...new Set([alatTableRef.current, ...ALAT_TABLE_CANDIDATES].filter(Boolean))];
    let lastError = null;

    for (const table of candidates) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        alatTableRef.current = table;
        return table;
      }
      lastError = error;
    }

    throw lastError || new Error('Tabel data alat tidak ditemukan di Supabase.');
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const alatTable = await resolveAlatTable();
      const { data, error } = await supabase
        .from(alatTable)
        .select('*')
        .order('tanggal_masuk', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows(dedupeRowsByOrderSignature(data));
    } catch (error) {
      console.error('Supabase Error:', error);
      setRows([]);
    }
  }, [resolveAlatTable]);

  const loadJadwalOnsite = useCallback(async () => {
    const { data, error } = await supabase
      .from('jadwal_onsite')
      .select('*')
      .order('tanggal_onsite', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error) setJadwalOnsiteRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadRows();
    loadJadwalOnsite();

    const alatChannels = ALAT_TABLE_CANDIDATES.map((table) =>
      supabase
        .channel(`data-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          loadRows();
        })
        .subscribe()
    );

    const jadwalOnsiteChannel = supabase
      .channel('data-jadwal-onsite')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_onsite' }, () => {
        loadJadwalOnsite();
      })
      .subscribe();

    const handleBroadcastSync = (event) => {
      const payload = event?.detail || null;

      // Optimistic update agar Recent Activity user lain langsung muncul tanpa refresh.
      if (payload?.id || payload?.kodeAlat) {
        setRows((prev) => {
          const nextRow = {
            id: payload.id ?? `temp-${Date.now()}`,
            no_order: payload.noOrder || payload.kodeAlat || '',
            no_sertifikat: payload.noSertifikat || '',
            kode_alat: payload.noOrder || payload.kodeAlat || '',
            nama_alat: payload.namaAlat || '',
            spesifikasi: payload.spesifikasi || '',
            jumlah: payload.jumlah ?? null,
            lab: payload.lab || '',
            pesanan_khusus: payload.pesananKhusus || '',
            kurang_kelengkapan: payload.kurangKelengkapan || '',
            onsite_inlab: payload.onsiteInlab || '',
            durasi_onsite: payload.durasiOnsite || '',
            remarks: payload.remarks || '',
            jenis_layanan: normalizeJenisLayanan(payload.jenisLayanan),
            tanggal_masuk: payload.tanggalMasuk || new Date().toISOString().split('T')[0],
            status_kalibrasi: normalizeStatusKalibrasi(payload.statusKalibrasi || payload.status_layanan || 'MENUNGGU'),
            status_layanan: normalizeStatusKalibrasi(payload.statusKalibrasi || payload.status_layanan || 'MENUNGGU'),
            tanggal_selesai: payload.tanggalSelesai || null,
            tanggal_ambil: payload.tanggalDiambil || null,
            tanggal_diambil: payload.tanggalDiambil || null,
            dokumen: payload.dokumen || payload.dokumenNama || null,
            dokumen_nama: payload.dokumenNama || null,
            created_at: new Date().toISOString(),
          };

          const idx = prev.findIndex((r) => Number(r.id) === Number(nextRow.id));
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...nextRow };
            return copy;
          }

          // fallback match by code+date
          const sigIdx = prev.findIndex(
            (r) => r.kode_alat === nextRow.kode_alat && r.tanggal_masuk === nextRow.tanggal_masuk
          );
          if (sigIdx >= 0) {
            const copy = [...prev];
            copy[sigIdx] = { ...copy[sigIdx], ...nextRow };
            return copy;
          }

          return dedupeRowsByOrderSignature([nextRow, ...prev]);
        });
      }

      // Re-sync dari DB untuk memastikan id/status final konsisten.
      setTimeout(() => {
        loadRows();
      }, 500);
    };
    window.addEventListener('alat-masuk-broadcast', handleBroadcastSync);

    return () => {
      alatChannels.forEach((channel) => supabase.removeChannel(channel));
      supabase.removeChannel(jadwalOnsiteChannel);
      window.removeEventListener('alat-masuk-broadcast', handleBroadcastSync);
    };
  }, [loadRows, loadJadwalOnsite]);

  const alatMasuk = useMemo(() => rows.map(normalizeRow), [rows]);
  const jadwalOnsite = useMemo(() => jadwalOnsiteRows.map(normalizeJadwalOnsite), [jadwalOnsiteRows]);

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

  const summaryKalibrasi = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        noOrder: row.no_order || row.noOrder || row.kode_alat || row.kodeAlat || '',
        noSertifikat: row.no_sertifikat || row.noSertifikat || '',
        kodeAlat: row.kode_alat || row.kodeAlat || row.no_order || row.noOrder || '',
        namaAlat: row.nama_alat || row.namaAlat || '',
        onsiteInlab: row.onsite_inlab || row.onsiteInlab || '',
        remarks: row.remarks || row.catatan || '',
        kategori: normalizeJenisLayanan(row.jenis_layanan || row.jenisLayanan),
        statusKalibrasi: normalizeStatusKalibrasi(row.status_layanan || row.status_kalibrasi || row.statusKalibrasi),
      })),
    [rows]
  );

  const addAlatMasuk = useCallback(async (item) => {
    const alatTable = await resolveAlatTable();
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    const fullPayload = item.supabasePayload || {
      no_order: item.noOrder || item.kodeAlat,
      no_sertifikat: item.noSertifikat || null,
      kode_alat: item.noOrder || item.kodeAlat,
      nama_alat: item.namaAlat,
      spesifikasi: item.spesifikasi || null,
      jumlah: item.jumlah !== '' && item.jumlah !== null && item.jumlah !== undefined ? Number(item.jumlah) : null,
      lab: item.lab || null,
      pesanan_khusus: item.pesananKhusus || null,
      kurang_kelengkapan: item.kurangKelengkapan || null,
      onsite_inlab: item.onsiteInlab || null,
      remarks: item.remarks || null,
      created_by: item.createdBy || item.userId || currentUserId,
      jenis_layanan: normalizeJenisLayanan(item.jenisLayanan),
      tanggal_masuk: item.tanggalMasuk || new Date().toISOString().split('T')[0],
      dokumen: item.dokumen || null,
      dokumen_nama: item.dokumenNama || null,
      status_kalibrasi: 'MENUNGGU',
    };

    const payloadWithoutRemarks = { ...fullPayload };
    delete payloadWithoutRemarks.remarks;

    const basePayload = item.supabaseBasePayload || {
      kode_alat: item.noOrder || item.kodeAlat,
      no_sertifikat: item.noSertifikat || null,
      nama_alat: item.namaAlat,
      jenis_layanan: normalizeJenisLayanan(item.jenisLayanan),
      kurang_kelengkapan: item.kurangKelengkapan || null,
      onsite_inlab: item.onsiteInlab || null,
      tanggal_masuk: item.tanggalMasuk || new Date().toISOString().split('T')[0],
      dokumen_nama: item.dokumenNama || null,
      created_by: item.createdBy || item.userId || currentUserId,
      status_kalibrasi: 'MENUNGGU',
    };

    let finalError = null;
    const insertFull = await runMutationWithColumnFallback(
      (payload) => supabase.from(alatTable).insert(payload).select('*').single(),
      fullPayload
    );
    let data = insertFull.data || null;
    finalError = insertFull.error || null;

    if (!data && insertFull.error) {
      const insertWithoutRemarks = await runMutationWithColumnFallback(
        (payload) => supabase.from(alatTable).insert(payload).select('*').single(),
        payloadWithoutRemarks
      );
      data = insertWithoutRemarks.data || null;
      finalError = insertWithoutRemarks.error || insertFull.error;
    }

    if (!data && finalError) {
      const insertBase = await runMutationWithColumnFallback(
        (payload) => supabase.from(alatTable).insert(payload).select('*').single(),
        basePayload
      );
      data = insertBase.data || null;
      finalError = insertBase.error || finalError;
    }

    await loadRows();
    if (!data && finalError) {
      throw finalError;
    }
    return data ? normalizeRow(data) : null;
  }, [loadRows, resolveAlatTable]);

  const editAlatMasuk = useCallback(async (item) => {
    const alatTable = await resolveAlatTable();
    const fullPayload = {
      no_order: item.noOrder || item.kodeAlat,
      no_sertifikat: item.noSertifikat || null,
      kode_alat: item.noOrder || item.kodeAlat,
      nama_alat: item.namaAlat,
      spesifikasi: item.spesifikasi || null,
      jumlah: item.jumlah !== '' && item.jumlah !== null && item.jumlah !== undefined ? Number(item.jumlah) : null,
      lab: item.lab || null,
      pesanan_khusus: item.pesananKhusus || null,
      kurang_kelengkapan: item.kurangKelengkapan || null,
      onsite_inlab: item.onsiteInlab || null,
      remarks: item.remarks || null,
      jenis_layanan: normalizeJenisLayanan(item.jenisLayanan),
      dokumen: item.dokumen || null,
      dokumen_nama: item.dokumenNama || null,
    };

    const payloadWithoutRemarks = { ...fullPayload };
    delete payloadWithoutRemarks.remarks;

    const basePayload = {
      kode_alat: item.noOrder || item.kodeAlat,
      no_sertifikat: item.noSertifikat || null,
      nama_alat: item.namaAlat,
      jenis_layanan: normalizeJenisLayanan(item.jenisLayanan),
      kurang_kelengkapan: item.kurangKelengkapan || null,
      onsite_inlab: item.onsiteInlab || null,
      dokumen_nama: item.dokumenNama || null,
    };

    const fullUpdate = await runMutationWithColumnFallback(
      (payload) => supabase.from(alatTable).update(payload).eq('id', item.id),
      fullPayload
    );
    if (fullUpdate.error) {
      const noRemarksUpdate = await runMutationWithColumnFallback(
        (payload) => supabase.from(alatTable).update(payload).eq('id', item.id),
        payloadWithoutRemarks
      );
      if (noRemarksUpdate.error) {
        await runMutationWithColumnFallback(
          (payload) => supabase.from(alatTable).update(payload).eq('id', item.id),
          basePayload
        );
      }
    }
    await loadRows();
  }, [loadRows, resolveAlatTable]);

  const updateStatus = useCallback(async (id, status) => {
    try {
      const alatTable = await resolveAlatTable();
      const normalizedStatus = normalizeStatusKalibrasi(status);
      const today = new Date().toISOString().split('T')[0];
      const isSelesaiStatus = normalizedStatus === 'SELESAI';
      const tanggalSelesai = isSelesaiStatus ? today : null;
      const tanggalAmbil = normalizedStatus === 'DIAMBIL' ? today : null;
      const statusPayload = {
        status_kalibrasi: normalizedStatus,
        status_layanan: normalizedStatus,
        tanggal_selesai: tanggalSelesai,
        tanggal_ambil: tanggalAmbil,
        tanggal_diambil: tanggalAmbil,
      };

      const primary = await runMutationWithColumnFallback(
        (payload) => supabase.from(alatTable).update(payload).eq('id', id),
        statusPayload
      );

      if (primary.error) {
        throw primary.error;
      }

      setRows((prev) =>
        prev.map((row) =>
          Number(row.id) === Number(id)
            ? {
                ...row,
                status_kalibrasi: normalizedStatus,
                status_layanan: normalizedStatus,
                tanggal_selesai: tanggalSelesai,
                tanggal_ambil: tanggalAmbil,
                tanggal_diambil: tanggalAmbil,
              }
            : row
        )
      );
      await loadRows();
    } catch (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
  }, [loadRows, resolveAlatTable]);

  const updateRemarks = useCallback(async (id, remarksValue) => {
    try {
      const alatTable = await resolveAlatTable();
      const { error } = await supabase
        .from(alatTable)
        .update({ remarks: remarksValue || null })
        .eq('id', id);
      if (error) throw error;

      setRows((prev) =>
        prev.map((row) =>
          Number(row.id) === Number(id)
            ? {
                ...row,
                remarks: remarksValue || '',
              }
            : row
        )
      );
      await loadRows();
    } catch (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
  }, [loadRows, resolveAlatTable]);

  const deleteAlatMasuk = useCallback(async (id) => {
    const alatTable = await resolveAlatTable();
    await supabase.from(alatTable).delete().eq('id', id);
    await loadRows();
  }, [loadRows, resolveAlatTable]);

  const addSummaryKalibrasi = useCallback(async (item) => {
    const alatTable = await resolveAlatTable();
    const payload = {
      no_order: item.noOrder || item.kodeAlat,
      no_sertifikat: item.noSertifikat || null,
      nama_alat: item.namaAlat,
      onsite_inlab: item.onsiteInlab || null,
      remarks: item.remarks || null,
      jenis_layanan: normalizeJenisLayanan(item.kategori),
      tanggal_masuk: new Date().toISOString().split('T')[0],
      status_kalibrasi: 'MENUNGGU',
    };
    await runMutationWithColumnFallback(
      (nextPayload) => supabase.from(alatTable).insert(nextPayload),
      payload
    );
    await loadRows();
  }, [loadRows, resolveAlatTable]);

  const editSummaryKalibrasi = useCallback(async (item) => {
    const alatTable = await resolveAlatTable();
    await runMutationWithColumnFallback(
      (payload) => supabase.from(alatTable).update(payload).eq('id', item.id),
      {
        no_order: item.noOrder || item.kodeAlat,
        no_sertifikat: item.noSertifikat || null,
        nama_alat: item.namaAlat,
        onsite_inlab: item.onsiteInlab || null,
        remarks: item.remarks || null,
        jenis_layanan: normalizeJenisLayanan(item.kategori),
      }
    );
    await loadRows();
  }, [loadRows, resolveAlatTable]);

  const deleteSummaryKalibrasi = useCallback(async (id) => {
    const alatTable = await resolveAlatTable();
    await supabase.from(alatTable).delete().eq('id', id);
    await loadRows();
  }, [loadRows, resolveAlatTable]);

  const addJadwalOnsite = useCallback(async (item) => {
    const { data, error } = await runMutationWithColumnFallback(
      (payload) => supabase.from('jadwal_onsite').insert(payload).select('*').single(),
      {
        no_order: item.noOrder || null,
        tanggal_onsite: item.tanggalOnsite,
        pelanggan: item.pelanggan,
        lokasi: item.lokasi,
        teknisi: item.teknisi || null,
        durasi_onsite: item.durasiOnsite || null,
        remarks: item.remarks || null,
        status: item.status || 'TERJADWAL',
      }
    );
    if (error) throw error;
    await loadJadwalOnsite();
    return data ? normalizeJadwalOnsite(data) : null;
  }, [loadJadwalOnsite]);

  const editJadwalOnsite = useCallback(async (item) => {
    const { error } = await runMutationWithColumnFallback(
      (payload) => supabase.from('jadwal_onsite').update(payload).eq('id', item.id),
      {
        no_order: item.noOrder || null,
        tanggal_onsite: item.tanggalOnsite,
        pelanggan: item.pelanggan,
        lokasi: item.lokasi,
        teknisi: item.teknisi || null,
        durasi_onsite: item.durasiOnsite || null,
        remarks: item.remarks || null,
        status: item.status || 'TERJADWAL',
      }
    );
    if (error) throw error;
    await loadJadwalOnsite();
  }, [loadJadwalOnsite]);

  const deleteJadwalOnsite = useCallback(async (id) => {
    const { error } = await supabase.from('jadwal_onsite').delete().eq('id', id);
    if (error) throw error;
    await loadJadwalOnsite();
  }, [loadJadwalOnsite]);

  return (
    <DataContext.Provider
      value={{
        alatMasuk,
        alatKeluar,
        summaryKalibrasi,
        jadwalOnsite,
        addAlatMasuk,
        editAlatMasuk,
        updateStatus,
        updateRemarks,
        deleteAlatMasuk,
        addSummaryKalibrasi,
        editSummaryKalibrasi,
        deleteSummaryKalibrasi,
        addJadwalOnsite,
        editJadwalOnsite,
        deleteJadwalOnsite,
        fetchData: loadRows,
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
