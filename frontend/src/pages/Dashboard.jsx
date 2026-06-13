import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiHome,
  HiUserGroup,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiBuildingOffice,
  HiBanknotes,
} from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { getDashboard } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    
    // Auto-refresh data every 5 seconds for real-time feel
    const intervalId = setInterval(() => {
      loadDashboardInBackground();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardInBackground = async () => {
    try {
      const res = await getDashboard();
      setData(res.data.data);
    } catch {
      // silent
    }
  };

  const chartData = data?.monthly_chart
    ? data.monthly_chart.map((m) => ({
        name: getMonthName(m.month).slice(0, 3),
        Pemasukan: m.income || 0,
        Pengeluaran: m.expense || 0,
      }))
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.8125rem',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang, {user?.name || 'Admin'}</p>
      </div>

      {/* Stats Row 1 */}
      <div className="dashboard-stats">
        <StatsCard
          title="Total Rumah"
          value={data?.total_houses ?? 0}
          icon={HiHome}
          color="blue"
        />
        <StatsCard
          title="Rumah Dihuni"
          value={data?.occupied_houses ?? 0}
          icon={HiBuildingOffice}
          color="green"
        />
        <StatsCard
          title="Rumah Kosong"
          value={data?.vacant_houses ?? 0}
          icon={HiHome}
          color="orange"
        />
        <StatsCard
          title="Total Penghuni"
          value={data?.total_residents ?? 0}
          icon={HiUserGroup}
          color="purple"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="dashboard-stats" style={{ marginBottom: 24 }}>
        <StatsCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(data?.income_this_month ?? 0)}
          icon={HiArrowTrendingUp}
          color="green"
        />
        <StatsCard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(data?.expense_this_month ?? 0)}
          icon={HiArrowTrendingDown}
          color="red"
        />
        <StatsCard
          title="Saldo"
          value={formatCurrency(data?.balance ?? 0)}
          icon={HiBanknotes}
          color="blue"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="dashboard-chart-section">
          <h3 className="dashboard-chart-title">Pemasukan vs Pengeluaran (6 Bulan Terakhir)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${(v / 1000)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div className="dashboard-recent">
        <div className="dashboard-recent-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="dashboard-recent-title" style={{ marginBottom: 0 }}>Pembayaran Terbaru</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/payments')} style={{ fontSize: '0.75rem', padding: '4px 8px', minHeight: 'auto' }}>Lihat Semua &rarr;</button>
          </div>
          {data?.recent_payments?.length ? (
            data.recent_payments.map((p, i) => (
              <div key={i} className="dashboard-recent-item">
                <div className="dashboard-recent-info">
                  <strong>{p.house_resident?.resident?.name || 'N/A'} (Blok {p.house_resident?.house?.house_number || '-'})</strong>
                  <span>{p.type === 'kebersihan' ? 'Iuran Kebersihan' : 'Iuran Satpam'}</span>
                </div>
                <span className="dashboard-recent-amount text-success">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Belum ada pembayaran</p>
          )}
        </div>

        <div className="dashboard-recent-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="dashboard-recent-title" style={{ marginBottom: 0 }}>Pengeluaran Terbaru</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/expenses')} style={{ fontSize: '0.75rem', padding: '4px 8px', minHeight: 'auto' }}>Lihat Semua &rarr;</button>
          </div>
          {data?.recent_expenses?.length ? (
            data.recent_expenses.map((e, i) => (
              <div key={i} className="dashboard-recent-item">
                <div className="dashboard-recent-info">
                  <strong>{e.title || e.judul || 'N/A'}</strong>
                  <span>{e.category || e.kategori || ''}</span>
                </div>
                <span className="dashboard-recent-amount text-danger">
                  {formatCurrency(e.amount || e.jumlah || 0)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Belum ada pengeluaran</p>
          )}
        </div>
      </div>
    </div>
  );
}
