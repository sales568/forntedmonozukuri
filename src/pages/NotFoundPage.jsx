import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="auth-layout">
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '6rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 'var(--space-4)' }}>
                    404
                </div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>Página no encontrada</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
                    La página que buscas no existe o ha sido movida.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                    Ir al Tablero
                </button>
            </div>
        </div>
    );
}
