import { useMemo, useState } from 'react';
import { Database, Eye, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { resolveRole } from '../utils/roles';
import './PageStyles.css';

const STATUS_STYLES = {
  MENUNGGU: {
    color: '#cbd5e1',
    background: 'rgba(148, 163, 184, 0.14)',
    border: '1px solid rgba(148, 163, 184, 0.3)',
  },
  PENDING_CUSTOMER: {
    color: '#fcd34d',
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  PROSES: {
    color: '#93c5fd',
    background: 'rgba(59, 130, 246, 0.16)',
    border: '1px solid rgba(59, 130, 246, 0.34)',
  },
  'PROSES KALIBRASI': {
    color: '#93c5fd',
    background: 'rgba(59, 130, 246, 0.16)',
    border: '1px solid rgba(59, 130, 246, 0.34)',
  },
  SELESAI: {
    color: '#86efac',
    background: 'rgba(34, 197, 94, 0.16)',
    border: '1px solid rgba(34, 197, 94, 0.35)',
  },
  'SELESAI KALIBRASI': {
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
  const raw = String(value || '').trim();
  if (!raw) return 'MENUNGGU';

  const aliases = {
    MENUNGGU: 'MENUNGGU',
    'PENDING CUSTOMER': 'PENDING_CUSTOMER',
    PENDING_CUSTOMER: 'PENDING_CUSTOMER',
    PROSES: 'PROSES',
    'PROSES KALIBRASI': 'PROSES',
    SELESAI: 'SELESAI',
    'SELESAI KALIBRASI': 'SELESAI',
    DIAMBIL: 'DIAMBIL',
    DIBATALKAN: 'DIBATALKAN',
  };

  return aliases[raw] || aliases[raw.toUpperCase()] || 'MENUNGGU';
};

const getStatusLabel = (status) => {
  if (status === 'PENDING_CUSTOMER') return 'Pending Customer';
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
  const { alatMasuk: summaryData, updateRemarks } = useData();
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksTarget, setRemarksTarget] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);

  const roleName = resolveRole(user?.role, user?.email)?.toLowerCase();
  const canViewOnly =
    roleName === 'adminutama' ||
    roleName === 'admin' ||
    roleName === 'teknisi' ||
    roleName === 'supervisor' ||
    roleName === 'direktur';
  const canEditRemarks =
    roleName === 'adminutama' ||
    roleName === 'admin' ||
    roleName === 'teknisi' ||
    roleName === 'supervisor' ||
    roleName === 'direktur' ||
    roleName === 'manager';

  const openRemarksEditor = (row) => {
    setRemarksTarget(row);
    setRemarksDraft(row.remarks || '');
    setRemarksError('');
    setShowRemarksModal(true);
  };

  const closeRemarksEditor = () => {
    setShowRemarksModal(false);
    setRemarksTarget(null);
    setRemarksDraft('');
    setRemarksError('');
    setIsSavingRemarks(false);
  };

  const saveRemarks = async () => {
    if (!remarksTarget?.id || isSavingRemarks) return;
    setIsSavingRemarks(true);
    setRemarksError('');
    try {
      await updateRemarks(remarksTarget.id, remarksDraft.trim() || null);
      closeRemarksEditor();
    } catch (error) {
      setRemarksError(error?.message || 'Gagal menyimpan remarks.');
      setIsSavingRemarks(false);
    }
  };

  const sortedSummaryData = useMemo(() => {
    const sorted = [...summaryData].sort((a, b) => {
      const timeCompare = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (timeCompare !== 0) return timeCompare;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return sorted.map((row) => {
      const status = normalizeStatus(row.statusKalibrasi);
      return {
        ...row,
        statusKalibrasi: status,
        statusSearch: getStatusLabel(status),
      };
    });
  }, [summaryData]);

  const columns = [
    {
      key: 'noOrder',
      header: 'No. Order',
      accessor: 'noOrder',
      width: '150px',
      render: (row) => row.noOrder || row.no_order || '-',
    },
    {
      key: 'noSertifikat',
      header: 'No. Sertifikat',
      accessor: 'noSertifikat',
      width: '170px',
      render: (row) => row.noSertifikat || row.no_sertifikat || '-',
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
      accessor: 'spesifikasi',
      width: '220px',
      render: (row) => row.spesifikasi || '-',
    },
    {
      key: 'jenisLayanan',
      header: 'Jenis Layanan',
      accessor: 'jenisLayanan',
      width: '230px',
      render: (row) => <span className="badge info">{row.jenisLayanan || '-'}</span>,
    },
    {
      key: 'onsiteInlab',
      header: 'Onsite/Inlab',
      accessor: 'onsiteInlab',
      width: '120px',
      render: (row) => row.onsiteInlab || row.onsite_inlab || '-',
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      accessor: 'jumlah',
      width: '90px',
      render: (row) => row.jumlah ?? '-',
    },
    {
      key: 'lab',
      header: 'Lab',
      accessor: 'lab',
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
      accessor: 'statusSearch',
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
      accessor: 'remarks',
      width: '180px',
      render: (row) => (
        <div
          style={{
            display: 'block',
            width: '180px',
            minWidth: '180px',
            maxWidth: '180px',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {row.remarks || '-'}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: '110px',
      render: (row) =>
        canEditRemarks ? (
          <div className="table-actions">
            <button type="button" className="table-action-btn edit" title="Edit Remarks" onClick={() => openRemarksEditor(row)}>
              <Edit size={16} />
            </button>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
        ),
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
        searchPlaceholder="Cari no. order, no. sertifikat, nama alat, layanan, onsite/inlab, lab, atau status..."
        tableScrollClassName="summary-kalibrasi-table-scroll"
        emptyIcon={<Database size={32} color="var(--color-text-muted)" />}
        emptyText="Data Buku Induk masih kosong"
      />

      <Modal
        isOpen={showRemarksModal}
        onClose={closeRemarksEditor}
        title={(
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit size={20} />
            Edit Remarks
          </div>
        )}
        footer={(
          <>
            <button className="btn-secondary" onClick={closeRemarksEditor} disabled={isSavingRemarks}>Batal</button>
            <button className="btn-primary" onClick={saveRemarks} disabled={isSavingRemarks} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> {isSavingRemarks ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Remarks</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Tulis catatan..."
            value={remarksDraft}
            onChange={(event) => setRemarksDraft(event.target.value)}
          />
          {remarksError && <div className="form-error">{remarksError}</div>}
        </div>
      </Modal>
    </div>
  );
}
