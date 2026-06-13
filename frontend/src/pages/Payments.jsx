import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiPlus, HiCheck, HiXMark, HiMagnifyingGlass, HiPencil, HiTrash } from 'react-icons/hi2';
import { getPaymentStatus, updatePayment, deletePayment } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';
import './Payments.css';

export default function Payments() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [kebersihanFilter, setKebersihanFilter] = useState('all');
  const [satpamFilter, setSatpamFilter] = useState('all');
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { loadStatus(); }, [year, month, endYear, endMonth]);

  const getPeriodText = (item) => {
    return `${getMonthName(item.status_month)} ${item.status_year}`;
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const params = { start_year: year, start_month: month };
      if (endYear && endMonth) {
        params.end_year = endYear;
        params.end_month = endMonth;
      }
      const res = await getPaymentStatus(params);
      setStatusData(res.data.data || []);
    } catch {
      showToast('Gagal memuat status pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return statusData.filter(item => {
      if (kebersihanFilter === 'lunas' && !item.kebersihan_paid) return false;
      if (kebersihanFilter === 'belum' && item.kebersihan_paid) return false;
      if (satpamFilter === 'lunas' && !item.satpam_paid) return false;
      if (satpamFilter === 'belum' && item.satpam_paid) return false;
      if (search) {
        const query = search.toLowerCase();
        const numMatch = String(item.house_number).toLowerCase().includes(query);
        const nameMatch = String(item.resident_name).toLowerCase().includes(query);
        if (!numMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [statusData, kebersihanFilter, satpamFilter, search]);

  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paged = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredData.length);

  const pageButtons = () => {
    const btns = [];
    let s = Math.max(1, currentPage - 1);
    let e = Math.min(totalPages, s + 2);
    if (e - s < 2) s = Math.max(1, e - 2);
    for (let i = s; i <= e; i++) btns.push(i);
    return btns;
  };

  const handleEditClick = (paymentId, amount, notes, typeLabel) => {
    setEditPaymentData({ id: paymentId, typeLabel });
    setEditAmount(amount ? parseInt(amount, 10).toString() : '');
    setEditNotes(notes || '');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPaymentData) return;
    setIsSubmitting(true);
    try {
      await updatePayment(editPaymentData.id, {
        amount: Number(editAmount),
        notes: editNotes
      });
      showToast('success', 'Pembayaran berhasil diubah');
      setEditModalOpen(false);
      loadStatus();
    } catch (error) {
      showToast('error', 'Gagal mengubah pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (paymentId) => {
    setDeletePaymentId(paymentId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePaymentId) return;
    setIsDeleting(true);
    try {
      await deletePayment(deletePaymentId);
      showToast('success', 'Pembayaran berhasil dihapus');
      setDeleteConfirmOpen(false);
      loadStatus();
    } catch (error) {
      showToast('error', 'Gagal menghapus pembayaran');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Pembayaran Iuran</h1>
          <p className="page-subtitle">Kelola iuran bulanan kebersihan & satpam</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/payments/create')}>
          <HiPlus /> Tambah Pembayaran
        </button>
      </div>

      <div className="filters glass-card">
        {/* Row 1: Dates */}
        <div className="filters-row">
          <div className="filter-group date-filter-group">
            <label>Bulan Mulai</label>
            <input 
              type="month" 
              className="form-input" 
              value={`${year}-${String(month).padStart(2, '0')}`} 
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m] = e.target.value.split('-');
                  setYear(Number(y));
                  setMonth(Number(m));
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="filter-group date-filter-group">
            <label>Sampai Bulan (opsional)</label>
            <input 
              type="month" 
              className="form-input" 
              value={endYear && endMonth ? `${endYear}-${String(endMonth).padStart(2, '0')}` : ''} 
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m] = e.target.value.split('-');
                  setEndYear(Number(y));
                  setEndMonth(Number(m));
                } else {
                  setEndYear('');
                  setEndMonth('');
                }
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Row 2: Status Types */}
        <div className="filters-row">
          <div className="filter-group">
            <label>Iuran Kebersihan</label>
            <div className="filter-buttons">
              <button className={`filter-btn ${kebersihanFilter === 'all' ? 'active' : ''}`} onClick={() => { setKebersihanFilter('all'); setPage(1); }}>Semua</button>
              <button className={`filter-btn ${kebersihanFilter === 'lunas' ? 'active' : ''}`} onClick={() => { setKebersihanFilter('lunas'); setPage(1); }}>Lunas</button>
              <button className={`filter-btn ${kebersihanFilter === 'belum' ? 'active' : ''}`} onClick={() => { setKebersihanFilter('belum'); setPage(1); }}>Belum Lunas</button>
            </div>
          </div>
          <div className="filter-group">
            <label>Iuran Satpam</label>
            <div className="filter-buttons">
              <button className={`filter-btn ${satpamFilter === 'all' ? 'active' : ''}`} onClick={() => { setSatpamFilter('all'); setPage(1); }}>Semua</button>
              <button className={`filter-btn ${satpamFilter === 'lunas' ? 'active' : ''}`} onClick={() => { setSatpamFilter('lunas'); setPage(1); }}>Lunas</button>
              <button className={`filter-btn ${satpamFilter === 'belum' ? 'active' : ''}`} onClick={() => { setSatpamFilter('belum'); setPage(1); }}>Belum Lunas</button>
            </div>
          </div>
        </div>
      </div>

      <div className="status-section">
        <h2>Status Pembayaran — {getMonthName(month)} {year} {endYear && endMonth ? `- ${getMonthName(endMonth)} ${endYear}` : ''}</h2>
        {loading ? (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        ) : statusData.length === 0 ? (
          <div className="empty-state glass-card"><p>Tidak ada rumah yang dihuni saat ini</p></div>
        ) : (
          <>
            <div className="datatable-controls" style={{ marginBottom: '24px' }}>
              <div className="datatable-length">
                <label>
                  Tampilkan
                  <select className="form-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  data
                </label>
              </div>
              <div className="datatable-search">
                <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
                  <HiMagnifyingGlass style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.125rem' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Cari nomor rumah atau penghuni..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
            </div>

            {paged.length === 0 ? (
              <div className="empty-state glass-card"><p>Data pembayaran tidak ditemukan</p></div>
            ) : (
              <div className="houses-grid">
                {paged.map((item) => (
                  <div key={`${item.house_id}-${item.status_year}-${item.status_month}`} className="house-card">
                    <div className="house-card-header">
                      <span className="house-card-number">Rumah {item.house_number}</span>
                      {endYear && endMonth && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {getMonthName(item.status_month)} {item.status_year}
                        </span>
                      )}
                    </div>
                    <div className="house-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                      <div className="status-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Penghuni</span>
                        <strong>{item.resident_name}</strong>
                      </div>
                      <div className="status-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Periode</span>
                        <strong>{getPeriodText(item)}</strong>
                      </div>

                      <div className="payment-details" style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Iuran Kebersihan</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {item.kebersihan_paid && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button title="Edit Pembayaran" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} onClick={() => handleEditClick(item.kebersihan_payment_id, item.kebersihan_amount, item.kebersihan_notes, 'Iuran Kebersihan')}>
                                    <HiPencil size={16} />
                                  </button>
                                  <button title="Hapus Pembayaran" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} onClick={() => handleDeleteClick(item.kebersihan_payment_id)}>
                                    <HiTrash size={16} />
                                  </button>
                                </div>
                              )}
                              <span className={`status-badge ${item.kebersihan_paid ? 'paid' : 'unpaid'}`}>
                                {item.kebersihan_paid ? <><HiCheck /> Lunas</> : <><HiXMark /> Belum</>}
                              </span>
                            </div>
                          </div>
                          {item.kebersihan_paid && Boolean(item.kebersihan_amount) && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Nominal</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.kebersihan_amount)}</strong>
                              </div>
                              {item.kebersihan_notes && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span>Catatan</span>
                                  <span style={{ color: 'var(--text-primary)' }}>{item.kebersihan_notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ paddingTop: '16px', borderTop: '1px dashed var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Iuran Satpam</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {item.satpam_paid && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button title="Edit Pembayaran" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} onClick={() => handleEditClick(item.satpam_payment_id, item.satpam_amount, item.satpam_notes, 'Iuran Satpam')}>
                                    <HiPencil size={16} />
                                  </button>
                                  <button title="Hapus Pembayaran" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} onClick={() => handleDeleteClick(item.satpam_payment_id)}>
                                    <HiTrash size={16} />
                                  </button>
                                </div>
                              )}
                              <span className={`status-badge ${item.satpam_paid ? 'paid' : 'unpaid'}`}>
                                {item.satpam_paid ? <><HiCheck /> Lunas</> : <><HiXMark /> Belum</>}
                              </span>
                            </div>
                          </div>
                          {item.satpam_paid && Boolean(item.satpam_amount) && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Nominal</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.satpam_amount)}</strong>
                              </div>
                              {item.satpam_notes && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span>Catatan</span>
                                  <span style={{ color: 'var(--text-primary)' }}>{item.satpam_notes}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredData.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filteredData.length}
                itemsPerPage={perPage}
              />
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit {editPaymentData?.typeLabel}</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nominal (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={editAmount} 
                  placeholder="Contoh: 15000 (Hanya angka)"
                  onKeyDown={(e) => {
                    if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setEditAmount(e.target.value)} 
                  min="0"
                  required 
                />
                {editAmount && (
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                    Rp {Number(editAmount).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Catatan</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '16px' }}>
              <HiTrash size={48} />
            </div>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Hapus Pembayaran?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Tindakan ini akan membatalkan status lunas dan menghapus data pembayaran secara permanen. Apakah Anda yakin?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Batal</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
