import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';

export default function KaizenPage() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', area: '' });

    const loadSuggestions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/kaizen/suggestions');
            setSuggestions(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Kaizen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuggestions();
    }, []);

    const createSuggestion = async () => {
        try {
            await apiClient.post('/kaizen/suggestions', form);
            setModalOpen(false);
            setForm({ title: '', description: '', area: '' });
            await loadSuggestions();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear sugerencia');
        }
    };

    const statusBadge = (status) => {
        if (status === 'pending') return <Badge variant="warning">Pendiente</Badge>;
        if (status === 'reviewing') return <Badge variant="blue">En revisión</Badge>;
        if (status === 'implemented') return <Badge variant="success">Implementada</Badge>;
        if (status === 'rejected') return <Badge variant="danger">Rechazada</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div>
            <PageHeader title="Kaizen" subtitle="Sugerencias y mejora continua reales">
                <Button variant="primary" onClick={() => setModalOpen(true)}>Nueva sugerencia</Button>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Sugerencias">
                {loading ? <p className="text-muted">Cargando sugerencias...</p> : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Área</th>
                                    <th>Autor</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suggestions.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.title}</td>
                                        <td>{s.area || '-'}</td>
                                        <td>{s.author?.name || '-'}</td>
                                        <td>{statusBadge(s.status)}</td>
                                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {!suggestions.length && <tr><td colSpan="5" className="text-center text-muted">No hay sugerencias.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva sugerencia Kaizen"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createSuggestion}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <input className="form-input" placeholder="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                    <input className="form-input" placeholder="Área" value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
                    <textarea className="form-input" placeholder="Descripción" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
}
