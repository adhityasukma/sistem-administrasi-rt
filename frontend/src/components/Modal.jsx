import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import './Modal.css';

const sizeMap = {
  sm: 'modal-sm',
  md: 'modal-md',
  lg: 'modal-lg',
  xl: 'modal-xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-content ${sizeMap[size] || sizeMap.md}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose} aria-label="Tutup">
              <HiXMark />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
