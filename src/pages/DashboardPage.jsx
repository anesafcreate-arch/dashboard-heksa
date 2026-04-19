import { useMemo, useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatCard from '../components/ui/StatCard';
import {
  Package,
  Hourglass,
  CheckCircle,
  BarChart3,
  Activity,
  MoreHorizontal,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import AlatKeluarIcon from '../components/ui/AlatKeluarIcon';
import { CHART_DATA_7HARI } from '../data/mockData';
import './DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { user } = useAuth();
  const { alatMasuk, alatKeluar, jadwalOnsite } = useData();
  const [activityFilter, setActivityFilter] = useState('all');

  const roleKey = String(user?.role || '').toLowerCase().trim();
  const nameKey = String(user?.nama_lengkap || user?.nama || '').toLowerCase().trim();
  const isManagerName = ['dian', 'fida', 'uko'].some((name) => nameKey.includes(name));
  const canViewJadwalOnsite = ['direktur', 'manager', 'admin', 'teknisi'].includes(roleKey) || isManagerName;
  const showKalibrasiChart = roleKey !== 'teknisi';

  const prevDiambilCountRef = useRef(
    alatKeluar.filter((b) => b.statusKalibrasi === 'DIAMBIL').length
  );

  useEffect(() => {
    const currentDiambilCount = alatKeluar.filter((b) => b.statusKalibrasi === 'DIAMBIL').length;
    if (currentDiambilCount > prevDiambilCountRef.current) {
      setActivityFilter('keluar');
    }
    prevDiambilCountRef.current = currentDiambilCount;
  }, [alatKeluar]);

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const masukToday = alatMasuk.filter((b) => b.tanggalMasuk === today).length;
    const keluarToday = alatKeluar.filter((b) => b.statusKalibrasi === 'DIAMBIL' && b.tanggalDiambil === today).length;
    const proses = alatKeluar.filter((b) => b.statusKalibrasi === 'MENUNGGU' || b.statusKalibrasi === 'PROSES').length;
    const selesai = alatKeluar.filter((b) => b.statusKalibrasi === 'SELESAI' || b.statusKalibrasi === 'DIAMBIL').length;
    return { masukToday, keluarToday, proses, selesai };
  }, [alatMasuk, alatKeluar, today]);

  const chartData = {
    labels: CHART_DATA_7HARI.labels,
    datasets: [
      {
        label: 'Alat Masuk',
        data: CHART_DATA_7HARI.masuk,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: 'Alat Keluar',
        data: CHART_DATA_7HARI.keluar,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0a1628',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 14,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, stepSize: 1 },
        grid: { color: 'rgba(148, 163, 184, 0.05)' },
      },
    },
  };

  const recentActivities = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activities = [];

    alatMasuk
      .filter((item) => item.tanggalMasuk === todayStr)
      .forEach((item) => {
        activities.push({
          id: `masuk-${item.id}`,
          type: 'masuk',
          name: item.namaAlat,
          kode: item.kodeAlat,
          date: item.tanggalMasuk,
          status: 'MASUK',
          jenisLayanan: item.jenisLayanan,
        });
      });

    alatKeluar
      .filter((item) => item.statusKalibrasi === 'DIAMBIL' && item.tanggalDiambil === todayStr)
      .forEach((item) => {
        activities.push({
          id: `keluar-${item.id}`,
          type: 'keluar',
          name: item.namaAlat,
          kode: item.kodeAlat,
          date: item.tanggalDiambil,
          status: 'KELUAR',
          jenisLayanan: item.jenisLayanan,
        });
      });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (activityFilter === 'masuk') {
      return activities.filter((a) => a.type === 'masuk').slice(0, 8);
    }
    if (activityFilter === 'keluar') {
      return activities.filter((a) => a.type === 'keluar').slice(0, 8);
    }
    return activities.slice(0, 8);
  }, [alatMasuk, alatKeluar, activityFilter]);

  const onsiteRows = useMemo(() => (Array.isArray(jadwalOnsite) ? jadwalOnsite.slice(0, 8) : []), [jadwalOnsite]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRoleTitle = () => {
    const titles = {
      admin: 'Beranda Administrasi',
      teknisi: 'Beranda Teknisi',
      direktur: 'Dashboard Eksekutif',
      manager: 'Dashboard Manager',
    };
    return titles[roleKey] || 'Dashboard';
  };

  const statusColor = (type) => {
    return type === 'masuk' ? '#3b82f6' : '#22c55e';
  };

  const onsiteStatusClass = (status) => String(status || 'TERJADWAL').toLowerCase();

  const renderJadwalOnsiteTable = (className = '') => (
    <div className={`dashboard-onsite-card ${className}`}>
      <div className="onsite-card-header">
        <div className="onsite-card-title">
          <CalendarDays size={18} />
          <span>Jadwal Onsite</span>
        </div>
        <span className="onsite-count-badge">{onsiteRows.length} jadwal</span>
      </div>

      <div className="onsite-table-wrapper">
        <table className="onsite-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Lokasi</th>
              <th>Teknisi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {onsiteRows.length > 0 ? (
              onsiteRows.map((item) => (
                <tr key={item.id}>
                  <td className="onsite-date-cell">{formatDateDisplay(item.tanggalOnsite)}</td>
                  <td>
                    <div className="onsite-client-cell">
                      <span className="onsite-client-name">{item.pelanggan}</span>
                      {item.jenisLayanan && <span className="onsite-service-name">{item.jenisLayanan}</span>}
                    </div>
                  </td>
                  <td>
                    <span className="onsite-location-cell">
                      <MapPin size={14} /> {item.lokasi || '-'}
                    </span>
                  </td>
                  <td className="onsite-technician-cell">{item.teknisi || '-'}</td>
                  <td>
                    <span className={`onsite-status-badge ${onsiteStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="activity-empty-cell">
                  Belum ada jadwal onsite.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page page-container">
      <div className="dashboard-header">
        <h1>{getRoleTitle()}</h1>
        <p>Ringkasan aktivitas laboratorium kalibrasi hari ini</p>
      </div>

      <div className="dashboard-stats">
        <StatCard icon={<Package size={24} />} label="Alat Masuk Hari Ini" value={stats.masukToday} sub="Total item diterima" variant="blue" />
        <StatCard icon={<AlatKeluarIcon size={24} />} label="Alat Keluar Hari Ini" value={stats.keluarToday} sub="Diserahkan ke pelanggan" variant="green" />
        <StatCard icon={<Hourglass size={24} />} label="Dalam Proses" value={stats.proses} sub="Menunggu / dikalibrasi" variant="amber" />
        <StatCard icon={<CheckCircle size={24} />} label="Selesai" value={stats.selesai} sub="Selesai & diambil" variant="cyan" />
      </div>

      <div className="dashboard-grid">
        {showKalibrasiChart ? (
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-title">
              <BarChart3 size={18} /> Volume Kalibrasi - 7 Hari Terakhir
            </div>
            <div className="dashboard-chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        ) : (
          canViewJadwalOnsite && renderJadwalOnsiteTable('grid-card')
        )}

        <div className="dashboard-activity-card">
          <div className="activity-card-header">
            <div className="activity-card-title">
              <Activity size={18} />
              <span>Recent Activity</span>
            </div>
            <div className="activity-filter-tabs">
              <button
                className={`activity-tab ${activityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilter('all')}
              >
                Semua
              </button>
              <button
                className={`activity-tab ${activityFilter === 'masuk' ? 'active' : ''}`}
                onClick={() => setActivityFilter('masuk')}
              >
                Masuk
              </button>
              <button
                className={`activity-tab ${activityFilter === 'keluar' ? 'active' : ''}`}
                onClick={() => setActivityFilter('keluar')}
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="recent-activity-table-wrapper">
            <table className="recent-activity-table">
              <thead>
                <tr>
                  <th>Nama Alat</th>
                  <th>Tanggal</th>
                  <th>Kode</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="activity-account-cell">
                          <span
                            className="activity-dot-indicator"
                            style={{ background: statusColor(item.type) }}
                          />
                          <span className="activity-account-name">{item.name}</span>
                        </div>
                      </td>
                      <td className="activity-date-cell">{formatDateDisplay(item.date)}</td>
                      <td className="activity-amount-cell">{item.kode}</td>
                      <td>
                        <span className={`activity-status-badge ${item.type}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className="activity-more-btn">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="activity-empty-cell">
                      Tidak ada aktivitas yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {canViewJadwalOnsite && showKalibrasiChart && (
        <div className="dashboard-onsite-section">
          {renderJadwalOnsiteTable()}
        </div>
      )}
    </div>
  );
}
