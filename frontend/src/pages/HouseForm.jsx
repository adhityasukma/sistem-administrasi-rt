import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiXCircle } from 'react-icons/hi2';
import { getHouse, createHouse, updateHouse, getResidents } from '../services/api';
import { useToast } from '../components/Toast';
import SearchableSelect from '../components/SearchableSelect';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HouseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [form, setForm] = useState({ house_number: '', description: '', resident_id: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [residents, setResidents] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const resResidents = await getResidents();
      setResidents(resResidents.data.data || resResidents.data);

      if (id) {
        const resHouse = await getHouse(id);
        const row = resHouse.data.data || resHouse.data;
        setForm({
          house_number: row.house_number || '',
          description: row.description || '',
          resident_id: row.current_resident?.resident_id || '',
        });
      }
    } catch {
      showToast('Gagal memuat data', 'error');
      navigate('/houses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.house_number.trim()) {
      setErrors({ house_number: ['Nomor rumah wajib diisi'] });
      showToast('Nomor rumah wajib diisi', 'error');
      return;
    }

    if (form.resident_id) {
      const selectedResident = residents.find(r => String(r.id) === String(form.resident_id));
      if (selectedResident?.current_house?.house) {
        const previousHouseId = selectedResident.current_house.house.id;
        if (String(previousHouseId) !== String(id)) {
          setConfirmData({
            name: selectedResident.name,
            fromHouse: selectedResident.current_house.house.house_number,
            toHouse: form.house_number || 'Rumah Baru'
          });
          setShowConfirm(true);
          return;
        }
      }
    }

    await submitForm();
  };

  const submitForm = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    try {
      if (id) {
        await updateHouse(id, form);
        showToast('Rumah berhasil diperbarui', 'success');
      } else {
        await createHouse(form);
        showToast('Rumah berhasil ditambahkan', 'success');
      }
      navigate('/houses');
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
      <div className="animate-fade-in">
        <div className="loading-state"><div className="loading-spinner"></div></div>
      </div>
    );
  }

  const residentOptions = residents.map(r => {
    const statusStr = r.status === 'tetap' ? 'Tetap' : 'Kontrak';
    let label = `${r.name} (${statusStr})`;
    if (r.current_house?.house?.house_number) {
      label += ` - (Rumah Blok ${r.current_house.house.house_number})`;
    }
    return {
      value: r.id,
      label: label,
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/houses')} style={{ padding: '8px' }}>
            <HiArrowLeft />
          </button>
          <h1 className="page-title">{id ? 'Edit Rumah' : 'Tambah Rumah'}</h1>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
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
            <label className="form-label">Nomor Rumah *</label>
            <input
              className={`form-input ${errors.house_number ? 'is-invalid' : ''}`}
              value={form.house_number}
              onChange={(e) => {
                setForm({ ...form, house_number: e.target.value });
                if (errors.house_number) setErrors({ ...errors, house_number: null });
              }}
              placeholder="Contoh: A-01"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea
              className={`form-textarea ${errors.description ? 'is-invalid' : ''}`}
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: null });
              }}
              placeholder="Deskripsi rumah (opsional)"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Penghuni (Opsional)</label>
            <SearchableSelect
              options={residentOptions}
              value={form.resident_id}
              onChange={(val) => {
                setForm({ ...form, resident_id: val });
                if (errors.resident_id) setErrors({ ...errors, resident_id: null });
              }}
              placeholder="-- Kosongkan / Tanpa Penghuni --"
              error={errors.resident_id}
            />
            {errors.resident_id && <span className="field-error">{errors.resident_id[0]}</span>}
            <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)' }}>Pilih penghuni jika rumah sudah ditempati.</small>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/houses')}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : (id ? 'Simpan Perubahan' : 'Tambah Rumah')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={submitForm}
        onCancel={() => setShowConfirm(false)}
        title="Konfirmasi Pindah Rumah"
        message={`Penghuni ${confirmData?.name} saat ini sudah menempati rumah Blok ${confirmData?.fromHouse}. Apakah Anda yakin ingin memindahkannya ke rumah Blok ${confirmData?.toHouse}? Rumah Blok ${confirmData?.fromHouse} akan otomatis dikosongkan.`}
        type="warning"
        confirmText="Ya, Pindahkan"
        cancelText="Batal"
      />
    </div>
  );
}
