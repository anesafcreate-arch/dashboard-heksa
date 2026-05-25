import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const STORAGE_BUCKET = 'dokumen-alat';
const ONSITE_INLAB_OPTIONS = ['Onsite', 'Inlab'];

const deriveFileNameFromUrl = (urlValue) => {
  if (!urlValue) return '';
  try {
    return decodeURIComponent(String(urlValue).split('/').pop()?.split('?')[0] || '');
  } catch {
    return '';
  }
};

const decodePathSafe = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractStoragePathFromDokumen = (dokumenValue, bucketName) => {
  const raw = String(dokumenValue || '').trim();
  if (!raw) return '';

  if (!/^https?:\/\//i.test(raw)) {
    const normalizedRaw = raw.replace(/^\/+/, '');
    if (!normalizedRaw) return '';

    const withBucketPrefix = `${bucketName}/`;
    if (normalizedRaw.startsWith(withBucketPrefix)) {
      return decodePathSafe(normalizedRaw.slice(withBucketPrefix.length));
    }
    return decodePathSafe(normalizedRaw);
  }

  try {
    const url = new URL(raw);
    const normalizedPathname = decodePathSafe(url.pathname || '');
    const match = normalizedPathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/i);
    if (!match) return '';

    const bucketFromUrl = decodePathSafe(match[1] || '');
    if (bucketFromUrl !== bucketName) return '';

    return decodePathSafe(match[2] || '').replace(/^\/+/, '');
  } catch {
    return '';
  }
};

const getMissingColumn = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`;
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
    /column\s+([\w.]+)\s+does not exist/i,
    /column '([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const preparePayloadForMissingColumn = (payload, missingColumn) => {
  if (!missingColumn) return null;
  const normalizedMissingColumn = String(missingColumn).split('.').pop();

  if (Object.prototype.hasOwnProperty.call(payload, normalizedMissingColumn)) {
    const next = { ...payload };
    delete next[normalizedMissingColumn];
    return next;
  }

  if (Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
    const next = { ...payload };
    delete next[missingColumn];
    return next;
  }

  return null;
};

const runMutationWithColumnFallback = async (mutationFactory, initialPayload, maxAttempts = 12) => {
  let payload = { ...initialPayload };
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await mutationFactory(payload);
    if (!result.error) return result;

    lastError = result.error;

    const missingColumn = getMissingColumn(result.error);
    const nextPayload = preparePayloadForMissingColumn(payload, missingColumn);
    if (!nextPayload || JSON.stringify(nextPayload) === JSON.stringify(payload)) break;
    payload = nextPayload;
  }

  return { data: null, error: lastError };
};

export default function AlatMasukPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    noSertifikat: '',
    namaAlat: '',
    spesifikasi: '',
    jumlah: '',
    onsiteInlab: '',
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
  const [existingDocumentUrl, setExistingDocumentUrl] = useState('');
  const [existingDocumentName, setExistingDocumentName] = useState('');
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
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
      noSertifikat: '',
      namaAlat: '',
      spesifikasi: '',
      jumlah: '',
      onsiteInlab: '',
      lab: '',
      pesananKhusus: '',
      kurangKelengkapan: '',
      jenisLayanan: '',
    });
    setFile(null);
    setExistingDocumentUrl('');
    setExistingDocumentName('');
    setFileError('');
    setSubmitError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditingItem(null);
    setDuplicateWarning({
      isOpen: false,
      noOrder: '',
    });
  };

  const openAdd = () => {
    resetForm();
    setSubmitError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    const currentDokumenUrl = item.dokumen || '';
    const currentDokumenName = item.dokumenNama || deriveFileNameFromUrl(currentDokumenUrl);

    setEditingItem(item);
    setFormData({
      noOrder: item.noOrder || item.no_order || item.kodeAlat || '',
      noSertifikat: item.noSertifikat || item.no_sertifikat || '',
      namaAlat: item.namaAlat || '',
      spesifikasi: item.spesifikasi || '',
      jumlah: item.jumlah ?? '',
      onsiteInlab: item.onsiteInlab || item.onsite_inlab || '',
      lab: item.lab || '',
      pesananKhusus: item.pesananKhusus || '',
      kurangKelengkapan: item.kurangKelengkapan || '',
      jenisLayanan: item.jenisLayanan || '',
    });
    setFile(null);
    setExistingDocumentUrl(currentDokumenUrl);
    setExistingDocumentName(currentDokumenName);
    setFileError('');
    setSubmitError('');
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setFileError('');
    setFile(selectedFile);
    setExistingDocumentUrl('');
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setFileError('');
    setFile(droppedFile);
    setExistingDocumentUrl('');
    setExistingDocumentName('');
  };

  const resolveAlatTable = useCallback(async () => {
    const table = 'alat_masuk';
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) throw error;
    return table;
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

  const resolveDokumenUrl = useCallback((rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalizedPath = raw.replace(/^\/+/, '');
    if (!normalizedPath) return '';
    if (/^(dashboard|alat-masuk|status-alat|summary-kalibrasi|jadwal-onsite)(\/|$)/i.test(normalizedPath)) {
      return '';
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
    return data?.publicUrl || '';
  }, []);

  const uploadDokumenIfAny = useCallback(
    async (selectedFile) => {
      if (!selectedFile) return { publicUrl: null, fileName: null };

      const storagePath = buildStoragePath(selectedFile);
      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, selectedFile, {
        upsert: false,
      });
      if (uploadError) {
        const rawMessage = `${uploadError?.message || ''} ${uploadError?.error || ''}`.toLowerCase();
        if (rawMessage.includes('bucket') && rawMessage.includes('not found')) {
          throw new Error('Bucket dokumen-alat belum dibuat di Supabase Storage');
        }
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
      return {
        publicUrl: publicData?.publicUrl || null,
        fileName: selectedFile.name,
      };
    },
    [buildStoragePath]
  );

  const executeSubmit = async (authUserId) => {
    if (!authUserId) {
      throw new Error('Session login tidak valid. Silakan login ulang lalu coba simpan lagi.');
    }

    const tanggalMasuk = editingItem?.tanggalMasuk || new Date().toISOString().split('T')[0];
    const jumlahValue = formData.jumlah === '' ? null : Number.parseInt(formData.jumlah, 10);
    const normalizedNoOrder = String(formData.noOrder || '').trim();
    const normalizedNoSertifikat = String(formData.noSertifikat || '').trim();
    const normalizedNamaAlat = String(formData.namaAlat || '').trim();

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const alatTable = await resolveAlatTable();
      const uploadResult = await uploadDokumenIfAny(file);
      const uploadedDokumenUrl = uploadResult?.publicUrl || null;
      const uploadedDokumenName = uploadResult?.fileName || null;
      const uploadedDokumenPath = extractStoragePathFromDokumen(uploadedDokumenUrl, STORAGE_BUCKET);
      const oldDokumenPath = extractStoragePathFromDokumen(editingItem?.dokumen || '', STORAGE_BUCKET);
      const normalizedExistingDokumenUrl = resolveDokumenUrl(existingDocumentUrl);
      const dokumenValue = uploadedDokumenUrl || normalizedExistingDokumenUrl || null;
      const dokumenNamaValue = uploadedDokumenName || existingDocumentName || null;

      if (editingItem) {
        const updatePayload = {
          no_order: normalizedNoOrder,
          no_sertifikat: normalizedNoSertifikat || null,
          nama_alat: normalizedNamaAlat,
          spesifikasi: formData.spesifikasi || null,
          jumlah: jumlahValue,
          onsite_inlab: formData.onsiteInlab || null,
          lab: formData.lab || null,
          pesanan_khusus: formData.pesananKhusus || null,
          kurang_kelengkapan: formData.kurangKelengkapan || null,
          jenis_layanan: formData.jenisLayanan,
          created_by: authUserId,
          dokumen: dokumenValue,
          dokumen_nama: dokumenNamaValue,
        };

        const { error } = await runMutationWithColumnFallback(
          (payload) => supabase.from(alatTable).update(payload).eq('id', editingItem.id),
          updatePayload
        );
        if (error) throw error;

        if (uploadedDokumenUrl && oldDokumenPath && oldDokumenPath !== uploadedDokumenPath) {
          const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([oldDokumenPath]);
          if (removeError) {
            const removeMessage = `${removeError?.message || ''} ${removeError?.error || ''}`.toLowerCase();
            const isNotFound =
              removeMessage.includes('not found') ||
              removeMessage.includes('does not exist') ||
              removeMessage.includes('no such file');

            if (!isNotFound) {
              console.warn('[AlatMasuk] Gagal menghapus dokumen lama:', removeError);
            }
          }
        }

        if (fetchData) await fetchData();
      } else {
        const insertPayload = {
          no_order: normalizedNoOrder,
          no_sertifikat: normalizedNoSertifikat || null,
          nama_alat: normalizedNamaAlat,
          spesifikasi: formData.spesifikasi || null,
          jumlah: jumlahValue,
          onsite_inlab: formData.onsiteInlab || null,
          lab: formData.lab || null,
          pesanan_khusus: formData.pesananKhusus || null,
          kurang_kelengkapan: formData.kurangKelengkapan || null,
          jenis_layanan: formData.jenisLayanan,
          tanggal_masuk: tanggalMasuk,
          created_by: authUserId,
          dokumen: dokumenValue,
          dokumen_nama: dokumenNamaValue,
        };
        console.log('[AlatMasuk] user.id sebelum insert:', authUserId);
        console.log('[AlatMasuk] payload insert created_by:', insertPayload.created_by);

        const { error } = await runMutationWithColumnFallback(
          (payload) => supabase.from(alatTable).insert(payload),
          insertPayload
        );
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
              senderId: authUserId,
              noOrder: formData.noOrder,
              noSertifikat: formData.noSertifikat,
              namaAlat: formData.namaAlat,
              spesifikasi: formData.spesifikasi,
              jumlah: jumlahValue,
              onsiteInlab: formData.onsiteInlab,
              lab: formData.lab,
              pesananKhusus: formData.pesananKhusus,
              kurangKelengkapan: formData.kurangKelengkapan,
              dokumen: dokumenValue,
              dokumenNama: dokumenNamaValue,
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
      const message = error?.message || 'Terjadi kesalahan saat menyimpan data.';
      if (message.toLowerCase().includes('bucket dokumen-alat belum dibuat')) {
        addNotification('Bucket dokumen-alat belum dibuat di Supabase Storage');
      }
      if (message.toLowerCase().includes('row-level security')) {
        setSubmitError('Akses ditolak oleh RLS tabel alat_masuk. Jalankan migration policy terbaru lalu login ulang.');
        return;
      }
      setSubmitError(message);
      return;
    } finally {
      setIsSubmitting(false);
    }

    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (forceDuplicate = false) => {
    if (isSubmitting) return;
    setSubmitError('');
    console.log('[AlatMasuk] user.id (context) sebelum insert:', user?.id ?? null);

    if (!user?.id) {
      setSubmitError('Session login tidak ditemukan. Anda akan diarahkan ke halaman login.');
      navigate('/login', { replace: true });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      setSubmitError(authError.message || 'Session login tidak valid. Silakan login ulang.');
      navigate('/login', { replace: true });
      return;
    }

    const authUserId = authData?.user?.id || null;
    console.log('[AlatMasuk] user.id (supabase) sebelum insert:', authUserId);
    if (!authUserId) {
      setSubmitError('Session login tidak valid. Silakan login ulang lalu coba simpan lagi.');
      navigate('/login', { replace: true });
      return;
    }

    if (!formData.noOrder?.trim() || !formData.namaAlat?.trim() || !formData.jenisLayanan || !formData.onsiteInlab) {
      setSubmitError('No. Order, Nama Alat, Jenis Layanan, dan Onsite/Inlab wajib diisi.');
      return;
    }

    if (formData.jumlah !== '') {
      const jumlahNumber = Number(formData.jumlah);
      if (!Number.isInteger(jumlahNumber) || jumlahNumber < 0) {
        setSubmitError('Jumlah harus berupa bilangan bulat 0 atau lebih.');
        return;
      }
    }

    await primeNotificationSound();

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

    await executeSubmit(authUserId);
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
    const headers = ['No', 'No. Order', 'No. Sertifikat', 'Nama Alat', 'Spesifikasi', 'Jenis Layanan', 'Onsite/Inlab', 'Jumlah', 'Lab', 'Pesanan Khusus', 'Kurang Kelengkapan', 'Tanggal Masuk', 'Dokumen URL'];
    const rows = filteredAlatMasuk.map((item, idx) => [
      idx + 1,
      item.noOrder || item.no_order || '-',
      item.noSertifikat || item.no_sertifikat || '-',
      item.namaAlat,
      item.spesifikasi || '-',
      item.jenisLayanan,
      item.onsiteInlab || item.onsite_inlab || '-',
      item.jumlah ?? '-',
      item.lab || '-',
      item.pesananKhusus || '-',
      item.kurangKelengkapan || '-',
      item.tanggalMasuk,
      resolveDokumenUrl(item.dokumen) || '-',
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
    {
      key: 'noSertifikat',
      header: 'No. Sertifikat',
      accessor: 'noSertifikat',
      width: '170px',
      render: (row) => row.no_sertifikat || row.noSertifikat || '-',
    },
    { key: 'namaAlat', header: 'Nama Alat', accessor: 'namaAlat', width: '200px' },
    {
      key: 'spesifikasi',
      header: 'Spesifikasi',
      accessor: 'spesifikasi',
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
      key: 'onsiteInlab',
      header: 'Onsite/Inlab',
      accessor: 'onsiteInlab',
      width: '120px',
      render: (row) => row.onsiteInlab || row.onsite_inlab || '-',
    },
    {
      key: 'lab',
      header: 'Lab',
      accessor: 'lab',
      width: '120px',
      render: (row) => row.lab || row.Lab || '-',
    },
    {
      key: 'pesananKhusus',
      header: 'Pesanan Khusus',
      accessor: 'pesananKhusus',
      width: '160px',
      render: (row) => row.pesananKhusus || row.pesanan_khusus || '-',
    },
    {
      key: 'kurangKelengkapan',
      header: 'Kurang Kelengkapan',
      accessor: 'kurangKelengkapan',
      width: '180px',
      render: (row) => row.kurangKelengkapan || row.kurang_kelengkapan || '-',
    },
    { key: 'tanggalMasuk', header: 'Tanggal Masuk', accessor: 'tanggalMasuk', width: '140px' },
    {
      key: 'dokumen',
      header: 'Dokumen',
      width: '180px',
      render: (row) => {
        const resolvedUrl = resolveDokumenUrl(row.dokumen);
        const docLabel = row.dokumenNama || deriveFileNameFromUrl(resolvedUrl) || 'Lihat Dokumen';

        return resolvedUrl ? (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="file-link truncate max-w-[150px] inline-block"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Paperclip size={14} /> {docLabel}
          </a>
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
        searchPlaceholder="Cari no. order, no. sertifikat, nama alat, layanan, atau onsite/inlab..."
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
          {submitError && (
            <div className="form-error md:col-span-2 col-span-2">{submitError}</div>
          )}

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
            <label className="form-label">No. Sertifikat</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: CERT-2026-001"
              value={formData.noSertifikat}
              onChange={(e) => setFormData({ ...formData, noSertifikat: e.target.value })}
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
              step="1"
              placeholder="Contoh: 5"
              value={formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Onsite/Inlab *</label>
            <select
              className="form-select"
              value={formData.onsiteInlab}
              onChange={(e) => setFormData({ ...formData, onsiteInlab: e.target.value })}
            >
              <option value="">- Pilih Tipe Pengerjaan -</option>
              {ONSITE_INLAB_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
            {(file || existingDocumentUrl || existingDocumentName) && (
              <div className="file-upload-preview">
                <span className="file-upload-preview-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Paperclip size={14} /> {file?.name || existingDocumentName || 'Lihat Dokumen'}
                </span>
                <button
                  type="button"
                  className="file-upload-remove"
                  onClick={() => {
                    setFile(null);
                    setExistingDocumentUrl('');
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
