import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/ui/DataTable';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { Package, Download, Plus, Edit, Trash2, CloudUpload, Paperclip, Save } from 'lucide-react';
import { JENIS_LAYANAN } from '../data/mockData';
import './PageStyles.css';

export default function AlatMasukPage() {
  const { user } = useAuth();
  const { barangMasuk, addBarangMasuk, editBarangMasuk, deleteBarangMasuk } = useData();
  const { addNotification } = useNotification();
  const isAdmin = user?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    jenisLayanan: '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormData({ kodeBarang: '', namaBarang: '', jenisLayanan: '' });
    setFile(null);
    setFileError('');
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      jenisLayanan: item.jenisLayanan,
    });
    setFile(null);
    setFileError('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file melebihi 2MB!');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file melebihi 2MB!');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(f);
  };

  const handleSubmit = () => {
    if (!formData.kodeBarang || !formData.namaBarang || !formData.jenisLayanan) return;

    if (editingItem) {
      editBarangMasuk({ id: editingItem.id, ...formData });
    } else {
      const newItem = {
        ...formData,
        tanggalMasuk: new Date().toISOString().split('T')[0],
        dokumen: file ? URL.createObjectURL(file) : null,
        dokumenNama: file?.name || null,
      };
      addBarangMasuk(newItem);
      addNotification(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} /> Alat baru masuk: {formData.namaBarang} — {formData.jenisLayanan}
        </div>
      );
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteBarangMasuk(deleteId);
      setDeleteId(null);
    }
  };

  const exportCSV = () => {
    const delimiter = ';';
    const escapeCSVValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['No', 'Kode Alat', 'Nama Alat', 'Jenis Layanan', 'Tanggal Masuk', 'Dokumen'];
    const rows = barangMasuk.map((item, idx) =>
      [
        idx + 1,
        item.kodeBarang,
        item.namaBarang,
        item.jenisLayanan,
        item.tanggalMasuk,
        item.dokumenNama || '-',
      ]
        .map(escapeCSVValue)
        .join(delimiter)
    );
    const csv = [headers.map(escapeCSVValue).join(delimiter), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alat_masuk_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
      header: 'Dokumen',
      render: (row) =>
        row.dokumenNama ? (
          <span className="file-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Paperclip size={14} /> {row.dokumenNama}
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        ),
    },
    ...(isAdmin
      ? [
        {
          header: 'Aksi',
          width: '100px',
          render: (row) => (
            <div className="table-actions">
              <button
                className="table-action-btn edit"
                title="Edit"
                onClick={() => openEdit(row)}
              >
                <Edit size={16} />
              </button>
              <button
                className="table-action-btn delete"
                title="Hapus"
                onClick={() => setDeleteId(row.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]
      : []),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Package size={28} color="var(--color-primary)" /> Alat Masuk
        </h1>
        {isAdmin && (
          <div className="page-header-actions">
            <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Ekspor CSV
            </button>
            <button className="btn-primary" onClick={openAdd} id="btn-tambah-masuk" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Input Alat
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={barangMasuk}
        searchPlaceholder="Cari kode, nama, atau jenis layanan..."
        emptyIcon={<Package size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada alat masuk"
      />

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingItem ? <Edit size={20} /> : <Package size={20} />}
            {editingItem ? 'Edit Alat Masuk' : 'Tambah Alat Masuk'}
          </div>
        }
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Batal
            </button>
            <button className="btn-primary" onClick={handleSubmit} id="btn-simpan-masuk" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Kode Alat *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: KB-2026-013"
            value={formData.kodeBarang}
            onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nama Alat *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: Caliper Digital Mitutoyo"
            value={formData.namaBarang}
            onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Jenis Layanan *</label>
          <select
            className="form-select"
            value={formData.jenisLayanan}
            onChange={(e) => setFormData({ ...formData, jenisLayanan: e.target.value })}
          >
            <option value="">— Pilih Jenis Layanan —</option>
            {JENIS_LAYANAN.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {!editingItem && (
          <div className="form-group">
            <label className="form-label">Dokumen Pendukung (Maks. 2MB)</label>
            <div
              className="file-upload-zone"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="file-upload-icon"><CloudUpload size={32} /></div>
              <div className="file-upload-text">
                <strong>Klik untuk pilih file</strong> atau seret ke sini
              </div>
              <div className="file-upload-hint">PDF, JPG, PNG — Maksimal 2MB</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {fileError && <div className="form-error">{fileError}</div>}
            {file && (
              <div className="file-upload-preview">
                <span className="file-upload-preview-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Paperclip size={14} /> {file.name}
                </span>
                <button className="file-upload-remove" onClick={() => setFile(null)}>✕</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Alat?"
        message="Data alat ini akan dihapus dari Alat Masuk dan Alat Keluar. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
