/**
 * Reusable UI components for MVP MONOZUKURI
 * These are thin wrappers using the CSS design system classes.
 */

// === StatCard ===
export function StatCard({ icon: Icon, label, value, change, positive = true, color = 'blue' }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                {change && (
                    <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
                        {change}
                    </div>
                )}
            </div>
        </div>
    );
}

// === Badge ===
export function Badge({ children, variant = 'neutral' }) {
    return <span className={`badge badge-${variant}`}>{children}</span>;
}

// === Card ===
export function Card({ children, title, description, actions, className = '' }) {
    return (
        <div className={`card ${className}`}>
            {(title || actions) && (
                <div className="card-header">
                    <div>
                        {title && <h3 className="card-title">{title}</h3>}
                        {description && <p className="card-description">{description}</p>}
                    </div>
                    {actions}
                </div>
            )}
            {children}
        </div>
    );
}

// === Button ===
export function Button({ children, variant = 'primary', size = '', icon: Icon, disabled, onClick, type = 'button', className = '' }) {
    const sizeClass = size ? `btn-${size}` : '';
    return (
        <button
            className={`btn btn-${variant} ${sizeClass} ${className}`}
            disabled={disabled}
            onClick={onClick}
            type={type}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
}

// === EmptyState ===
export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="empty-state">
            {Icon && <Icon className="empty-state-icon" />}
            {title && <p className="empty-state-title">{title}</p>}
            {description && <p className="empty-state-description">{description}</p>}
            {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
        </div>
    );
}

// === Modal ===
export function Modal({ isOpen, onClose, title, children, actions, maxWidth = '600px' }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal animate-slide-up" style={{ maxWidth, width: '95%' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body-scroll">
                    {children}
                </div>
                {actions && <div className="modal-actions">{actions}</div>}
            </div>
        </div>
    );
}

// === PageHeader ===
export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="page-header flex items-center justify-between">
            <div>
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

// === SearchInput ===
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
    return (
        <div style={{ position: 'relative' }}>
            <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
            >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
                className="form-input"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ paddingLeft: '36px', width: '280px' }}
            />
        </div>
    );
}

// === ImagePicker ===
export function ImagePicker({ value, onChange, label, description, icon: Icon = null }) {
    const [preview, setPreview] = (typeof useState !== 'undefined' ? useState(value) : [value, () => {}]);
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                onChange(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="image-picker-container" style={{ marginBottom: 'var(--space-4)' }}>
            {label && <label className="form-label">{label}</label>}
            {description && <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-2)' }}>{description}</p>}
            
            <div 
                className="image-picker-preview" 
                onClick={() => document.getElementById(`file-input-${label}`).click()}
                style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--color-border)',
                    backgroundColor: 'var(--color-bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'border-color 0.2s'
                }}
            >
                {preview ? (
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted">
                        {Icon ? <Icon size={32} /> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>}
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Tocar para capturar o subir</span>
                    </div>
                )}
                <input 
                    id={`file-input-${label}`}
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}

// === StatusDot ===
export function StatusDot({ status }) {
    return <span className={`status-dot ${status}`} />;
}

// === Skeleton ===
export function Skeleton({ width = '100%', height = '20px' }) {
    return <div className="skeleton" style={{ width, height }} />;
}
