import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                {t('auth.login')}
            </h2>

            {error && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">{t('auth.email')}</label>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@monozukuri.app"
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('auth.password')}</label>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 'var(--space-4)' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Ingresando...' : t('auth.login')}
                </button>
            </form>

            {/* Test Credentials Helper */}
            <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🚀 Credenciales de Prueba
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-2)' }}>
                    <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-2)' }}
                        onClick={() => { setEmail('admin@monozukuri.app'); setPassword('password123'); }}
                    >
                        👑 Global Admin
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-2)' }}
                            onClick={() => { setEmail('admin@empresa-a.com'); setPassword('password123'); }}
                        >
                            🏭 Admin Empresa A
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-2)' }}
                            onClick={() => { setEmail('admin@empresa-b.com'); setPassword('password123'); }}
                        >
                            🚛 Admin Empresa B
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
