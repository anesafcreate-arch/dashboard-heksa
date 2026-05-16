// Mock data untuk development — akan diganti dengan API/backend nanti

export const JENIS_LAYANAN = [
  'Kalibrasi Massa dan Timbangan',
  'Kalibrasi Dimensi',
  'Kalibrasi Tekanan',
  'Kalibrasi Gaya',
  'Kalibrasi Kelistrikan',
  'Kalibrasi Suhu',
  'Kalibrasi Instrumen Analitik',
  'Kalibrasi Volumetrik',
];

// Status Kalibrasi — Milestone Tracking
export const STATUS_KALIBRASI = [
  { value: 'MENUNGGU', label: 'Menunggu', color: '#9ca3af' },
  { value: 'PROSES', label: 'Proses', color: '#3b82f6' },
  { value: 'DIBATALKAN', label: 'Dibatalkan', color: '#ef4444' },
  { value: 'SELESAI', label: 'Selesai', color: '#22c55e' },
  { value: 'DIAMBIL', label: 'Diambil', color: '#14b8a6' },
];

export const USERS = [
  { id: 1, username: 'admin', password: 'admin123', nama: 'Amel', role: 'admin' },
  { id: 2, username: 'teknisi', password: 'teknisi123', nama: 'Hilal', role: 'teknisi' },
  { id: 3, username: 'direktur', password: 'direktur123', nama: 'Ir. Taufik Hidayat', role: 'direktur' },
];

// Helper to generate dates
const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ALAT_MASUK = [
  {
    id: 1,
    kodeAlat: 'KB-2026-001',
    namaAlat: 'Caliper Digital Mitutoyo',
    jenisLayanan: 'Kalibrasi Dimensi',
    tanggalMasuk: daysAgo(0),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 2,
    kodeAlat: 'KB-2026-002',
    namaAlat: 'Thermometer Infrared Fluke 62',
    jenisLayanan: 'Kalibrasi Suhu',
    tanggalMasuk: daysAgo(0),
    dokumen: null,
    dokumenNama: 'PO_Fluke62.pdf',
  },
  {
    id: 3,
    kodeAlat: 'KB-2026-003',
    namaAlat: 'Pressure Gauge Ashcroft',
    jenisLayanan: 'Kalibrasi Tekanan',
    tanggalMasuk: daysAgo(1),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 4,
    kodeAlat: 'KB-2026-004',
    namaAlat: 'Timbangan Analitik Mettler Toledo',
    jenisLayanan: 'Kalibrasi Massa dan Timbangan',
    tanggalMasuk: daysAgo(1),
    dokumen: null,
    dokumenNama: 'SuratJalan_MT.pdf',
  },
  {
    id: 5,
    kodeAlat: 'KB-2026-005',
    namaAlat: 'Multimeter Digital Fluke 87V',
    jenisLayanan: 'Kalibrasi Kelistrikan',
    tanggalMasuk: daysAgo(2),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 6,
    kodeAlat: 'KB-2026-006',
    namaAlat: 'Force Gauge Shimpo FGV-50XY',
    jenisLayanan: 'Kalibrasi Gaya',
    tanggalMasuk: daysAgo(2),
    dokumen: null,
    dokumenNama: 'PO_Shimpo.pdf',
  },
  {
    id: 7,
    kodeAlat: 'KB-2026-007',
    namaAlat: 'pH Meter Hanna HI2020',
    jenisLayanan: 'Kalibrasi Instrumen Analitik',
    tanggalMasuk: daysAgo(3),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 8,
    kodeAlat: 'KB-2026-008',
    namaAlat: 'Mikrometer Mitutoyo 293-340',
    jenisLayanan: 'Kalibrasi Dimensi',
    tanggalMasuk: daysAgo(3),
    dokumen: null,
    dokumenNama: 'SuratJalan_Mikro.pdf',
  },
  {
    id: 9,
    kodeAlat: 'KB-2026-009',
    namaAlat: 'Pipet Volume Brand 10ml',
    jenisLayanan: 'Kalibrasi Volumetrik',
    tanggalMasuk: daysAgo(4),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 10,
    kodeAlat: 'KB-2026-010',
    namaAlat: 'Torque Wrench Tohnichi',
    jenisLayanan: 'Kalibrasi Volumetrik',
    tanggalMasuk: daysAgo(5),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 11,
    kodeAlat: 'KB-2026-011',
    namaAlat: 'Dial Indicator Peacock',
    jenisLayanan: 'Kalibrasi Dimensi',
    tanggalMasuk: daysAgo(5),
    dokumen: null,
    dokumenNama: 'PO_Peacock.pdf',
  },
  {
    id: 12,
    kodeAlat: 'KB-2026-012',
    namaAlat: 'Thermocouple Type K Omega',
    jenisLayanan: 'Kalibrasi Suhu',
    tanggalMasuk: daysAgo(6),
    dokumen: null,
    dokumenNama: null,
  },
];

// Alat Keluar now uses statusKalibrasi instead of simple sudahDiambil boolean
export const INITIAL_ALAT_KELUAR = INITIAL_ALAT_MASUK.map((item) => ({
  ...item,
  statusKalibrasi: item.id <= 2 ? 'PROSES' : item.id <= 4 ? 'DIAMBIL' : item.id <= 6 ? 'SELESAI' : 'MENUNGGU',
  sudahDiambil: item.id <= 4 && item.id > 2,
  tanggalDiambil: (item.id <= 4 && item.id > 2) ? daysAgo(0) : null,
}));

export const DATABASE_KALIBRASI = [
  { id: 1, kodeAlat: 'ALT-001', namaAlat: 'Caliper Digital', kategori: 'Kalibrasi Dimensi' },
  { id: 2, kodeAlat: 'ALT-002', namaAlat: 'Thermometer Infrared', kategori: 'Kalibrasi Suhu' },
  { id: 3, kodeAlat: 'ALT-003', namaAlat: 'Pressure Gauge', kategori: 'Kalibrasi Tekanan' },
  { id: 4, kodeAlat: 'ALT-004', namaAlat: 'Timbangan Analitik', kategori: 'Kalibrasi Massa dan Timbangan' },
  { id: 5, kodeAlat: 'ALT-005', namaAlat: 'Multimeter Digital', kategori: 'Kalibrasi Kelistrikan' },
  { id: 6, kodeAlat: 'ALT-006', namaAlat: 'Force Gauge', kategori: 'Kalibrasi Gaya' },
  { id: 7, kodeAlat: 'ALT-007', namaAlat: 'pH Meter', kategori: 'Kalibrasi Instrumen Analitik' },
  { id: 8, kodeAlat: 'ALT-008', namaAlat: 'Mikrometer', kategori: 'Kalibrasi Dimensi' },
  { id: 9, kodeAlat: 'ALT-009', namaAlat: 'Pipet Volume', kategori: 'Kalibrasi Volumetrik' },
  { id: 10, kodeAlat: 'ALT-010', namaAlat: 'Torque Wrench', kategori: 'Kalibrasi Volumetrik' },
];

// Stats untuk dashboard chart (7 hari terakhir)
export const CHART_DATA_7HARI = {
  labels: [daysAgo(6), daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(2), daysAgo(1), daysAgo(0)].map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
  }),
  masuk: [1, 2, 1, 2, 2, 2, 2],
  keluar: [0, 1, 0, 1, 1, 1, 2],
};
