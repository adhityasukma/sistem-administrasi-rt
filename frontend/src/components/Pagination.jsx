import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, style }) {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 4) {
      end = 5;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
    }

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const showInfo = totalItems !== undefined && itemsPerPage !== undefined;
  const start = showInfo ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const end = showInfo ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className="datatable-pagination" style={{ marginTop: '32px', ...style }}>
      {showInfo && (
        <div className="datatable-pagination-info">
          Menampilkan {totalItems === 0 ? 0 : start}-{end} dari {totalItems} data
        </div>
      )}
      {totalPages > 1 && (
        <div className="datatable-pagination-buttons">
          <button 
            onClick={() => onPageChange(1)} 
            disabled={currentPage === 1}
            title="Halaman Pertama"
          >
            &laquo;
          </button>
          <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
            disabled={currentPage === 1}
            title="Sebelumnya"
          >
            ‹
          </button>
          
          {getPages().map((p, idx) => (
            <button 
              key={idx} 
              className={p === currentPage ? 'active' : ''} 
              onClick={() => p !== '...' && onPageChange(p)}
              disabled={p === '...'}
              style={p === '...' ? { cursor: 'default', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold' } : {}}
            >
              {p}
            </button>
          ))}
          
          <button 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
            disabled={currentPage === totalPages}
            title="Selanjutnya"
          >
            ›
          </button>
          <button 
            onClick={() => onPageChange(totalPages)} 
            disabled={currentPage === totalPages}
            title="Halaman Terakhir"
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
