import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getReportSummary, getReportMonthly } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { useToast } from '../components/Toast';
import './Reports.css';

const CATEGORY_LABELS = {
  gaji_satpam: 'Gaji Satpam',
  listrik_pos: 'Token Listrik Pos',
  perbaikan_jalan: 'Perbaikan Jalan',
  perbaikan_selokan: 'Perbaikan Selokan',
  lainnya: 'Lainnya',
};

export default function Reports() {
  const { showToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [summaryData, setSummaryData] = useState([]);
  const [summaryMeta, setSummaryMeta] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  useEffect(() => { loadSummary(); }, [year]);
  useEffect(() => { loadMonthly(); }, [year, selectedMonth]);

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await getReportSummary(year);
      const data = (res.data.data || []).map(item => ({
        ...item,
        month_short: getMonthName(item.month).substring(0, 3),
      }));
      setSummaryData(data);
      setSummaryMeta(res.data.meta || {});
    } catch {
      showToast('Gagal memuat ringkasan laporan', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadMonthly = async () => {
    setLoadingMonthly(true);
    try {
      const res = await getReportMonthly(year, selectedMonth);
      setMonthlyData(res.data.data);
    } catch {
      showToast('Gagal memuat detail bulanan', 'error');
    } finally {
      setLoadingMonthly(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ color: item.color }}>
            {item.name}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    );
  };

  const balance = (summaryMeta.total_income || 0) - (summaryMeta.total_expense || 0);

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Laporan Keuangan</h1>
          <p className="page-subtitle">Ringkasan pemasukan dan pengeluaran</p>
        </div>
        <div className="filter-group">
          <label>Tahun Laporan</label>
          <input 
            type="number" 
            className="form-input" 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card glass-card income">
          <span className="summary-label">Total Pemasukan {year}</span>
          <span className="summary-value">{formatCurrency(summaryMeta.total_income || 0)}</span>
        </div>
        <div className="summary-card glass-card expense">
          <span className="summary-label">Total Pengeluaran {year}</span>
          <span className="summary-value">{formatCurrency(summaryMeta.total_expense || 0)}</span>
        </div>
        <div className={`summary-card glass-card ${balance >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Saldo {year}</span>
          <span className="summary-value">{formatCurrency(balance)}</span>
        </div>
      </div>

      {/* Annual Chart */}
      <div className="chart-section glass-card">
        <h2>Grafik Pemasukan vs Pengeluaran — {year}</h2>
        {loadingSummary ? (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={summaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="month_short" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total_income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Detail */}
      <div className="monthly-section">
        <h2>Detail Bulanan</h2>
        <div className="month-selector">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <button
              key={m}
              className={`month-btn ${selectedMonth === m ? 'active' : ''}`}
              onClick={() => setSelectedMonth(m)}
            >
              {getMonthName(m).substring(0, 3)}
            </button>
          ))}
        </div>

        {loadingMonthly ? (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        ) : monthlyData ? (
          <div className="monthly-detail">
            <div className="monthly-column glass-card">
              <h3 className="column-title income-title">
                Pemasukan — {getMonthName(selectedMonth)} {year}
              </h3>
              
              <div className="income-section">
                <h4>Iuran Kebersihan ({monthlyData.payments?.kebersihan?.count || 0} pembayaran)</h4>
                {(monthlyData.payments?.kebersihan?.items || []).map((p, i) => (
                  <div key={i} className="detail-item">
                    <span>{p.house_resident?.resident?.name || '-'}</span>
                    <span className="item-amount positive">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                <div className="subtotal">
                  <span>Subtotal Kebersihan</span>
                  <span>{formatCurrency(monthlyData.payments?.kebersihan?.subtotal || 0)}</span>
                </div>
              </div>

              <div className="income-section">
                <h4>Iuran Satpam ({monthlyData.payments?.satpam?.count || 0} pembayaran)</h4>
                {(monthlyData.payments?.satpam?.items || []).map((p, i) => (
                  <div key={i} className="detail-item">
                    <span>{p.house_resident?.resident?.name || '-'}</span>
                    <span className="item-amount positive">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                <div className="subtotal">
                  <span>Subtotal Satpam</span>
                  <span>{formatCurrency(monthlyData.payments?.satpam?.subtotal || 0)}</span>
                </div>
              </div>

              <div className="grand-total income-total">
                <span>Total Pemasukan</span>
                <span>{formatCurrency(monthlyData.total_income || 0)}</span>
              </div>
            </div>

            <div className="monthly-column glass-card">
              <h3 className="column-title expense-title">
                Pengeluaran — {getMonthName(selectedMonth)} {year}
              </h3>
              
              {(monthlyData.expenses || []).length === 0 ? (
                <p className="no-data">Tidak ada pengeluaran bulan ini</p>
              ) : (
                (monthlyData.expenses || []).map((e, i) => (
                  <div key={i} className="detail-item">
                    <div>
                      <span>{e.title}</span>
                      <span className={`badge badge-sm ${
                        e.category === 'gaji_satpam' ? 'badge-info' :
                        e.category === 'listrik_pos' ? 'badge-warning' :
                        e.category === 'perbaikan_jalan' ? 'badge-orange' :
                        e.category === 'perbaikan_selokan' ? 'badge-purple' : 'badge-secondary'
                      }`}>
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </div>
                    <span className="item-amount negative">{formatCurrency(e.amount)}</span>
                  </div>
                ))
              )}

              <div className="grand-total expense-total">
                <span>Total Pengeluaran</span>
                <span>{formatCurrency(monthlyData.total_expense || 0)}</span>
              </div>
            </div>
          </div>
        ) : null}

        {monthlyData && (
          <div className="monthly-balance glass-card">
            <span>Saldo {getMonthName(selectedMonth)} {year}</span>
            <span className={`balance-value ${(monthlyData.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(monthlyData.balance || 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
