import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        plantId: '00000000-0000-0000-0000-000000000000', // Sample UUID, usually selectable
        roleId: '00000000-0000-0000-0000-000000000000'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            await register(formData);
            setSuccess('Usuario registrado con éxito. Puede iniciar sesión.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Error al registrar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                Registro de Usuario
            </h2>

            {error && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('auth.email')}</label>
                    <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('auth.password')}</label>
                    <input
                        type="password"
                        name="password"
                        className="form-input"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        minLength="8"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 'var(--space-4)' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Registrando...' : 'Registrar'}
                </button>
            </form>
        </div>
    );
}
