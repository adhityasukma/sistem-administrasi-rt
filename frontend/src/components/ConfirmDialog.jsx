import Modal from './Modal';
import { HiExclamationTriangle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi2';

const icons = {
  warning: <HiExclamationTriangle style={{ fontSize: 40, color: 'var(--warning)' }} />,
  danger: <HiExclamationCircle style={{ fontSize: 40, color: 'var(--danger)' }} />,
  info: <HiInformationCircle style={{ fontSize: 40, color: 'var(--info)' }} />,
};

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  type = 'warning',
  confirmText = 'Ya',
  cancelText = 'Batal',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ marginBottom: 16 }}>{icons[type] || icons.warning}</div>
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
