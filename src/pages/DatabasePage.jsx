import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import DataTable from '../components/ui/DataTable';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { Database, Plus, Edit, Trash2, Save, Eye } from 'lucide-react';
import { JENIS_LAYANAN } from '../data/mockData';
import './PageStyles.css';

export default function DatabasePage() {
  const { user } = useAuth();
  const { databaseKalibrasi, addDatabase, editDatabase, deleteDatabase } = useData();
  const isAdmin = user?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    kodeAlat: '',
    namaAlat: '',
    kategori: '',
  });

  const resetForm = () => {
    setFormData({ kodeAlat: '', namaAlat: '', kategori: '' });
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      kategori: item.kategori,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.kodeAlat || !formData.namaAlat || !formData.kategori) return;

    if (editingItem) {
      editDatabase({ id: editingItem.id, ...formData });
    } else {
      addDatabase(formData);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteDatabase(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    { header: 'Kode Alat', accessor: 'kodeAlat' },
    { header: 'Nama Alat', accessor: 'namaAlat' },
    {
      header: 'Kategori',
      accessor: 'kategori',
      render: (row) => <span className="badge info">{row.kategori}</span>,
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
          <Database size={28} color="var(--color-primary)" /> Summary Kalibrasi
        </h1>
        <div className="page-header-actions">
          {!isAdmin && (
            <span className="badge info" style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={14} /> Mode Lihat Saja
            </span>
          )}
          {isAdmin && (
            <button className="btn-primary" onClick={openAdd} id="btn-tambah-db" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Tambah Alat
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={databaseKalibrasi}
        searchPlaceholder="Cari kode alat, nama, atau kategori..."
        emptyIcon={<Database size={32} color="var(--color-text-muted)" />}
        emptyText="Database kalibrasi kosong"
      />

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingItem ? <Edit size={20} /> : <Database size={20} />}
            {editingItem ? 'Edit Data Alat' : 'Tambah Alat Baru'}
          </div>
        }
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Batal
            </button>
            <button className="btn-primary" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            placeholder="Contoh: ALT-011"
            value={formData.kodeAlat}
            onChange={(e) => setFormData({ ...formData, kodeAlat: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nama Alat *</label>
          <input
            className="form-input"
            type="text"
            placeholder="Contoh: Torque Wrench"
            value={formData.namaAlat}
            onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kategori *</label>
          <select
            className="form-select"
            value={formData.kategori}
            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
          >
            <option value="">— Pilih Kategori —</option>
            {JENIS_LAYANAN.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Alat?"
        message="Data alat ini akan dihapus dari database kalibrasi. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
