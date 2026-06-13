import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiXCircle } from 'react-icons/hi2';
import { createPayment, getHouses, getPayment, updatePayment } from '../services/api';
import { useToast } from '../components/Toast';
import SearchableSelect from '../components/SearchableSelect';
import './Payments.css';

export default function PaymentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const now = new Date();
  
  const [occupiedHouses, setOccupiedHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    house_resident_id: '',
    type: 'kebersihan',
    amount: 15000,
    period_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    period_month_end: '',
    notes: '',
  });
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await getHouses();
        const allHouses = res.data.data || [];
        const occupied = allHouses.filter(h => h.current_resident);
        setOccupiedHouses(occupied);

        if (isEdit) {
          const resPayment = await getPayment(id);
          const payment = resPayment.data.data;
          setForm({
            house_resident_id: payment.house_resident_id,
            type: payment.type,
            amount: payment.amount,
            period_month: payment.period_month,
            period_month_end: '',
            notes: payment.notes || '',
          });
        }
      } catch (err) {
        showToast('Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      type,
      amount: type === 'kebersihan' ? 15000 : 100000
    }));
  };

  useEffect(() => {
    if (form.period_month && form.period_month_end) {
      const start = new Date(form.period_month);
      const end = new Date(form.period_month_end);
      
      if (end < start) {
        setErrors(prev => ({ ...prev, period_end: 'Bulan sampai tidak boleh lebih awal dari bulan mulai' }));
      } else if (end.getTime() === start.getTime()) {
        setErrors(prev => ({ ...prev, period_end: 'Jika hanya membayar 1 bulan, biarkan "Sampai Bulan" kosong' }));
      } else {
        setErrors(prev => ({ ...prev, period_end: null }));
      }
    } else {
      setErrors(prev => ({ ...prev, period_end: null }));
    }
  }, [form.period_month, form.period_month_end]);

  // Clear API error if user changes the main inputs (house, type, or start month)
  useEffect(() => {
    setApiError(null);
  }, [form.type, form.house_resident_id, form.period_month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };

    if (!form.house_resident_id) {
      newErrors.house = 'Pilih rumah terlebih dahulu';
      hasError = true;
    } else {
      newErrors.house = null;
    }

    if (!form.period_month) {
      newErrors.period = 'Bulan mulai wajib diisi';
      hasError = true;
    } else {
      newErrors.period = null;
    }

    setErrors(newErrors);

    if (hasError) {
      showToast('Mohon lengkapi isian yang wajib', 'error');
      return;
    }

    setSubmitting(true);
    setApiError(null);
    try {
      if (isEdit) {
        await updatePayment(id, form);
        showToast('Pembayaran berhasil diubah', 'success');
      } else {
        await createPayment(form);
        showToast('Pembayaran berhasil dicatat', 'success');
      }
      navigate('/payments');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Gagal menyimpan pembayaran');
      showToast('Gagal menyimpan pembayaran', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      {submitting && (
        <div className="page-loading" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner" style={{ width: '48px', height: '48px' }}></div>
          <div style={{ marginTop: '16px', color: 'white', fontWeight: 500, fontSize: '1.1rem' }}>Menyimpan Data...</div>
        </div>
      )}
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/payments')} style={{ padding: '8px' }}>
            <HiArrowLeft />
          </button>
        <h1 className="page-title">{isEdit ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h1>
        </div>
        <p className="page-subtitle" style={{ marginLeft: '48px' }}>{isEdit ? 'Ubah detail pembayaran iuran' : 'Catat pembayaran iuran baru'}</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          {apiError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderLeft: '3px solid var(--danger)', marginBottom: '24px' }}>
              <div style={{ color: 'var(--danger)', fontSize: '1.25rem', flexShrink: 0, display: 'flex' }}>
                <HiXCircle />
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                {apiError}
              </div>
            </div>
          )}
          {Object.values(errors).some(e => e) && !apiError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderLeft: '3px solid var(--danger)', marginBottom: '24px' }}>
              <div style={{ color: 'var(--danger)', fontSize: '1.25rem', flexShrink: 0, display: 'flex' }}>
                <HiXCircle />
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                {Object.values(errors).filter(e => e).length === 1 ? (
                  Object.values(errors).filter(e => e)[0]
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {Object.values(errors).filter(e => e).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Rumah</label>
            <SearchableSelect
              options={occupiedHouses.map(h => ({ value: h.current_resident.id, label: `Blok ${h.house_number} — ${h.current_resident.resident.name}` }))}
              value={form.house_resident_id}
              onChange={(val) => {
                setForm(prev => ({ ...prev, house_resident_id: val }));
                if (errors.house) setErrors(prev => ({ ...prev, house: null }));
              }}
              placeholder="-- Pilih Rumah --"
              error={!!errors.house}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Jenis Iuran</label>
            <div className="type-toggle" style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className={`toggle-btn ${form.type === 'kebersihan' ? 'active' : ''}`} style={{ flex: 1, padding: '12px' }} onClick={() => handleTypeChange('kebersihan')}>
                Kebersihan (Rp 15.000)
              </button>
              <button type="button" className={`toggle-btn ${form.type === 'satpam' ? 'active' : ''}`} style={{ flex: 1, padding: '12px' }} onClick={() => handleTypeChange('satpam')}>
                Satpam (Rp 100.000)
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
            <input type="number" className="form-input" value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Bulan Mulai</label>
              <input type="month" className={`form-input ${errors.period || apiError ? 'is-invalid' : ''}`} value={form.period_month ? form.period_month.substring(0, 7) : ''} onChange={(e) => {
                setForm(prev => ({ ...prev, period_month: e.target.value ? e.target.value + '-01' : '' }));
                if (errors.period) setErrors(prev => ({ ...prev, period: null }));
              }} />
            </div>
            {!isEdit && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sampai Bulan (opsional)</label>
                <input type="month" className={`form-input ${errors.period_end || (apiError && form.period_month_end) ? 'is-invalid' : ''}`} value={form.period_month_end ? form.period_month_end.substring(0, 7) : ''} onChange={(e) => {
                  setForm(prev => ({ ...prev, period_month_end: e.target.value ? e.target.value + '-01' : '' }));
                  if (errors.period_end) setErrors(prev => ({ ...prev, period_end: null }));
                }} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Catatan (opsional)</label>
            <textarea className="form-input" rows="3" value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Catatan pembayaran..."></textarea>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/payments')}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || Object.values(errors).some(e => e)}>
              {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
