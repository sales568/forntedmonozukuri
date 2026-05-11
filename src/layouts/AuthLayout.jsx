export default function AuthLayout({ children }) {
    return (
        <div className="auth-layout">
            <div className="auth-card animate-fade-in">
                <div className="auth-logo">
                    <div className="auth-logo-icon">M</div>
                    <h1 className="auth-logo-title">MONOZUKURI</h1>
                    <p className="auth-logo-subtitle">Sistema de Producción</p>
                </div>
                {children}
            </div>
        </div>
    );
}
