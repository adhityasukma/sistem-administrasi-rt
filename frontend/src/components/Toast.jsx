import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiCheckCircle,
  HiXCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiXMark,
} from 'react-icons/hi2';
import './Toast.css';

const ToastContext = createContext(null);

const iconMap = {
  success: <HiCheckCircle />,
  error: <HiXCircle />,
  warning: <HiExclamationTriangle />,
  info: <HiInformationCircle />,
};

let toastId = 0;

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [toast.id, onRemove]);

  // Auto dismiss
  useState(() => {
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  });

  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
      <span className="toast-icon">{iconMap[toast.type] || iconMap.info}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={handleClose}>
        <HiXMark />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto remove after 3.3s (including exit animation)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3300);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
