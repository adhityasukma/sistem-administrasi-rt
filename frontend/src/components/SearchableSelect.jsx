import { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiMagnifyingGlass } from 'react-icons/hi2';
import './SearchableSelect.css';

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div 
        className={`searchable-select-control ${error ? 'is-invalid' : ''} ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="searchable-select-value">
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </div>
        <HiChevronDown className={`searchable-select-arrow ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-menu animate-fade-in">
          <div className="searchable-select-search">
            <HiMagnifyingGlass className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="searchable-select-options">
            <div 
              className={`searchable-select-option ${!value ? 'selected' : ''}`}
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
            >
              {placeholder}
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.value}
                  className={`searchable-select-option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="option-label">{option.label}</div>
                </div>
              ))
            ) : (
              <div className="searchable-select-empty">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
