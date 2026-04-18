import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/Modal';
import { Eye } from 'lucide-react';
import AlatKeluarIcon from '../components/ui/AlatKeluarIcon';
import { STATUS_KALIBRASI } from '../data/mockData';
import './PageStyles.css';

export default function BarangKeluarPage() {
  const { user } = useAuth();
  const { barangKeluar, updateStatus } = useData();
  const isAdmin = user?.role === 'admin';
  const isTeknisi = user?.role === 'teknisi';
  const canEdit = isAdmin || isTeknisi;

  const [statusConfirm, setStatusConfirm] = useState(null);

  const handleStatusChange = (item, newStatus) => {
    if (!canEdit) return;
    setStatusConfirm({ item, newStatus });
  };

  const confirmStatusChange = () => {
    if (statusConfirm) {
      updateStatus(statusConfirm.item.id, statusConfirm.newStatus);
      setStatusConfirm(null);
    }
  };

  const getStatusLabel = (status) => {
    const found = STATUS_KALIBRASI.find((s) => s.value === status);
    return found?.label || status;
  };

  const getStatusClass = (status) => {
    const map = {
      MENUNGGU: 'menunggu',
      PROSES: 'proses',
      SELESAI: 'selesai',
      DIAMBIL: 'diambil',
    };
    return map[status] || '';
  };

  const columns = [
    { header: 'Kode Alat', accessor: 'kodeBarang' },
    { header: 'Nama Alat', accessor: 'namaBarang' },
    {
      header: 'Jenis Layanan',
      accessor: 'jenisLayanan',
      render: (row) => <span className="badge info">{row.jenisLayanan}</span>,
    },
    { header: 'Tanggal Masuk', accessor: 'tanggalMasuk' },
    {
      header: 'Status Kalibrasi',
      width: '180px',
      render: (row) =>
        canEdit ? (
          <select
            className="status-select"
            value={row.statusKalibrasi || 'MENUNGGU'}
            onChange={(e) => handleStatusChange(row, e.target.value)}
          >
            {STATUS_KALIBRASI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={`status-badge ${getStatusClass(row.statusKalibrasi)}`}>
            {getStatusLabel(row.statusKalibrasi)}
          </span>
        ),
    },
    {
      header: 'Tanggal Diambil',
      render: (row) =>
        row.tanggalDiambil ? (
          row.tanggalDiambil
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlatKeluarIcon size={28} color="var(--color-brand-accent)" /> Alat Keluar
        </h1>
        {!canEdit && (
          <span className="badge info" style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={14} /> Mode Lihat Saja
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={barangKeluar}
        searchPlaceholder="Cari kode, nama, atau jenis layanan..."
        emptyIcon={<AlatKeluarIcon size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada alat keluar"
      />

      <ConfirmDialog
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={confirmStatusChange}
        title="Ubah Status Kalibrasi"
        message={`Ubah status "${statusConfirm?.item?.namaBarang}" menjadi "${getStatusLabel(statusConfirm?.newStatus)}"?`}
        confirmText="Ya, Ubah Status"
        variant="primary"
      />
    </div>
  );
}
