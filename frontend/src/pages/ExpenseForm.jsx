import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiXCircle } from 'react-icons/hi2';
import { createExpense, getExpense, updateExpense } from '../services/api';
import { useToast } from '../components/Toast';

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'lainnya',
    is_recurring: false,
  });

  useEffect(() => {
    if (isEdit) {
      loadExpense();
    }
  }, [id]);

  const loadExpense = async () => {
    try {
      const res = await getExpense(id);
      const data = res.data.data;
      setForm({
        title: data.title,
        description: data.description || '',
        amount: data.amount,
        expense_date: data.expense_date ? data.expense_date.split('T')[0] : '',
        category: data.category,
        is_recurring: data.is_recurring,
      });
    } catch (err) {
      showToast('Gagal memuat data pengeluaran', 'error');
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    let hasError = false;
    const newErrors = { ...errors };

    if (!form.title.trim()) {
      newErrors.title = 'Judul pengeluaran wajib diisi';
      hasError = true;
    } else {
      newErrors.title = null;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      newErrors.amount = 'Jumlah pengeluaran tidak valid';
      hasError = true;
    } else {
      newErrors.amount = null;
    }

    if (!form.expense_date) {
      newErrors.date = 'Tanggal wajib diisi';
      hasError = true;
    } else {
      newErrors.date = null;
    }

    setErrors(newErrors);

    if (hasError) {
      showToast('Terjadi kesalahan pengisian form', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateExpense(id, form);
        showToast('Pengeluaran berhasil diperbarui', 'success');
      } else {
        await createExpense(form);
        showToast('Pengeluaran berhasil dicatat', 'success');
      }
      navigate('/expenses');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Gagal menyimpan pengeluaran');
      showToast('Gagal menyimpan pengeluaran', 'error');
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
          <button className="btn btn-ghost" onClick={() => navigate('/expenses')} style={{ padding: '8px' }}>
            <HiArrowLeft />
          </button>
          <h1 className="page-title">{isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h1>
        </div>
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
            <label className="form-label">Judul *</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'is-invalid' : ''}`}
              placeholder="Judul pengeluaran"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: null });
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Deskripsi (opsional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Jumlah (Rp) *</label>
              <input
                type="number"
                className={`form-input ${errors.amount ? 'is-invalid' : ''}`}
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: null });
                }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tanggal *</label>
              <input
                type="date"
                className={`form-input ${errors.date ? 'is-invalid' : ''}`}
                value={form.expense_date}
                onChange={(e) => {
                  setForm({ ...form, expense_date: e.target.value });
                  if (errors.date) setErrors({ ...errors, date: null });
                }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Kategori *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="gaji_satpam">Gaji Satpam</option>
                <option value="listrik_pos">Token Listrik Pos</option>
                <option value="perbaikan_jalan">Perbaikan Jalan</option>
                <option value="perbaikan_selokan">Perbaikan Selokan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Pengeluaran Rutin</label>
              <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {form.is_recurring ? 'Ya, rutinkan tiap bulan' : 'Tidak, sekali jalan'}
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/expenses')}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || Object.values(errors).some(e => e)}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
