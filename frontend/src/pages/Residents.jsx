import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiPlus, HiPencil, HiMagnifyingGlass, HiPhone, HiUserGroup } from 'react-icons/hi2';
import { getResidents, getResidentPhotoUrl } from '../services/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';
import '../components/ListControls.css';
import './Residents.css';

export default function Residents() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [houseFilter, setHouseFilter] = useState('all');
  
  // Data Grid states
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    loadResidents();

    const onFocus = () => loadResidents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const loadResidents = async () => {
    try {
      const res = await getResidents();
      setResidents(res.data.data || res.data);
    } catch {
      showToast('Gagal memuat data penghuni', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = useMemo(() => {
    let filtered = residents;
    if (houseFilter === 'placed') filtered = filtered.filter(r => r.current_house);
    if (houseFilter === 'unplaced') filtered = filtered.filter(r => !r.current_house);

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(q) || 
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.current_house?.house?.house_number && r.current_house.house.house_number.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [residents, houseFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filteredResidents.slice((currentPage - 1) * perPage, currentPage * perPage);
  const start = filteredResidents.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredResidents.length);

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  const pageButtons = () => {
    const pages = [];
    const maxButtons = 5;
    let startP = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endP = Math.min(totalPages, startP + maxButtons - 1);
    if (endP - startP + 1 < maxButtons) startP = Math.max(1, endP - maxButtons + 1);
    for (let i = startP; i <= endP; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="residents-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title">Data Penghuni</h1>
          <button className="btn btn-primary" onClick={() => navigate('/residents/create')}>
            <HiPlus /> Tambah Penghuni
          </button>
        </div>
        <p className="page-subtitle">Kelola data penghuni perumahan</p>
      </div>

      <div className="filter-pills">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'placed', label: 'Sudah Ditempatkan' },
          { key: 'unplaced', label: 'Belum Ditempatkan' },
        ].map((f) => (
          <button
            key={f.key}
            className={`filter-pill-btn ${houseFilter === f.key ? 'active' : ''}`}
            onClick={() => setHouseFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="datatable-controls">
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
              placeholder="Cari penghuni atau rumah..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner"></div></div>
      ) : paged.length === 0 ? (
        <div className="empty-state glass-card" style={{ marginTop: 20 }}>
          <HiUserGroup style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
          <p>Belum ada data penghuni</p>
        </div>
      ) : (
        <div className="residents-grid">
          {paged.map((r) => (
            <div key={r.id} className="resident-card">
              <div className="resident-card-header">
                <div className="resident-avatar-wrapper">
                  <div className="resident-avatar-circle">
                    {r.ktp_photo ? (
                      <img
                        src={getResidentPhotoUrl(r.ktp_photo)}
                        alt={r.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      r.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="resident-name-group">
                    <div className="resident-name">{r.name}</div>
                    <div className="resident-phone"><HiPhone /> {r.phone || '-'}</div>
                  </div>
                </div>
              </div>
              
              <div className="resident-card-body">
                <div className="resident-detail-row">
                  <span className="resident-detail-label">Status Rumah</span>
                  <span className="resident-detail-value">
                    {r.current_house ? `Rumah ${r.current_house.house?.house_number}` : <span style={{ color: 'var(--text-muted)' }}>Belum ditempatkan</span>}
                  </span>
                </div>
                <div className="resident-detail-row">
                  <span className="resident-detail-label">Status Penghuni</span>
                  <span className={`badge ${r.status === 'tetap' ? 'badge-success' : 'badge-warning'}`}>
                    {r.status === 'tetap' ? 'Tetap' : 'Kontrak'}
                  </span>
                </div>
                <div className="resident-detail-row">
                  <span className="resident-detail-label">Status Nikah</span>
                  <span className={`badge ${r.is_married ? 'badge-info' : 'badge-gray'}`}>
                    {r.is_married ? 'Ya' : 'Tidak'}
                  </span>
                </div>
              </div>

              <div className="resident-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/residents/${r.id}/edit`)}>
                  <HiPencil /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filteredResidents.length}
        itemsPerPage={perPage}
      />
    </div>
  );
}
