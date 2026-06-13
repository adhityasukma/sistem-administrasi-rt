import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUserPlus, HiUserMinus, HiPhone, HiIdentification } from 'react-icons/hi2';
import { getHouse, getHouseHistory, getHousePaymentHistory, getResidents, assignResident, removeResident } from '../services/api';
import { formatCurrency, formatDate, getMonthYear } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchableSelect from '../components/SearchableSelect';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';
import './HouseDetail.css';

export default function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [house, setHouse] = useState(null);
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [availableResidents, setAvailableResidents] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  
  // Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(10);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [houseRes, historyRes, paymentRes] = await Promise.all([
        getHouse(id),
        getHouseHistory(id),
        getHousePaymentHistory(id),
      ]);
      setHouse(houseRes.data.data);
      setHistory(historyRes.data.data || []);
      setPayments(paymentRes.data.data || []);
    } catch (err) {
      showToast('Gagal memuat data rumah', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const res = await getResidents();
      const allResidents = res.data.data || [];
      setAvailableResidents(allResidents);
      setSelectedResidentId('');
      setShowAssignModal(true);
    } catch {
      showToast('Gagal memuat data penghuni', 'error');
    }
  };

  const handleAssignClick = () => {
    if (!selectedResidentId) return;
    const selectedResident = availableResidents.find(r => String(r.id) === String(selectedResidentId));
    if (selectedResident?.current_house?.house) {
      setConfirmData({
        name: selectedResident.name,
        fromHouse: selectedResident.current_house.house.house_number,
        toHouse: house.house_number
      });
      setShowConfirm(true);
    } else {
      submitAssign();
    }
  };

  const submitAssign = async () => {
    if (!selectedResidentId) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      await assignResident(id, { resident_id: selectedResidentId });
      showToast('Penghuni berhasil ditambahkan', 'success');
      setShowAssignModal(false);
      loadData();
    } catch {
      showToast('Gagal menambahkan penghuni', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    const residentId = house?.current_resident?.resident?.id;
    if (!residentId) return;
    setSubmitting(true);
    try {
      await removeResident(id, residentId);
      showToast('Penghuni berhasil dihapus dari rumah', 'success');
      setShowRemoveConfirm(false);
      loadData();
    } catch {
      showToast('Gagal menghapus penghuni', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner"></div></div>;
  }

  if (!house) {
    return <div className="page-error">Rumah tidak ditemukan</div>;
  }

  const currentResident = house.current_resident?.resident;

  return (
    <div className="house-detail-page">
      <button className="btn-back" onClick={() => navigate('/houses')}>
        <HiArrowLeft /> Kembali ke Daftar Rumah
      </button>

      <div className="house-detail-header">
        <div className="house-info-card glass-card">
          <h1>{house.house_number}</h1>
          <span className={`badge ${house.status === 'dihuni' ? 'badge-success' : 'badge-warning'}`}>
            {house.status === 'dihuni' ? 'Dihuni' : 'Tidak Dihuni'}
          </span>
          {house.description && <p className="house-desc">{house.description}</p>}
        </div>
      </div>

      <div className="current-resident-section">
        <h2>Penghuni Saat Ini</h2>
        {currentResident ? (
          <div className="resident-card glass-card">
            <div className="resident-info">
              <div className="resident-avatar">
                {currentResident.name.charAt(0).toUpperCase()}
              </div>
              <div className="resident-details">
                <h3>{currentResident.name}</h3>
                {currentResident.phone && <p><HiPhone /> {currentResident.phone}</p>}
                <div className="resident-badges">
                  <span className={`badge ${currentResident.status === 'tetap' ? 'badge-success' : 'badge-warning'}`}>
                    {currentResident.status === 'tetap' ? 'Tetap' : 'Kontrak'}
                  </span>
                  <span className="badge badge-info">
                    {currentResident.is_married ? 'Menikah' : 'Belum Menikah'}
                  </span>
                </div>
              </div>
            </div>
            <div className="resident-actions">
              <button className="btn btn-primary btn-sm" onClick={openAssignModal}>
                <HiUserPlus /> Ganti Penghuni
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRemoveConfirm(true)}>
                <HiUserMinus /> Hapus Penghuni
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-resident glass-card">
            <HiIdentification className="empty-icon" />
            <p>Rumah ini belum memiliki penghuni</p>
            <button className="btn btn-primary" onClick={openAssignModal}>
              <HiUserPlus /> Tambah Penghuni
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Riwayat Penghuni
        </button>
        <button 
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Riwayat Pembayaran
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="tab-content">
          <div className="datatable-controls" style={{ marginBottom: '16px' }}>
            <div className="datatable-length">
              <label>
                Tampilkan
                <select className="form-select" style={{ minWidth: '70px', padding: '6px 30px 6px 12px' }} value={historyPerPage} onChange={(e) => { setHistoryPerPage(Number(e.target.value)); setHistoryPage(1); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                data
              </label>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="empty-state glass-card"><p>Belum ada riwayat penghuni</p></div>
          ) : (
            <div className="history-timeline">
              {history.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((item, idx) => (
                <div key={idx} className={`timeline-item glass-card ${item.is_active ? 'active' : ''}`}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>{item.resident?.name || 'Unknown'}</h4>
                    <p className="timeline-dates">
                      {formatDate(item.start_date)} &mdash; {item.end_date ? formatDate(item.end_date) : 'Sekarang'}
                    </p>
                    <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {item.is_active ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>
                </div>
              ))}
                {history.length > 0 && (
                  <Pagination 
                    currentPage={historyPage}
                    totalPages={Math.ceil(history.length / historyPerPage)}
                    onPageChange={setHistoryPage}
                    totalItems={history.length}
                    itemsPerPage={historyPerPage}
                    style={{ marginTop: '32px' }}
                  />
                )}
              </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="tab-content">
          <div className="datatable-controls" style={{ marginBottom: '16px' }}>
            <div className="datatable-length">
              <label>
                Tampilkan
                <select className="form-select" style={{ minWidth: '70px', padding: '6px 30px 6px 12px' }} value={paymentsPerPage} onChange={(e) => { setPaymentsPerPage(Number(e.target.value)); setPaymentsPage(1); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                data
              </label>
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state glass-card"><p>Belum ada riwayat pembayaran</p></div>
          ) : (
            <div className="payments-list">
              {payments.slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage).map((p, idx) => (
                <div key={idx} className="payment-item glass-card">
                  <div className="payment-info">
                    <span className={`badge ${p.type === 'kebersihan' ? 'badge-info' : 'badge-primary'}`}>
                      {p.type === 'kebersihan' ? 'Kebersihan' : 'Satpam'}
                    </span>
                    <span className="payment-period">{getMonthYear(p.period_month)}</span>
                  </div>
                  <div className="payment-amount">{formatCurrency(p.amount)}</div>
                  <div className="payment-paid">Dibayar: {formatDate(p.paid_at)}</div>
                </div>
              ))}
                {payments.length > 0 && (
                  <Pagination 
                    currentPage={paymentsPage}
                    totalPages={Math.ceil(payments.length / paymentsPerPage)}
                    onPageChange={setPaymentsPage}
                    totalItems={payments.length}
                    itemsPerPage={paymentsPerPage}
                    style={{ marginTop: '32px' }}
                  />
                )}
              </div>
          )}
        </div>
      )}

      <Modal 
        isOpen={showAssignModal} 
        onClose={() => setShowAssignModal(false)} 
        title={currentResident ? "Ganti Penghuni" : "Tambah Penghuni"} 
        size="md"
      >
        <div className="form-group" style={{ minHeight: '300px' }}>
          {currentResident && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Penghuni saat ini: <strong style={{ color: 'var(--text-primary)' }}>{currentResident.name}</strong><br />
              <span style={{ fontSize: '0.8rem' }}>Memilih penghuni baru akan otomatis menonaktifkan status penghuni lama di rumah ini.</span>
            </div>
          )}
          <label>Pilih Penghuni</label>
          <SearchableSelect
            options={[
              { value: '', label: '-- Pilih Penghuni --' },
              ...availableResidents.map((r) => {
                const statusStr = r.status === 'tetap' ? 'Tetap' : 'Kontrak';
                let label = `${r.name} (${statusStr})`;
                if (r.current_house?.house?.house_number) {
                  label += ` - (Rumah Blok ${r.current_house.house.house_number})`;
                }
                return {
                  value: r.id,
                  label: label
                };
              })
            ]}
            value={selectedResidentId}
            onChange={(val) => setSelectedResidentId(val)}
            placeholder="Cari nama penghuni..."
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Batal</button>
          <button className="btn btn-primary" onClick={handleAssignClick} disabled={!selectedResidentId || submitting}>
            {submitting ? 'Menyimpan...' : (currentResident ? 'Gantikan' : 'Tambahkan')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onConfirm={handleRemove}
        onCancel={() => setShowRemoveConfirm(false)}
        title="Hapus Penghuni"
        message={`Apakah Anda yakin ingin menghapus ${currentResident?.name || ''} dari rumah ini?`}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={submitAssign}
        title="Konfirmasi Pindah Rumah"
        message={
          confirmData && (
            <span>
              Penghuni <strong>{confirmData.name}</strong> saat ini menempati{' '}
              <strong>Rumah {confirmData.fromHouse}</strong>.<br />
              <br />
              Apakah Anda yakin ingin memindahkan penghuni ini ke{' '}
              <strong>Rumah {confirmData.toHouse}</strong>? Data di rumah sebelumnya
              akan ditandai sebagai tidak aktif.
            </span>
          )
        }
        confirmText="Ya, Pindahkan"
        confirmStyle="primary"
      />

    </div>
  );
}
