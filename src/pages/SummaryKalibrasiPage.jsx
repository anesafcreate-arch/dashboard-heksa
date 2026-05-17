import { useMemo } from 'react';
import { Database, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import { resolveRole } from '../utils/roles';
import './PageStyles.css';

const STATUS_STYLES = {
  MENUNGGU: {
    color: '#fbbf24',
    background: 'rgba(245, 158, 11, 0.14)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  'PROSES KALIBRASI': {
    color: '#93c5fd',
    background: 'rgba(59, 130, 246, 0.16)',
    border: '1px solid rgba(59, 130, 246, 0.34)',
  },
  PROSES: {
    color: '#93c5fd',
    background: 'rgba(59, 130, 246, 0.16)',
    border: '1px solid rgba(59, 130, 246, 0.34)',
  },
  'SELESAI KALIBRASI': {
    color: '#86efac',
    background: 'rgba(34, 197, 94, 0.16)',
    border: '1px solid rgba(34, 197, 94, 0.35)',
  },
  SELESAI: {
    color: '#86efac',
    background: 'rgba(34, 197, 94, 0.16)',
    border: '1px solid rgba(34, 197, 94, 0.35)',
  },
  DIAMBIL: {
    color: '#cbd5e1',
    background: 'rgba(148, 163, 184, 0.15)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
  },
  DIBATALKAN: {
    color: '#fca5a5',
    background: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.34)',
  },
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeStatus = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  return raw || 'MENUNGGU';
};

const getStatusLabel = (status) => {
  if (status === 'PROSES' || status === 'PROSES KALIBRASI') return 'Proses Kalibrasi';
  if (status === 'SELESAI' || status === 'SELESAI KALIBRASI') return 'Selesai Kalibrasi';
  if (status === 'MENUNGGU') return 'Menunggu';
  if (status === 'DIBATALKAN') return 'Dibatalkan';
  if (status === 'DIAMBIL') return 'Diambil';
  return status;
};

const renderStatus = (row) => {
  const status = normalizeStatus(row.statusKalibrasi);
  const statusStyle = STATUS_STYLES[status] || {
    color: 'var(--color-text-secondary)',
    background: 'rgba(148, 163, 184, 0.14)',
    border: '1px solid rgba(148, 163, 184, 0.28)',
  };

  return (
    <span
      style={{
        ...statusStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        padding: '5px 12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default function SummaryKalibrasiPage() {
  const { user } = useAuth();
  const { alatMasuk: summaryData } = useData();

  const roleName = resolveRole(user?.role, user?.email)?.toLowerCase();
  const canViewOnly =
    roleName === 'adminutama' ||
    roleName === 'admin' ||
    roleName === 'teknisi' ||
    roleName === 'supervisor' ||
    roleName === 'direktur';

  const sortedSummaryData = useMemo(() => {
    return [...summaryData].sort((a, b) => {
      const timeCompare = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (timeCompare !== 0) return timeCompare;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [summaryData]);

  const columns = [
    {
      key: 'noOrder',
      header: 'No. Order',
      width: '150px',
      render: (row) => row.noOrder || '-',
    },
    {
      key: 'namaAlat',
      header: 'Nama Alat',
      accessor: 'namaAlat',
      width: '200px',
    },
    {
      key: 'spesifikasi',
      header: 'Spesifikasi',
      width: '220px',
      render: (row) => row.spesifikasi || '-',
    },
    {
      key: 'jenisLayanan',
      header: 'Jenis Layanan',
      width: '230px',
      render: (row) => <span className="badge info">{row.jenisLayanan || '-'}</span>,
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      width: '90px',
      render: (row) => row.jumlah ?? '-',
    },
    {
      key: 'lab',
      header: 'Lab',
      width: '130px',
      render: (row) => row.lab || '-',
    },
    {
      key: 'pesananKhusus',
      header: 'Pesanan Khusus',
      width: '200px',
      render: (row) => row.pesananKhusus || '-',
    },
    {
      key: 'kurangKelengkapan',
      header: 'Kurang Kelengkapan',
      width: '200px',
      render: (row) => row.kurangKelengkapan || '-',
    },
    {
      key: 'tanggalMasuk',
      header: 'Tanggal Masuk',
      width: '140px',
      render: (row) => formatDate(row.tanggalMasuk),
    },
    {
      key: 'statusKalibrasi',
      header: 'Status Layanan',
      width: '170px',
      render: renderStatus,
    },
    {
      key: 'tanggalSelesai',
      header: 'Tanggal Selesai',
      width: '140px',
      render: (row) => formatDate(row.tanggalSelesai),
    },
    {
      key: 'tanggalDiambil',
      header: 'Diambil Customer',
      width: '140px',
      render: (row) => formatDate(row.tanggalDiambil),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      width: '320px',
      render: (row) => row.remarks || '-',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={28} color="var(--color-primary)" /> Buku Induk Kalibrasi
        </h1>
        {!canViewOnly && (
          <span className="badge info" style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={14} /> Mode Lihat Saja
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={sortedSummaryData}
        searchPlaceholder="Cari no. order, nama alat, layanan, lab, atau status..."
        tableScrollClassName="summary-kalibrasi-table-scroll"
        emptyIcon={<Database size={32} color="var(--color-text-muted)" />}
        emptyText="Data Buku Induk masih kosong"
      />
    </div>
  );
}
