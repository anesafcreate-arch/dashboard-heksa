import { useState } from 'react';
import { CalendarClock, Edit, Plus, Save, Trash2, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import DataTable from './DataTable';
import Modal, { ConfirmDialog } from './Modal';
import './JadwalOnsiteTable.css';

const WRITE_ROLES = ['direktur', 'manager_dian', 'manager_fida', 'manager_uko'];

const INITIAL_FORM = {
  namaTeknisi: '',
  tujuanKota: '',
  jumlahHari: '',
  jumlahAlat: '',
};

export default function JadwalOnsiteTable() {
  const { user } = useAuth();
  const { jadwalOnsite, addJadwalOnsite, editJadwalOnsite, deleteJadwalOnsite } = useData();
  const canWrite = WRITE_ROLES.includes(user?.role);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      namaTeknisi: item.namaTeknisi,
      tujuanKota: item.tujuanKota,
      jumlahHari: String(item.jumlahHari),
      jumlahAlat: String(item.jumlahAlat),
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!canWrite) return;
    if (!formData.namaTeknisi || !formData.tujuanKota || !formData.jumlahHari || !formData.jumlahAlat) {
      return;
    }

    const payload = {
      namaTeknisi: formData.namaTeknisi.trim(),
      tujuanKota: formData.tujuanKota.trim(),
      jumlahHari: Number(formData.jumlahHari),
      jumlahAlat: Number(formData.jumlahAlat),
    };

    if (editingItem) {
      editJadwalOnsite({ id: editingItem.id, ...payload });
    } else {
      addJadwalOnsite(payload);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (canWrite && deleteId) {
      deleteJadwalOnsite(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    { header: 'Nama Teknisi', accessor: 'namaTeknisi' },
    { header: 'Tujuan Kota', accessor: 'tujuanKota' },
    {
      header: 'Jumlah Hari',
      accessor: 'jumlahHari',
      render: (row) => <span>{row.jumlahHari} hari</span>,
    },
    {
      header: 'Jumlah Alat',
      accessor: 'jumlahAlat',
      render: (row) => <span>{row.jumlahAlat} alat</span>,
    },
    ...(canWrite
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
  ];

  return (
    <div className="onsite-card">
      <div className="onsite-card-header">
        <h2>
          <CalendarClock size={20} />
          Jadwal Onsite
        </h2>
        {!canWrite && <span className="onsite-readonly-badge">Read-only</span>}
      </div>

      <DataTable
        columns={columns}
        data={jadwalOnsite}
        searchPlaceholder="Cari teknisi atau kota tujuan..."
        emptyIcon={<Wrench size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada jadwal onsite"
        toolbarActions={
          canWrite ? (
            <button className="btn-primary onsite-add-btn" onClick={openAdd}>
              <Plus size={16} />
              Tambah Jadwal
            </button>
          ) : null
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={
          <div className="onsite-modal-title">
            {editingItem ? <Edit size={18} /> : <CalendarClock size={18} />}
            {editingItem ? 'Edit Jadwal Onsite' : 'Tambah Jadwal Onsite'}
          </div>
        }
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Batal
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              <Save size={16} /> Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nama Teknisi *</label>
          <input
            className="form-input"
            type="text"
            value={formData.namaTeknisi}
            onChange={(e) => setFormData({ ...formData, namaTeknisi: e.target.value })}
            placeholder="Contoh: Budi Santoso"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tujuan Kota *</label>
          <input
            className="form-input"
            type="text"
            value={formData.tujuanKota}
            onChange={(e) => setFormData({ ...formData, tujuanKota: e.target.value })}
            placeholder="Contoh: Jakarta"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Jumlah Hari *</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={formData.jumlahHari}
            onChange={(e) => setFormData({ ...formData, jumlahHari: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Jumlah Alat *</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={formData.jumlahAlat}
            onChange={(e) => setFormData({ ...formData, jumlahAlat: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Jadwal Onsite?"
        message="Jadwal onsite ini akan dihapus permanen."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
