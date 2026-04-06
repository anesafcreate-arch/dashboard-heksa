import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Confirm Dialog
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-body">
          <div className="confirm-dialog-body">
            <div className="confirm-dialog-icon">
              {variant === 'danger' ? '⚠️' : 'ℹ️'}
            </div>
            <h3 style={{ marginBottom: '8px' }}>{title}</h3>
            <p className="confirm-dialog-message">{message}</p>
            <div className="confirm-dialog-actions">
              <button className="btn-secondary" onClick={onClose}>{cancelText}</button>
              <button className={variant === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
