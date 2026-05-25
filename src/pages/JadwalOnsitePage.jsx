import { useMemo, useState } from 'react';
import { CalendarDays, Edit, MapPin, Plus, Save, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { canManageJadwalOnsite, normalizeRole } from '../utils/roles';
import './PageStyles.css';

const STATUS_ONSITE = ['TERJADWAL', 'PROSES', 'SELESAI', 'BATAL'];
const EMPTY_FORM = {
  noOrder: '',
  tanggalOnsite: '',
  pelanggan: '',
  lokasi: '',
  teknisi: '',
  durasiOnsite: '',
  remarks: '',
  status: 'TERJADWAL',
};

export default function JadwalOnsitePage() {
  const { user } = useAuth();
  const { alatMasuk, jadwalOnsite, addJadwalOnsite, editJadwalOnsite, deleteJadwalOnsite } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);

  const canManage = canManageJadwalOnsite(user?.role);

  const noOrderOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    alatMasuk.forEach((item) => {
      const value = String(item.noOrder || '').trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      options.push(value);
    });
    return options;
  }, [alatMasuk]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingItem(null);
    setMessage(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      noOrder: item.noOrder || '',
      tanggalOnsite: item.tanggalOnsite || '',
      pelanggan: item.pelanggan || '',
      lokasi: item.lokasi || '',
      teknisi: item.teknisi || '',
      durasiOnsite: item.durasiOnsite || '',
      remarks: item.remarks || '',
      status: item.status || 'TERJADWAL',
    });
    setMessage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    if (!formData.noOrder || !formData.tanggalOnsite || !formData.pelanggan || !formData.lokasi || !formData.status) {
      setMessage({ type: 'error', text: 'No. Order, tanggal, pelanggan, lokasi, dan status wajib diisi.' });
      return;
    }

    try {
      if (editingItem) {
        await editJadwalOnsite({ id: editingItem.id, ...formData });
      } else {
        await addJadwalOnsite(formData);
      }
      closeModal();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Gagal menyimpan jadwal onsite.' });
    }
  };

  const handleDelete = async () => {
    if (!canManage || !deleteId) return;
    await deleteJadwalOnsite(deleteId);
    setDeleteId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns = useMemo(() => [
    {
      header: 'No. Order',
      accessor: 'noOrder',
      width: '150px',
      render: (row) => row.noOrder || '-',
    },
    {
      header: 'Tanggal',
      accessor: 'tanggalOnsite',
      render: (row) => formatDate(row.tanggalOnsite),
    },
    { header: 'Pelanggan', accessor: 'pelanggan' },
    {
      header: 'Lokasi',
      accessor: 'lokasi',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} /> {row.lokasi}
        </span>
      ),
    },
    {
      header: 'Teknisi',
      accessor: 'teknisi',
      render: (row) => row.teknisi || '-',
    },
    {
      header: 'Durasi Onsite',
      accessor: 'durasiOnsite',
      width: '130px',
      render: (row) => row.durasiOnsite || '-',
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      width: '240px',
      render: (row) => (
        <span style={{ display: 'inline-block', maxWidth: '230px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {row.remarks || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <span className={`badge ${statusBadge(row.status)}`}>{row.status}</span>,
    },
    ...(canManage
      ? [
          {
            header: 'Aksi',
            width: '100px',
            render: (row) => (
              <div className="table-actions">
                <button className="table-action-btn edit" title="Edit" onClick={() => openEdit(row)}>
                  <Edit size={16} />
                </button>
                <button className="table-action-btn delete" title="Hapus" onClick={() => setDeleteId(row.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ], [canManage]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <CalendarDays size={28} color="var(--color-primary)" /> Jadwal Onsite
        </h1>
        <div className="page-header-actions">
          {!canManage && (
            <span className="badge info" style={{ gap: '6px' }}>
              <Eye size={14} /> Mode Lihat Saja
            </span>
          )}
          {canManage && (
            <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={jadwalOnsite}
        searchPlaceholder="Cari no. order, pelanggan, lokasi, teknisi, durasi, remarks, atau status..."
        tableScrollClassName="jadwal-onsite-table-scroll"
        emptyIcon={<CalendarDays size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada jadwal onsite"
      />

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingItem ? <Edit size={20} /> : <CalendarDays size={20} />}
            {editingItem ? 'Edit Jadwal Onsite' : 'Tambah Jadwal Onsite'}
          </div>
        }
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal}>Batal</button>
            <button className="btn-primary" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">No. Order *</label>
          <input
            className="form-input"
            type="text"
            list="no-order-onsite-options"
            placeholder="Contoh: ORD-2026-013"
            value={formData.noOrder}
            onChange={(e) => setFormData({ ...formData, noOrder: e.target.value })}
          />
          <datalist id="no-order-onsite-options">
            {noOrderOptions.map((noOrder) => (
              <option key={noOrder} value={noOrder} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label className="form-label">Tanggal *</label>
          <input
            className="form-input"
            type="date"
            value={formData.tanggalOnsite}
            onChange={(e) => setFormData({ ...formData, tanggalOnsite: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Pelanggan *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Nama pelanggan"
            value={formData.pelanggan}
            onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lokasi *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Kota / alamat onsite"
            value={formData.lokasi}
            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Teknisi</label>
          <input
            className="form-input"
            type="text"
            placeholder="Ketik nama teknisi"
            value={formData.teknisi}
            onChange={(e) => setFormData({ ...formData, teknisi: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Durasi Onsite</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: 1 Hari / 2 Hari / 3 Hari"
            value={formData.durasiOnsite}
            onChange={(e) => setFormData({ ...formData, durasiOnsite: e.target.value })}
          />
        </div>

        <div className="form-group md:col-span-2 col-span-2">
          <label className="form-label">Remarks</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Tulis catatan onsite..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status *</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {STATUS_ONSITE.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {message && <div className="form-error">{message.text}</div>}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Jadwal?"
        message="Jadwal onsite ini akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}

function statusBadge(status) {
  const key = normalizeRole(status);
  if (key === 'selesai') return 'success';
  if (key === 'proses') return 'warning';
  if (key === 'batal') return 'danger';
  return 'info';
}
