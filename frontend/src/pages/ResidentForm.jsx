import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiXCircle } from 'react-icons/hi2';
import { getResident, createResident, updateResident, uploadKtpPhoto, deleteKtpPhoto, getResidentPhotoUrl } from '../services/api';
import FileUpload from '../components/FileUpload';
import { useToast } from '../components/Toast';
import './Residents.css';

const emptyForm = {
  name: '',
  phone: '',
  status: 'tetap',
  is_married: false,
};

export default function ResidentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [form, setForm] = useState(emptyForm);
  const [ktpFile, setKtpFile] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingResident, setEditingResident] = useState(null);
  const [ktpRemoved, setKtpRemoved] = useState(false);

  useEffect(() => {
    if (id) {
      loadResidentData();
    }
  }, [id]);

  const loadResidentData = async () => {
    try {
      const res = await getResident(id);
      const row = res.data.data || res.data;
      setEditingResident(row);
      setForm({
        name: row.name || '',
        phone: row.phone || '',
        status: row.status || 'tetap',
        is_married: !!row.is_married,
      });
    } catch {
      showToast('Gagal memuat data penghuni', 'error');
      navigate('/residents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };

    if (!form.name.trim()) {
      newErrors.name = ['Nama wajib diisi'];
      hasError = true;
    } else {
      newErrors.name = null;
    }

    setErrors(newErrors);

    if (hasError) {
      showToast('Terjadi kesalahan pengisian form', 'error');
      return;
    }
    setSubmitting(true);
    try {
      let resident;
      if (id) {
        const res = await updateResident(id, form);
        resident = res.data.data || res.data;
        showToast('Penghuni berhasil diperbarui', 'success');
      } else {
        const res = await createResident(form);
        resident = res.data.data || res.data;
        showToast('Penghuni berhasil ditambahkan', 'success');
      }
      
      // Upload KTP if selected
      if (ktpFile && resident?.id) {
        try {
          await uploadKtpPhoto(resident.id, ktpFile);
        } catch {
          showToast('Foto KTP gagal diupload', 'warning');
        }
      } else if (ktpRemoved && id) {
        try {
          await deleteKtpPhoto(id);
        } catch {
          showToast('Gagal menghapus foto KTP', 'warning');
        }
      }
      navigate('/residents');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      const msg = err.response?.data?.message || 'Terjadi kesalahan pada server';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="residents-page animate-fade-in">
        <div className="loading-state"><div className="loading-spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="residents-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/residents')} style={{ padding: '8px' }}>
            <HiArrowLeft />
          </button>
          <h1 className="page-title">{id ? 'Edit Penghuni' : 'Tambah Penghuni'}</h1>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          {Object.values(errors).some(e => e) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderLeft: '3px solid var(--danger)', marginBottom: '24px' }}>
              <div style={{ color: 'var(--danger)', fontSize: '1.25rem', flexShrink: 0, display: 'flex' }}>
                <HiXCircle />
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                {Object.values(errors).filter(e => e).length === 1 ? (
                  Object.values(errors).filter(e => e)[0][0] || Object.values(errors).filter(e => e)[0]
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {Object.values(errors).filter(e => e).map((errArray, idx) => (
                      <li key={idx}>{Array.isArray(errArray) ? errArray[0] : errArray}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              className={`form-input ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor Telepon</label>
            <input
              className={`form-input ${errors.phone ? 'is-invalid' : ''}`}
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status Penghuni</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="tetap">Tetap</option>
                <option value="kontrak">Kontrak</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status Pernikahan</label>
              <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '42px', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={form.is_married}
                  onChange={(e) => setForm({ ...form, is_married: e.target.checked })}
                  style={{ width: '18px', height: '18px', margin: 0 }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sudah Menikah</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Foto KTP</label>
            <div className="ktp-upload-wrapper">
              <FileUpload
                onFileSelect={(file) => {
                  setKtpFile(file);
                  setKtpRemoved(false);
                }}
                onRemove={() => setKtpRemoved(true)}
                currentImage={editingResident?.ktp_photo ? getResidentPhotoUrl(editingResident.ktp_photo) : null}
                accept="image/*"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/residents')}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : (id ? 'Simpan Perubahan' : 'Tambah Penghuni')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
