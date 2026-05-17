import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import DataTable from '../components/ui/DataTable';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { Package, Download, Plus, Edit, Trash2, Paperclip, Save, Eye, Filter, CloudUpload } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { resolveRole } from '../utils/roles';
import './PageStyles.css';

const SERVICE_FILTER_OPTIONS = [
  'Semua Layanan',
  'Kalibrasi Massa dan Timbangan',
  'Kalibrasi Dimensi',
  'Kalibrasi Tekanan',
  'Kalibrasi Gaya',
  'Kalibrasi Kelistrikan',
  'Kalibrasi Suhu',
  'Kalibrasi Instrumen Analitik',
  'Kalibrasi Volumetrik',
];

const SERVICE_FORM_OPTIONS = SERVICE_FILTER_OPTIONS.filter((service) => service !== 'Semua Layanan');

export default function AlatMasukPage() {
  const { user } = useAuth();
  const { alatMasuk, deleteAlatMasuk, fetchData } = useData();
  const { addNotification } = useNotification();

  const roleName = resolveRole(user?.role, user?.email);
  const canManage = roleName === 'adminutama' || roleName === 'admin' || roleName === 'supervisor' || roleName === 'direktur';

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('Semua Layanan');
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  const [formData, setFormData] = useState({
    noOrder: '',
    namaAlat: '',
    spesifikasi: '',
    jumlah: '',
    lab: '',
    pesananKhusus: '',
    kurangKelengkapan: '',
    jenisLayanan: '',
  });

  const serviceFilterRef = useRef(null);
  const fileInputRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const audioPrimedRef = useRef(false);
  const audioPrimePromiseRef = useRef(null);
  const [file, setFile] = useState(null);
  const [existingDocumentName, setExistingDocumentName] = useState('');
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState({
    isOpen: false,
    noOrder: '',
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceFilterRef.current && !serviceFilterRef.current.contains(event.target)) {
        setShowServiceFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const audio = new Audio('/notifku.wav');
    audio.preload = 'auto';
    notificationAudioRef.current = audio;
    audioPrimedRef.current = false;
    audioPrimePromiseRef.current = null;

    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current = null;
      }
      audioPrimedRef.current = false;
      audioPrimePromiseRef.current = null;
    };
  }, []);

  const primeNotificationSound = useCallback(() => {
    if (audioPrimedRef.current) return Promise.resolve();
    if (audioPrimePromiseRef.current) return audioPrimePromiseRef.current;

    const audio = notificationAudioRef.current;
    if (!audio) return Promise.resolve();

    const previousMuted = audio.muted;
    audio.muted = true;

    const unlockPromise = audio.play();
    if (!unlockPromise || typeof unlockPromise.then !== 'function') {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = previousMuted;
      audioPrimedRef.current = true;
      return Promise.resolve();
    }

    audioPrimePromiseRef.current = unlockPromise
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = previousMuted;
        audioPrimedRef.current = true;
      })
      .catch(() => {
        audio.muted = previousMuted;
      })
      .finally(() => {
        audioPrimePromiseRef.current = null;
      });

    return audioPrimePromiseRef.current;
  }, []);

  const playNotificationSound = useCallback(() => {
    const audio = notificationAudioRef.current || new Audio('/notifku.wav');
    audio.muted = false;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error('Gagal memainkan notifikasi .wav, mencoba fallback .mp3', err);
      const fallback = new Audio('/notifku.mp3');
      fallback.currentTime = 0;
      fallback.play().catch((fallbackErr) => {
        console.error('Fallback audio notifikasi juga gagal', fallbackErr);
      });
    });
  }, []);

  const filteredAlatMasuk = useMemo(() => {
    const filtered =
      selectedServiceFilter === 'Semua Layanan'
        ? [...alatMasuk]
        : alatMasuk.filter((item) => item.jenisLayanan === selectedServiceFilter);

    filtered.sort((a, b) => {
      const leftTime = new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
      if (leftTime !== 0) return leftTime;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });

    return filtered;
  }, [alatMasuk, selectedServiceFilter]);

  const resetForm = () => {
    setFormData({
      noOrder: '',
      namaAlat: '',
      spesifikasi: '',
      jumlah: '',
      lab: '',
      pesananKhusus: '',
      kurangKelengkapan: '',
      jenisLayanan: '',
    });
    setFile(null);
    setExistingDocumentName('');
    setFileError('');
    setEditingItem(null);
    setDuplicateWarning({
      isOpen: false,
      noOrder: '',
    });
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      noOrder: item.noOrder || item.no_order || item.kodeAlat || '',
      namaAlat: item.namaAlat || '',
      spesifikasi: item.spesifikasi || '',
      jumlah: item.jumlah ?? '',
      lab: item.lab || '',
      pesananKhusus: item.pesananKhusus || '',
      kurangKelengkapan: item.kurangKelengkapan || '',
      jenisLayanan: item.jenisLayanan || '',
    });
    setFile(null);
    setExistingDocumentName(item.dokumen || item.dokumenNama || '');
    setFileError('');
    setShowModal(true);
  };

  const handleEditClick = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    openEdit(item);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file melebihi 2MB!');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(selectedFile);
    setExistingDocumentName('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (droppedFile.size > 2 * 1024 * 1024) {
      setFileError('Ukuran file melebihi 2MB!');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(droppedFile);
    setExistingDocumentName('');
  };

  const resolveAlatTable = useCallback(async () => {
    const candidates = ['alat_kalibrasi', 'alat_masuk'];
    let lastError = null;

    for (const table of candidates) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) return table;
      lastError = error;
    }

    throw lastError || new Error('Tabel data alat tidak ditemukan di Supabase.');
  }, []);

  const buildStoragePath = useCallback(
    (sourceFile) => {
      const now = new Date();
      const safeOrder = String(formData.noOrder || 'tanpa-order')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeName = String(sourceFile?.name || 'dokumen')
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(
        now.getHours()
      ).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      return `${safeOrder}/${timestamp}-${randomSuffix}-${safeName}`;
    },
    [formData.noOrder]
  );

  const uploadDokumenIfAny = useCallback(
    async (selectedFile) => {
      if (!selectedFile) return null;

      const storagePath = buildStoragePath(selectedFile);
      const { error: uploadError } = await supabase.storage.from('dokumen_alat').upload(storagePath, selectedFile, {
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('dokumen_alat').getPublicUrl(storagePath);
      return publicData?.publicUrl || null;
    },
    [buildStoragePath]
  );

  const executeSubmit = async () => {
    const tanggalMasuk = editingItem?.tanggalMasuk || new Date().toISOString().split('T')[0];
    const jumlahValue = formData.jumlah === '' ? null : Number(formData.jumlah);

    setIsSubmitting(true);
    try {
      const alatTable = await resolveAlatTable();
      const uploadedDokumenUrl = await uploadDokumenIfAny(file);
      const dokumenValue = uploadedDokumenUrl || existingDocumentName || null;

      if (editingItem) {
        const updatePayload = {
          no_order: formData.noOrder,
          nama_alat: formData.namaAlat,
          spesifikasi: formData.spesifikasi || null,
          jumlah: jumlahValue,
          lab: formData.lab || null,
          pesanan_khusus: formData.pesananKhusus || null,
          kurang_kelengkapan: formData.kurangKelengkapan || null,
          jenis_layanan: formData.jenisLayanan,
          dokumen: dokumenValue,
        };

        const { error } = await supabase
          .from(alatTable)
          .update(updatePayload)
          .eq('id', editingItem.id);
        if (error) throw error;
        if (fetchData) await fetchData();
      } else {
        const insertPayload = {
          no_order: formData.noOrder,
          nama_alat: formData.namaAlat,
          spesifikasi: formData.spesifikasi || null,
          jumlah: jumlahValue,
          lab: formData.lab || null,
          pesanan_khusus: formData.pesananKhusus || null,
          kurang_kelengkapan: formData.kurangKelengkapan || null,
          jenis_layanan: formData.jenisLayanan,
          tanggal_masuk: tanggalMasuk,
          dokumen: dokumenValue,
        };

        const { error } = await supabase.from(alatTable).insert(insertPayload);
        if (error) throw error;
        if (fetchData) await fetchData();
        playNotificationSound();

        const jumlahNotifikasi = jumlahValue ?? 1;

        addNotification(
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} /> {jumlahNotifikasi} alat baru masuk: {formData.namaAlat} - {formData.jenisLayanan}
          </div>
        );

        try {
          await supabase.channel('global-notif').send({
            type: 'broadcast',
            event: 'alat_masuk',
            payload: {
              senderId: user?.id,
              noOrder: formData.noOrder,
              namaAlat: formData.namaAlat,
              spesifikasi: formData.spesifikasi,
              jumlah: jumlahValue,
              lab: formData.lab,
              pesananKhusus: formData.pesananKhusus,
              kurangKelengkapan: formData.kurangKelengkapan,
              dokumen: dokumenValue,
              dokumenNama: file?.name || null,
              jenisLayanan: formData.jenisLayanan,
              tanggalMasuk,
            },
          });
        } catch {
          // Silent fail: UI lokal tetap jalan walau realtime gagal
        }
      }
    } catch (error) {
      console.error('Supabase Error:', error);
      alert(error?.message || 'Terjadi kesalahan saat menyimpan data.');
      return;
    } finally {
      setIsSubmitting(false);
    }

    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (forceDuplicate = false) => {
    await primeNotificationSound();

    if (isSubmitting) return;
    if (!formData.noOrder || !formData.namaAlat || !formData.jenisLayanan) return;

    const normalizedNoOrder = String(formData.noOrder || '').trim().toLowerCase();
    const isDuplicateNoOrder = alatMasuk.some((item) => {
      const itemNoOrder = String(item.noOrder || item.no_order || '').trim().toLowerCase();
      if (itemNoOrder !== normalizedNoOrder) return false;
      if (editingItem && Number(item.id) === Number(editingItem.id)) return false;
      return true;
    });

    if (isDuplicateNoOrder && !forceDuplicate) {
      setDuplicateWarning({
        isOpen: true,
        noOrder: formData.noOrder,
      });
      return;
    }

    await executeSubmit();
  };

  const handleDuplicateContinue = async () => {
    setDuplicateWarning({
      isOpen: false,
      noOrder: '',
    });
    await handleSubmit(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAlatMasuk(deleteId);
      setDeleteId(null);
    }
  };

  const exportCSV = () => {
    const delimiter = ';';
    const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['No', 'No. Order', 'Nama Alat', 'Spesifikasi', 'Jenis Layanan', 'Jumlah', 'Lab', 'Pesanan Khusus', 'Kurang Kelengkapan', 'Tanggal Masuk', 'Dokumen'];
    const rows = filteredAlatMasuk.map((item, idx) => [
      idx + 1,
      item.noOrder || item.no_order || '-',
      item.namaAlat,
      item.spesifikasi || '-',
      item.jenisLayanan,
      item.jumlah || '-',
      item.lab || '-',
      item.pesananKhusus || '-',
      item.kurangKelengkapan || '-',
      item.tanggalMasuk,
      item.dokumen || item.dokumenNama || '-',
    ]);
    const csv = `\uFEFFsep=${delimiter}\r\n${[headers, ...rows]
      .map((row) => row.map(escapeCSV).join(delimiter))
      .join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alat_masuk_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'noOrder',
      header: 'No. Order',
      accessor: 'noOrder',
      width: '160px',
      render: (row) => row.no_order || row.noOrder || '-',
    },
    { key: 'namaAlat', header: 'Nama Alat', accessor: 'namaAlat', width: '200px' },
    {
      key: 'spesifikasi',
      header: 'Spesifikasi',
      width: '180px',
      render: (row) => row.spesifikasi || row.Spesifikasi || '-',
    },
    {
      key: 'jenisLayanan',
      header: (
        <div className="service-filter-header" ref={serviceFilterRef}>
          <span>Jenis Layanan</span>
          <button
            type="button"
            className={`service-filter-trigger ${selectedServiceFilter !== 'Semua Layanan' ? 'active' : ''}`}
            onClick={() => setShowServiceFilter((prev) => !prev)}
            title="Filter jenis layanan"
          >
            <Filter size={13} />
          </button>
          {showServiceFilter && (
            <div className="service-filter-dropdown">
              {SERVICE_FILTER_OPTIONS.map((service) => (
                <button
                  key={service}
                  type="button"
                  className={`service-filter-option ${selectedServiceFilter === service ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedServiceFilter(service);
                    setShowServiceFilter(false);
                  }}
                >
                  {service}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
      accessor: 'jenisLayanan',
      width: '230px',
      render: (row) => <span className="badge info">{row.jenisLayanan || '-'}</span>,
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      width: '110px',
      render: (row) => row.jumlah ?? row.Jumlah ?? '-',
    },
    {
      key: 'lab',
      header: 'Lab',
      width: '120px',
      render: (row) => row.lab || row.Lab || '-',
    },
    {
      key: 'pesananKhusus',
      header: 'Pesanan Khusus',
      width: '160px',
      render: (row) => row.pesanan_khusus || row.pesananKhusus || '-',
    },
    {
      key: 'kurangKelengkapan',
      header: 'Kurang Kelengkapan',
      width: '180px',
      render: (row) => row.kurangKelengkapan || row.kurang_kelengkapan || '-',
    },
    { key: 'tanggalMasuk', header: 'Tanggal Masuk', accessor: 'tanggalMasuk', width: '140px' },
    {
      key: 'dokumen',
      header: 'Dokumen',
      width: '180px',
      render: (row) => {
        const doc = row.dokumen || row.dokumenNama;
        const isUrl = /^https?:\/\//i.test(String(doc || ''));
        let docLabel = doc;
        if (isUrl) {
          try {
            docLabel = decodeURIComponent(String(doc).split('/').pop()?.split('?')[0] || 'Lihat Dokumen');
          } catch {
            docLabel = 'Lihat Dokumen';
          }
        }
        return doc ? (
          isUrl ? (
          <a
            href={doc}
            target="_blank"
            rel="noreferrer"
            className="file-link truncate max-w-[150px] inline-block"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Paperclip size={14} /> {docLabel}
          </a>
          ) : (
            <span className="file-link truncate max-w-[150px] inline-block" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Paperclip size={14} /> {docLabel}
            </span>
          )
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: '110px',
      render: (row) =>
        canManage ? (
          <div className="table-actions">
            <button type="button" className="table-action-btn edit" title="Edit" onClick={(event) => handleEditClick(event, row)}>
              <Edit size={16} />
            </button>
            <button type="button" className="table-action-btn delete" title="Hapus" onClick={() => setDeleteId(row.id)}>
              <Trash2 size={16} />
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
          <Package size={28} color="var(--color-primary)" /> Alat Masuk
        </h1>
        <div className="page-header-actions">
          {!canManage && (
            <span className="badge info" style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={14} /> Mode Lihat Saja
            </span>
          )}
          {canManage && (
            <>
              <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Ekspor CSV
              </button>
              <button className="btn-primary" onClick={openAdd} id="btn-tambah-masuk" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Input Alat
              </button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAlatMasuk}
        searchPlaceholder="Cari no. order, nama alat, atau jenis layanan..."
        tableScrollClassName="alat-masuk-table-scroll"
        emptyIcon={<Package size={32} color="var(--color-text-muted)" />}
        emptyText="Belum ada alat masuk"
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingItem ? <Edit size={20} /> : <Package size={20} />}
            {editingItem ? 'Edit Alat Masuk' : 'Tambah Alat Masuk'}
          </div>
        }
        footer={
          <>
            <button
              className="btn-secondary"
              disabled={isSubmitting}
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Batal
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                void handleSubmit();
              }}
              id="btn-simpan-masuk"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} /> {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto overflow-x-hidden p-1 alat-masuk-form-grid">
          <div className="form-group">
            <label className="form-label">No. Order *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: ORD-2026-013"
              value={formData.noOrder}
              onChange={(e) => setFormData({ ...formData, noOrder: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Alat *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: Caliper Digital Mitutoyo"
              value={formData.namaAlat}
              onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Spesifikasi</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: 0-150mm, resolusi 0.01mm"
              value={formData.spesifikasi}
              onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Jumlah</label>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="Contoh: 5"
              value={formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lab</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: Lab Massa"
              value={formData.lab}
              onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Jenis Layanan *</label>
            <select
              className="form-select"
              value={formData.jenisLayanan}
              onChange={(e) => setFormData({ ...formData, jenisLayanan: e.target.value })}
            >
              <option value="">- Pilih Jenis Layanan -</option>
              {SERVICE_FORM_OPTIONS.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group md:col-span-2 col-span-2">
            <label className="form-label">Pesanan Khusus</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Tulis catatan pesanan khusus..."
              value={formData.pesananKhusus}
              onChange={(e) => setFormData({ ...formData, pesananKhusus: e.target.value })}
            />
          </div>

          <div className="form-group md:col-span-2 col-span-2">
            <label className="form-label">Kurang Kelengkapan</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Tulis catatan kekurangan kelengkapan..."
              value={formData.kurangKelengkapan}
              onChange={(e) => setFormData({ ...formData, kurangKelengkapan: e.target.value })}
            />
          </div>

          <div className="form-group md:col-span-2 col-span-2">
            <label className="form-label">Dokumen Pendukung (Maks. 2MB)</label>
            <div
              className="file-upload-zone"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('dragover');
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="file-upload-icon">
                <CloudUpload size={32} />
              </div>
              <div className="file-upload-text">
                <strong>Klik untuk pilih file</strong> atau seret ke sini
              </div>
              <div className="file-upload-hint">PDF, JPG, PNG - Maksimal 2MB</div>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
            {fileError && <div className="form-error">{fileError}</div>}
            {(file || existingDocumentName) && (
              <div className="file-upload-preview">
                <span className="file-upload-preview-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Paperclip size={14} /> {file?.name || existingDocumentName}
                </span>
                <button
                  type="button"
                  className="file-upload-remove"
                  onClick={() => {
                    setFile(null);
                    setExistingDocumentName('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  x
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={duplicateWarning.isOpen}
        onClose={() =>
          setDuplicateWarning({
            isOpen: false,
            noOrder: '',
          })
        }
        onConfirm={() => {
          void handleDuplicateContinue();
        }}
        title="Peringatan Duplikat"
        message={`No. Order ${duplicateWarning.noOrder || formData.noOrder} sudah ada di database. Apakah Anda ingin tetap melanjutkannya?`}
        confirmText="Lanjutkan"
        cancelText="Batal"
        variant="info"
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Alat?"
        message="Data alat ini akan dihapus dari Alat Masuk dan Status Alat. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
