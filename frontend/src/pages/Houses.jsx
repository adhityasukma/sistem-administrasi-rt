import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiPlus, HiHome, HiEye, HiPencil, HiMagnifyingGlass } from 'react-icons/hi2';
import { useToast } from '../components/Toast';
import { getHouses } from '../services/api';
import Pagination from '../components/Pagination';
import './Houses.css';
import '../components/ListControls.css';

export default function Houses() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    loadHouses();

    const onFocus = () => loadHouses();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const loadHouses = async () => {
    try {
      const res = await getHouses();
      setHouses(res.data.data || res.data);
    } catch {
      showToast('Gagal memuat data rumah', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredHouses = useMemo(() => {
    let result = houses;
    if (filter === 'occupied') result = result.filter(h => h.current_resident);
    if (filter === 'vacant') result = result.filter(h => !h.current_resident);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(h => 
        h.house_number.toLowerCase().includes(q) || 
        (h.description && h.description.toLowerCase().includes(q)) ||
        (h.current_resident?.resident?.name && h.current_resident.resident.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [houses, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredHouses.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filteredHouses.slice((currentPage - 1) * perPage, currentPage * perPage);
  const start = filteredHouses.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredHouses.length);

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

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-lg" />
        <p>Memuat data rumah...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title">Data Rumah</h1>
          <button className="btn btn-primary" onClick={() => navigate('/houses/create')}>
            <HiPlus /> Tambah Rumah
          </button>
        </div>
        <p className="page-subtitle">Kelola data rumah perumahan</p>
      </div>

      <div className="houses-filter">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'occupied', label: 'Dihuni' },
          { key: 'vacant', label: 'Tidak Dihuni' },
        ].map((f) => (
          <button
            key={f.key}
            className={`houses-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
              placeholder="Cari rumah, deskripsi, atau penghuni..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="empty-state">
          <HiHome />
          <p>Tidak ada data rumah</p>
        </div>
      ) : (
        <div className="houses-grid">
          {paged.map((house) => (
            <div key={house.id} className="house-card">
              <div className="house-card-header">
                <span className="house-card-number">
                  Rumah {house.house_number}
                </span>
                <span
                  className={`badge ${house.current_resident ? 'badge-success' : 'badge-gray'}`}
                >
                  {house.current_resident ? 'Dihuni' : 'Kosong'}
                </span>
              </div>

              {house.description && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {house.description}
                </div>
              )}

              {house.current_resident && house.current_resident.resident && (
                <div className="house-card-resident">
                  <div className="house-card-resident-name" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {house.current_resident.resident.name}
                  </div>
                  <div className="house-card-resident-status">
                    <span
                      className={`badge ${
                        house.current_resident.resident.status === 'tetap'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {house.current_resident.resident.status === 'tetap' ? 'Tetap' : 'Kontrak'}
                    </span>
                  </div>
                </div>
              )}

              <div className="house-card-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/houses/${house.id}/edit`)}>
                  <HiPencil /> Edit
                </button>
                <Link to={`/houses/${house.id}`} className="btn btn-ghost btn-sm">
                  <HiEye /> Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredHouses.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredHouses.length}
          itemsPerPage={perPage}
        />
      )}
    </div>
  );
}
