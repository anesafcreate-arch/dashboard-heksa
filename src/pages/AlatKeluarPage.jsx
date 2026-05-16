import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import { AlertTriangle, CheckCircle2, Eye, XCircle } from 'lucide-react';
import AlatKeluarIcon from '../components/ui/AlatKeluarIcon';
import { STATUS_KALIBRASI } from '../data/mockData';
import { resolveRole } from '../utils/roles';
import './PageStyles.css';

const STATUS_META = Object.fromEntries(STATUS_KALIBRASI.map((status) => [status.value, status]));
const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.MENUNGGU;

export default function AlatKeluarPage() {
  const { user } = useAuth();
  const { alatKeluar, updateStatus, updateRemarks } = useData();

  const roleName = resolveRole(user?.role, user?.email)?.toLowerCase();
  const canEdit = roleName === 'adminutama' || roleName === 'admin' || roleName === 'teknisi' || roleName === 'supervisor' || roleName === 'direktur';

  const [cancelFlow, setCancelFlow] = useState({
    isOpen: false,
    step: 1,
    targetId: null,
    previousStatus: 'MENUNGGU',
    employeeId: '',
    reason: '',
    isSubmitting: false,
  });

  useEffect(() => {
    if (!cancelFlow.isOpen) return undefined;

    const onEsc = (event) => {
      if (event.key === 'Escape' && !cancelFlow.isSubmitting) {
        setCancelFlow((prev) => ({
          ...prev,
          isOpen: false,
          step: 1,
          targetId: null,
          employeeId: '',
          reason: '',
          isSubmitting: false,
        }));
      }
    };

    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [cancelFlow.isOpen, cancelFlow.isSubmitting]);

  const closeCancelModal = () => {
    setCancelFlow((prev) => ({
      ...prev,
      isOpen: false,
      step: 1,
      targetId: null,
      employeeId: '',
      reason: '',
      isSubmitting: false,
    }));
  };

  const handleStatusChange = async (id, newStatus, currentStatus) => {
    if (!canEdit) return;

    const normalizedCurrentStatus = String(currentStatus || 'MENUNGGU').toUpperCase();
    const normalizedNewStatus = String(newStatus || '').toUpperCase();

    if (normalizedNewStatus === 'DIBATALKAN') {
      setCancelFlow({
        isOpen: true,
        step: 1,
        targetId: id,
        previousStatus: normalizedCurrentStatus,
        employeeId: '',
        reason: '',
        isSubmitting: false,
      });
      return;
    }

    try {
      await updateStatus(id, normalizedNewStatus);
    } catch (error) {
      console.error('Supabase Error:', error);
      alert(`Gagal mengubah status: ${error?.message || 'Terjadi kesalahan'}`);
    }
  };

  const handleCancelFlowSubmit = async () => {
    const targetId = cancelFlow.targetId;
    const stateIdKaryawan = cancelFlow.employeeId.trim();
    const stateAlasan = cancelFlow.reason.trim();

    if (targetId === null || targetId === undefined || cancelFlow.isSubmitting) return;
    if (!stateIdKaryawan || !stateAlasan) return;

    setCancelFlow((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await updateStatus(targetId, 'DIBATALKAN');
      await updateRemarks(targetId, `Dibatalkan oleh ID ${stateIdKaryawan}: ${stateAlasan}`);
      closeCancelModal();
    } catch (error) {
      console.error('Supabase Error:', error);
      alert(`Gagal membatalkan layanan: ${error?.message || 'Terjadi kesalahan'}`);
      setCancelFlow((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const sortedAlatKeluar = useMemo(() => {
    return [...alatKeluar].sort((a, b) => {
      const timeCompare = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (timeCompare !== 0) return timeCompare;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [alatKeluar]);

  const columns = [
    { header: 'No. Order', accessor: 'noOrder', width: '160px' },
    { header: 'Nama Alat', accessor: 'namaAlat', width: '200px' },
    {
      header: 'Jenis Layanan',
      accessor: 'jenisLayanan',
      width: '230px',
      render: (row) => <span className="badge info">{row.jenisLayanan}</span>,
    },
    { header: 'Tanggal Masuk', accessor: 'tanggalMasuk', width: '140px' },
    {
      header: 'Status Layanan',
      width: '220px',
      render: (row) => {
        const meta = getStatusMeta(row.statusKalibrasi);

        return (
          <div className="status-select-wrap" style={{ '--status-color': meta.color }}>
            <span className="status-lamp" aria-hidden="true" style={{ pointerEvents: 'none' }}></span>
          <select
            className="status-select status-select-with-lamp"
            value={
              cancelFlow.isOpen && cancelFlow.targetId === row.id
                ? 'DIBATALKAN'
                : String(row.statusKalibrasi || 'MENUNGGU').toUpperCase()
            }
            onChange={(e) => handleStatusChange(row.id, e.target.value, row.statusKalibrasi)}
            disabled={!canEdit}
          >
            {STATUS_KALIBRASI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          </div>
        );
      },
    },
    {
      header: 'Kurang Kelengkapan',
      width: '200px',
      render: (row) => row.kurangKelengkapan || '-',
    },
    {
      header: 'Tanggal Selesai',
      width: '140px',
      render: (row) => row.tanggalSelesai || row.tanggal_selesai || <span style={{ color: 'var(--color-text-muted)' }}>-</span>,
    },
    {
      header: 'Diambil Customer',
      width: '140px',
      render: (row) => row.tanggalDiambil || row.tanggal_diambil || row.tanggal_ambil || <span style={{ color: 'var(--color-text-muted)' }}>-</span>,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlatKeluarIcon size={28} color="var(--color-brand-accent)" /> Status Alat
        </h1>
        {!canEdit && (
          <span className="badge info" style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={14} /> Mode Lihat Saja
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={sortedAlatKeluar}
        searchPlaceholder="Cari no. order, nama, atau jenis layanan..."
        tableScrollClassName="status-alat-table-scroll"
        emptyIcon={<AlatKeluarIcon size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada data status alat"
      />

      {cancelFlow.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.72)',
            padding: '16px',
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !cancelFlow.isSubmitting) {
              closeCancelModal();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              borderRadius: '18px',
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.97), rgba(2,8,23,0.98))',
              boxShadow: '0 18px 48px rgba(2,6,23,0.6)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                borderBottom: '1px solid rgba(148,163,184,0.2)',
                padding: '16px 24px',
              }}
            >
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>
                Tahap {cancelFlow.step} dari 3
              </p>
              <h3 style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {cancelFlow.step === 1 && 'Validasi Karyawan'}
                {cancelFlow.step === 2 && 'Alasan Pembatalan'}
                {cancelFlow.step === 3 && 'Konfirmasi Pembatalan'}
              </h3>
            </div>

            {cancelFlow.step === 1 && (
              <div style={{ padding: '20px 24px' }}>
                <input
                  type="text"
                  placeholder="Masukkan ID Karyawan"
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.4)',
                    background: 'rgba(2, 8, 23, 0.9)',
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    color: '#f8fafc',
                    outline: 'none',
                  }}
                  value={cancelFlow.employeeId}
                  onChange={(event) =>
                    setCancelFlow((prev) => ({ ...prev, employeeId: event.target.value }))
                  }
                  disabled={cancelFlow.isSubmitting}
                />
                <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setCancelFlow((prev) => ({ ...prev, step: 2 }))
                    }
                    disabled={!cancelFlow.employeeId.trim() || cancelFlow.isSubmitting}
                    style={{
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: !cancelFlow.employeeId.trim() || cancelFlow.isSubmitting ? '#334155' : '#0284c7',
                      opacity: !cancelFlow.employeeId.trim() || cancelFlow.isSubmitting ? 0.6 : 1,
                      cursor: !cancelFlow.employeeId.trim() || cancelFlow.isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {cancelFlow.step === 2 && (
              <div style={{ padding: '20px 24px' }}>
                <textarea
                  placeholder="Masukkan alasan dibatalkan..."
                  rows={4}
                  style={{
                    width: '100%',
                    resize: 'none',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.4)',
                    background: 'rgba(2, 8, 23, 0.9)',
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    color: '#f8fafc',
                    outline: 'none',
                  }}
                  value={cancelFlow.reason}
                  onChange={(event) =>
                    setCancelFlow((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  disabled={cancelFlow.isSubmitting}
                />
                <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setCancelFlow((prev) => ({ ...prev, step: 1 }))}
                    disabled={cancelFlow.isSubmitting}
                    style={{
                      borderRadius: '10px',
                      border: '1px solid rgba(148,163,184,0.4)',
                      background: 'rgba(30, 41, 59, 0.9)',
                      padding: '9px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#e2e8f0',
                      opacity: cancelFlow.isSubmitting ? 0.6 : 1,
                      cursor: cancelFlow.isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelFlow((prev) => ({ ...prev, step: 3 }))}
                    disabled={!cancelFlow.reason.trim() || cancelFlow.isSubmitting}
                    style={{
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: !cancelFlow.reason.trim() || cancelFlow.isSubmitting ? '#334155' : '#0284c7',
                      opacity: !cancelFlow.reason.trim() || cancelFlow.isSubmitting ? 0.6 : 1,
                      cursor: !cancelFlow.reason.trim() || cancelFlow.isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {cancelFlow.step === 3 && (
              <div style={{ padding: '26px 24px 28px', textAlign: 'center' }}>
                <div
                  style={{
                    margin: '0 auto',
                    display: 'flex',
                    width: '66px',
                    height: '66px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    background: 'rgba(244, 63, 94, 0.17)',
                    color: '#fda4af',
                  }}
                >
                  <AlertTriangle size={34} />
                </div>
                <h4 style={{ marginTop: '16px', fontSize: '1.28rem', fontWeight: 800, color: '#ffffff' }}>Batalkan Layanan?</h4>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>Apa kamu yakin ingin membatalkannya?</p>
                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    disabled={cancelFlow.isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(251,113,133,0.45)',
                      background: 'rgba(251,113,133,0.13)',
                      padding: '10px 14px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#fecdd3',
                      opacity: cancelFlow.isSubmitting ? 0.6 : 1,
                      cursor: cancelFlow.isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <XCircle size={18} color="#fda4af" />
                    Tidak
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelFlowSubmit}
                    disabled={cancelFlow.isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '10px',
                      background: '#34d399',
                      padding: '10px 14px',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      color: '#064e3b',
                      opacity: cancelFlow.isSubmitting ? 0.6 : 1,
                      cursor: cancelFlow.isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <CheckCircle2 size={18} color="#065f46" />
                    {cancelFlow.isSubmitting ? 'Memproses...' : 'Ya'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
