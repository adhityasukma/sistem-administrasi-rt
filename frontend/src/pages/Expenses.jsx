import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';
import { getExpenses, deleteExpense } from '../services/api';
import { formatCurrency, formatDate, getMonthName } from '../utils/helpers';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import './Expenses.css';

const CATEGORIES = [
  { value: 'gaji_satpam', label: 'Gaji Satpam', color: 'badge-info' },
  { value: 'listrik_pos', label: 'Token Listrik Pos', color: 'badge-warning' },
  { value: 'perbaikan_jalan', label: 'Perbaikan Jalan', color: 'badge-orange' },
  { value: 'perbaikan_selokan', label: 'Perbaikan Selokan', color: 'badge-purple' },
  { value: 'lainnya', label: 'Lainnya', color: 'badge-secondary' },
];

export default function Expenses() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const now = new Date();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateMode, setDateMode] = useState('all');
  const [startMonth, setStartMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [endMonth, setEndMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPerPage, setExpensesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { 
    setCurrentPage(1);
    loadExpenses(); 
  }, [startMonth, endMonth, filterCategory, dateMode]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateMode === 'custom') {
        if (startMonth) params.start_month = startMonth;
        if (endMonth) params.end_month = endMonth;
      }
      if (filterCategory) params.category = filterCategory;
      const res = await getExpenses(params);
      setExpenses(res.data.data || []);
    } catch {
      showToast('Gagal memuat data pengeluaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    navigate('/expenses/create');
  };

  const openEditModal = (expense) => {
    navigate(`/expenses/edit/${expense.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget.id);
      showToast('Pengeluaran berhasil dihapus', 'success');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadExpenses();
    } catch {
      showToast('Gagal menghapus pengeluaran', 'error');
    }
  };

  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[4];
  const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Client-side Search & Pagination
  const filteredExpenses = expenses.filter(expense => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return expense.title.toLowerCase().includes(q) || 
           (expense.description || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredExpenses.length / expensesPerPage);
  const currentExpenses = filteredExpenses.slice((currentPage - 1) * expensesPerPage, currentPage * expensesPerPage);

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1>Pengeluaran</h1>
          <p className="page-subtitle">Kelola pengeluaran bulanan RT</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}><HiPlus /> Tambah Pengeluaran</button>
      </div>

      <div className="filters glass-card">
        <div className="filter-group">
          <label>Periode</label>
          <div className="filter-pills" style={{ display: 'flex', gap: '8px', height: '44px', alignItems: 'center', marginBottom: '0' }}>
            <button 
              className={`filter-pill-btn ${dateMode === 'all' ? 'active' : ''}`} 
              onClick={() => setDateMode('all')}
            >
              Semua
            </button>
            <button 
              className={`filter-pill-btn ${dateMode === 'custom' ? 'active' : ''}`} 
              onClick={() => setDateMode('custom')}
            >
              Kustom Bulan
            </button>
          </div>
        </div>

        {dateMode === 'custom' && (
          <>
            <div className="filter-group">
              <label>Bulan Mulai</label>
              <input 
                type="month" 
                className="form-input" 
                value={startMonth} 
                onChange={(e) => setStartMonth(e.target.value)} 
              />
            </div>
            <div className="filter-group">
              <label>Sampai Bulan (Opsional)</label>
              <input 
                type="month" 
                className="form-input" 
                value={endMonth} 
                onChange={(e) => setEndMonth(e.target.value)} 
                min={startMonth}
              />
            </div>
          </>
        )}
        <div className="filter-group">
          <label>Kategori</label>
          <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Semua</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="filter-total">
          <label>Total</label>
          <div className="total-amount" style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{formatCurrency(totalExpense)}</div>
        </div>
      </div>

      <div className="datatable-controls glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="datatable-length" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Tampilkan
            <select 
              className="form-select" 
              value={expensesPerPage} 
              onChange={(e) => { setExpensesPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ width: 'auto', minWidth: '70px', minHeight: '36px', padding: '6px 30px 6px 12px' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            data
          </label>
        </div>
        <div className="datatable-search" style={{ flex: '1', display: 'flex', justifyContent: 'flex-end', minWidth: '200px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Cari judul atau deskripsi pengeluaran..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ maxWidth: '350px' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner"></div></div>
      ) : filteredExpenses.length === 0 ? (
        <div className="empty-state glass-card"><p>Belum ada data pengeluaran yang sesuai</p></div>
      ) : (
        <>
          <div className="expenses-list">
            {currentExpenses.map(expense => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <div key={expense.id} className="expense-item glass-card">
                <div className="expense-main">
                  <div className="expense-info">
                    <h3>{expense.title}</h3>
                    <div className="expense-meta">
                      <span>{formatDate(expense.expense_date)}</span>
                      <span className={`badge ${catInfo.color}`}>{catInfo.label}</span>
                      {expense.is_recurring && <span className="badge badge-info">Rutin</span>}
                    </div>
                    {expense.description && <p className="expense-desc">{expense.description}</p>}
                  </div>
                  <div className="expense-right">
                    <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                    <div className="expense-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(expense)}><HiPencil /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => { setDeleteTarget(expense); setShowDeleteConfirm(true); }}><HiTrash /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredExpenses.length}
            itemsPerPage={expensesPerPage}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        title="Hapus Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}"?`}
        type="danger"
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
