import { useEffect, useId } from 'react';

/* ---------------- Button ---------------- */
export function Button({ variant = 'primary', size, type = 'button', className = '', ...props }) {
  const classes = ['btn', `btn--${variant}`, size ? `btn--${size}` : '', className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...props} />;
}

/* ---------------- Campos de formulario ---------------- */
export function Field({ label, error, hint, children, full = false }) {
  return (
    <div className={`field ${full ? 'form-grid--full' : ''}`}>
      {label && <label className="field__label">{label}</label>}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export function Input({ label, error, hint, full, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`field ${full ? 'form-grid--full' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''}`}
        {...props}
      />
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, full, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`field ${full ? 'form-grid--full' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''}`}
        {...props}
      />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, options = [], placeholder, full, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={`field ${full ? 'form-grid--full' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatusBadge({ status, labels, tones }) {
  if (!status) return <span className="muted">-</span>;
  return <Badge tone={tones[status] || 'neutral'}>{labels[status] || status}</Badge>;
}

/* ---------------- Card ---------------- */
export function Card({ title, actions, children, flush = false }) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card__header">
          <h2>{title}</h2>
          {actions}
        </header>
      )}
      <div className={`card__body ${flush ? 'card__body--flush' : ''}`}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

/* ---------------- Feedback ---------------- */
export function Spinner({ label = 'Carregando' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" role="status" aria-label={label} />
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="empty-state__title">{title}</div>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Alert({ tone = 'info', children }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/* ---------------- Table ---------------- */
export function Table({ columns, rows, rowKey = (row) => row.id, empty }) {
  if (!rows || rows.length === 0) {
    return empty || <EmptyState title="Nenhum registro encontrado" />;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, title, onClose, children, footer, size }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size ? `modal--${size}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', onConfirm, onClose, busy }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
