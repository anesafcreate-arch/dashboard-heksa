// Mock data untuk development — akan diganti dengan API/backend nanti

export const JENIS_LAYANAN = [
  'Weight and Balance Calibration',
  'Dimensional Calibration',
  'Pressure Calibration',
  'Force Calibration',
  'Electrical Calibration',
  'Temperature Calibration',
  'Analytical Instrument Calibration',
  'Volumetric Calibration',
  'Other Calibration',
];

// Status Kalibrasi — Milestone Tracking
export const STATUS_KALIBRASI = [
  { value: 'MENUNGGU', label: 'Menunggu', color: '#fbbf24' },
  { value: 'PROSES', label: 'Proses Kalibrasi', color: '#60a5fa' },
  { value: 'SELESAI', label: 'Selesai', color: '#4ade80' },
  { value: 'DIAMBIL', label: 'Diambil', color: '#94a3b8' },
];

export const USERS = [
  { id: 1, username: 'admin', password: 'admin123', nama: 'Amel', role: 'admin' },
  { id: 2, username: 'teknisi', password: 'teknisi123', nama: 'Budi Santoso', role: 'teknisi' },
  { id: 3, username: 'direktur', password: 'direktur123', nama: 'Ir. Ahmad Hidayat', role: 'direktur' },
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
    jenisLayanan: 'Dimensional Calibration',
    tanggalMasuk: daysAgo(0),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 2,
    kodeAlat: 'KB-2026-002',
    namaAlat: 'Thermometer Infrared Fluke 62',
    jenisLayanan: 'Temperature Calibration',
    tanggalMasuk: daysAgo(0),
    dokumen: null,
    dokumenNama: 'PO_Fluke62.pdf',
  },
  {
    id: 3,
    kodeAlat: 'KB-2026-003',
    namaAlat: 'Pressure Gauge Ashcroft',
    jenisLayanan: 'Pressure Calibration',
    tanggalMasuk: daysAgo(1),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 4,
    kodeAlat: 'KB-2026-004',
    namaAlat: 'Timbangan Analitik Mettler Toledo',
    jenisLayanan: 'Weight and Balance Calibration',
    tanggalMasuk: daysAgo(1),
    dokumen: null,
    dokumenNama: 'SuratJalan_MT.pdf',
  },
  {
    id: 5,
    kodeAlat: 'KB-2026-005',
    namaAlat: 'Multimeter Digital Fluke 87V',
    jenisLayanan: 'Electrical Calibration',
    tanggalMasuk: daysAgo(2),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 6,
    kodeAlat: 'KB-2026-006',
    namaAlat: 'Force Gauge Shimpo FGV-50XY',
    jenisLayanan: 'Force Calibration',
    tanggalMasuk: daysAgo(2),
    dokumen: null,
    dokumenNama: 'PO_Shimpo.pdf',
  },
  {
    id: 7,
    kodeAlat: 'KB-2026-007',
    namaAlat: 'pH Meter Hanna HI2020',
    jenisLayanan: 'Analytical Instrument Calibration',
    tanggalMasuk: daysAgo(3),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 8,
    kodeAlat: 'KB-2026-008',
    namaAlat: 'Mikrometer Mitutoyo 293-340',
    jenisLayanan: 'Dimensional Calibration',
    tanggalMasuk: daysAgo(3),
    dokumen: null,
    dokumenNama: 'SuratJalan_Mikro.pdf',
  },
  {
    id: 9,
    kodeAlat: 'KB-2026-009',
    namaAlat: 'Pipet Volume Brand 10ml',
    jenisLayanan: 'Volumetric Calibration',
    tanggalMasuk: daysAgo(4),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 10,
    kodeAlat: 'KB-2026-010',
    namaAlat: 'Torque Wrench Tohnichi',
    jenisLayanan: 'Other Calibration',
    tanggalMasuk: daysAgo(5),
    dokumen: null,
    dokumenNama: null,
  },
  {
    id: 11,
    kodeAlat: 'KB-2026-011',
    namaAlat: 'Dial Indicator Peacock',
    jenisLayanan: 'Dimensional Calibration',
    tanggalMasuk: daysAgo(5),
    dokumen: null,
    dokumenNama: 'PO_Peacock.pdf',
  },
  {
    id: 12,
    kodeAlat: 'KB-2026-012',
    namaAlat: 'Thermocouple Type K Omega',
    jenisLayanan: 'Temperature Calibration',
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
  { id: 1, kodeAlat: 'ALT-001', namaAlat: 'Caliper Digital', kategori: 'Dimensional Calibration' },
  { id: 2, kodeAlat: 'ALT-002', namaAlat: 'Thermometer Infrared', kategori: 'Temperature Calibration' },
  { id: 3, kodeAlat: 'ALT-003', namaAlat: 'Pressure Gauge', kategori: 'Pressure Calibration' },
  { id: 4, kodeAlat: 'ALT-004', namaAlat: 'Timbangan Analitik', kategori: 'Weight and Balance Calibration' },
  { id: 5, kodeAlat: 'ALT-005', namaAlat: 'Multimeter Digital', kategori: 'Electrical Calibration' },
  { id: 6, kodeAlat: 'ALT-006', namaAlat: 'Force Gauge', kategori: 'Force Calibration' },
  { id: 7, kodeAlat: 'ALT-007', namaAlat: 'pH Meter', kategori: 'Analytical Instrument Calibration' },
  { id: 8, kodeAlat: 'ALT-008', namaAlat: 'Mikrometer', kategori: 'Dimensional Calibration' },
  { id: 9, kodeAlat: 'ALT-009', namaAlat: 'Pipet Volume', kategori: 'Volumetric Calibration' },
  { id: 10, kodeAlat: 'ALT-010', namaAlat: 'Torque Wrench', kategori: 'Other Calibration' },
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
