import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';

export default function AdminPlantsPage() {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setOrderEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', nit: '', address: '', country: 'Colombia', currency: 'COP', timezone: 'America/Bogota' });

    const loadPlants = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/admin/plants');
            setPlants(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudieron cargar las empresas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlants();
    }, []);

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                await apiClient.patch(`/admin/plants/${editingId}`, form);
            } else {
                await apiClient.post('/admin/plants', form);
            }
            setModalOpen(false);
            resetForm();
            await loadPlants();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo procesar la solicitud');
        }
    };

    const resetForm = () => {
        setForm({ name: '', code: '', nit: '', address: '', country: 'Colombia', currency: 'COP', timezone: 'America/Bogota' });
        setIsEditing(false);
        setOrderEditingId(null);
    };

    const openEdit = (plant) => {
        setForm({
            name: plant.name,
            code: plant.code,
            nit: plant.nit || '',
            address: plant.address || '',
            country: plant.country || 'Colombia',
            currency: plant.currency || 'COP',
            timezone: plant.timezone || 'America/Bogota'
        });
        setOrderEditingId(plant.id);
        setIsEditing(true);
        setModalOpen(true);
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Gestión de Empresas (Modelo Colombia)" subtitle="Administración central de NITs y Tenants">
                <Button variant="primary" onClick={() => { resetForm(); setModalOpen(true); }}>Nueva Empresa</Button>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Empresas Registradas">
                {loading ? <p className="text-muted">Cargando...</p> : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Nombre / NIT</th>
                                    <th>Código</th>
                                    <th>Ubicación</th>
                                    <th>Usuarios</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plants.map((plant) => (
                                    <tr key={plant.id}>
                                        <td>
                                            <div className="flex flex-col">
                                                <strong>{plant.name}</strong>
                                                <span className="text-xs text-muted">NIT: {plant.nit || 'No asignado'}</span>
                                            </div>
                                        </td>
                                        <td><Badge variant="neutral">{plant.code}</Badge></td>
                                        <td>{plant.country} - {plant.address || '-'}</td>
                                        <td>{plant._count?.users || 0}</td>
                                        <td>{plant.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Inactiva</Badge>}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(plant)}>Editar</Button>
                                        </td>
                                    </tr>
                                ))}
                                {!plants.length && <tr><td colSpan="6" className="text-center text-muted">Sin empresas registradas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={isEditing ? "Editar Empresa" : "Registrar Nueva Empresa"}
                maxWidth="1000px"
                actions={(
                    <div className="flex gap-3 p-4">
                        <Button variant="ghost" size="lg" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" size="lg" className="px-12 font-black" onClick={handleSubmit}>{isEditing ? "Guardar Cambios" : "Registrar Empresa"}</Button>
                    </div>
                )}
            >
                <div className="flex flex-col gap-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Nombre de la Empresa</label>
                            <input className="gemba-input" placeholder="Ej: Aceros S.A.S" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">NIT / ID Tributario</label>
                            <input className="gemba-input" placeholder="900.000.000-1" value={form.nit} onChange={(e) => setForm((p) => ({ ...p, nit: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Código Tenant (ID Único)</label>
                            <input className="gemba-input" disabled={isEditing} placeholder="Ej: ACE-01" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">País de Operación</label>
                            <input className="gemba-input" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="gemba-label">Dirección de la Planta</label>
                        <input className="gemba-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
