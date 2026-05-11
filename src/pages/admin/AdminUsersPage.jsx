import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', password: '', roleId: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [usersRes, rolesRes] = await Promise.all([
                apiClient.get('/admin/users'),
                apiClient.get('/admin/roles'),
            ]);
            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
            if (!form.roleId && rolesRes.data?.[0]?.id) {
                setForm((prev) => ({ ...prev, roleId: rolesRes.data[0].id }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar administración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const createUser = async () => {
        try {
            await apiClient.post('/admin/users', form);
            setModalOpen(false);
            setForm({ email: '', name: '', password: '', roleId: roles[0]?.id || '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear usuario');
        }
    };

    return (
        <div>
            <PageHeader title="Administración de usuarios" subtitle="Gestión real de usuarios y roles">
                <Button variant="primary" onClick={() => setModalOpen(true)}>Nuevo usuario</Button>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Usuarios">
                {loading ? <p className="text-muted">Cargando usuarios...</p> : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Último acceso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role?.name || '-'}</td>
                                        <td>{user.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}</td>
                                        <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                                {!users.length && <tr><td colSpan="5" className="text-center text-muted">Sin usuarios.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Crear Nuevo Usuario"
                maxWidth="700px"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createUser}>Crear Usuario</Button>
                    </div>
                )}
            >
                <div className="flex flex-col gap-6 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-blue-400 uppercase">Nombre Completo</label>
                            <input className="form-input gemba-input" placeholder="Ej: Juan Pérez" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-blue-400 uppercase">Correo Electrónico</label>
                            <input className="form-input gemba-input" placeholder="usuario@empresa.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-blue-400 uppercase">Contraseña Temporal</label>
                            <input className="form-input gemba-input" placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-blue-400 uppercase">Rol Asignado</label>
                            <select className="form-input gemba-input" value={form.roleId} onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}>
                                {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
