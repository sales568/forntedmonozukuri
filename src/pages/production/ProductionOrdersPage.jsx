import { useEffect, useState, useRef } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Info, HelpCircle, AlertCircle, Play, Pause, Square, Plus } from 'lucide-react';

export default function ProductionOrdersPage() {
    const { user } = useAuth();
    const isOperator = user?.role === 'operario';
    const [orders, setOrders] = useState([]);
    const [operators, setOperators] = useState([]);
    const [skills, setSkills] = useState([]);
    const [operations, setOperations] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const detailsRef = useRef(null);

    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isOperationOpen, setIsOperationOpen] = useState(false);
    const [isMaterialOpen, setIsMaterialOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const [newOrder, setNewOrder] = useState({ orderNumber: '', product: '', quantity: 1, line: '', shift: '' });
    const [logForm, setLogForm] = useState({ quantity: 0, scrap: 0, downtime: 0, cause: '', notes: '' });
    const [operationForm, setOperationForm] = useState({ name: '', description: '', standardTime: 60 });
    const [materialForm, setMaterialForm] = useState({ material: '', lotNumber: '', quantity: 1, unit: 'kg' });
    const [assignForm, setAssignForm] = useState({ operationId: '', operatorId: '', requiredSkillId: '', minLevel: 1 });
    const [competenceNote, setCompetenceNote] = useState('');

    useEffect(() => {
        if (selectedOrder && detailsRef.current) {
            detailsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedOrder]);

    const loadOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const [ordersRes, usersRes, skillsRes] = await Promise.all([
                apiClient.get('/production-orders', { params: { limit: 100 } }),
                apiClient.get('/competencies/users'),
                apiClient.get('/competencies/skills'),
            ]);
            setOrders(ordersRes.data.items || []);
            setOperators(usersRes.data || []);
            setSkills(skillsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Producción');
        } finally {
            setLoading(false);
        }
    };

    const loadOrderDetails = async (order) => {
        setSelectedOrder(order);
        try {
            const [opsRes, matRes] = await Promise.all([
                apiClient.get(`/production-orders/${order.id}/operations`),
                apiClient.get(`/production-orders/${order.id}/materials`),
            ]);
            setOperations(opsRes.data || []);
            setMaterials(matRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar detalle de la orden');
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const createOrder = async () => {
        try {
            const response = await apiClient.post('/production-orders', {
                ...newOrder,
                quantity: Number(newOrder.quantity),
            });
            setIsNewOrderOpen(false);
            setNewOrder({ orderNumber: '', product: '', quantity: 1, line: '', shift: '' });
            await loadOrders();
            await loadOrderDetails(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear la orden');
        }
    };

    const submitLog = async () => {
        if (!selectedOrder) return;
        try {
            await apiClient.post(`/production-orders/${selectedOrder.id}/logs`, {
                quantity: Number(logForm.quantity),
                scrap: Number(logForm.scrap),
                downtime: Number(logForm.downtime),
                cause: logForm.cause || null,
                notes: logForm.notes || null,
            });
            setIsLogOpen(false);
            await loadOrders();
            await loadOrderDetails(selectedOrder);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo registrar avance');
        }
    };

    const createOperation = async () => {
        if (!selectedOrder) return;
        try {
            await apiClient.post(`/production-orders/${selectedOrder.id}/operations`, {
                name: operationForm.name,
                description: operationForm.description,
                standardTime: Number(operationForm.standardTime),
            });
            setIsOperationOpen(false);
            setOperationForm({ name: '', description: '', standardTime: 60 });
            await loadOrderDetails(selectedOrder);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear operación');
        }
    };

    const createMaterial = async () => {
        if (!selectedOrder) return;
        try {
            await apiClient.post(`/production-orders/${selectedOrder.id}/materials`, {
                ...materialForm,
                quantity: Number(materialForm.quantity),
            });
            setIsMaterialOpen(false);
            setMaterialForm({ material: '', lotNumber: '', quantity: 1, unit: 'kg' });
            await loadOrderDetails(selectedOrder);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo registrar material');
        }
    };

    const validateCompetence = async (override = null) => {
        if (!selectedOrder) return;
        const data = override || assignForm;
        if (!data.operatorId || !data.requiredSkillId) {
            setCompetenceNote('Selecciona operario y skill para validar competencia.');
            return;
        }
        try {
            const response = await apiClient.get(`/production-orders/${selectedOrder.id}/competence-note`, {
                params: {
                    operatorId: data.operatorId,
                    requiredSkillId: data.requiredSkillId,
                    minLevel: data.minLevel,
                },
            });
            setCompetenceNote(response.data.note);
        } catch (err) {
            setCompetenceNote(err.response?.data?.message || 'No se pudo validar competencia.');
        }
    };

    const assignOperator = async () => {
        if (!selectedOrder) return;
        try {
            const response = await apiClient.post(`/production-orders/${selectedOrder.id}/assign-operator`, {
                operationId: assignForm.operationId,
                operatorId: assignForm.operatorId,
                requiredSkillId: assignForm.requiredSkillId || undefined,
                minLevel: Number(assignForm.minLevel),
            });
            setCompetenceNote(response.data.competence?.message || '');
            await loadOrderDetails(selectedOrder);
        } catch (err) {
            setCompetenceNote(err.response?.data?.message || 'Asignación rechazada por competencia.');
            setError(err.response?.data?.message || 'No se pudo asignar operario');
        }
    };

    const createTimeEvent = async (type) => {
        if (!selectedOrder) return;
        try {
            await apiClient.post(`/production-orders/${selectedOrder.id}/time-events`, { type });
            await loadOrders();
            await loadOrderDetails(selectedOrder);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo registrar evento de tiempo');
        }
    };

    const statusBadge = (status) => {
        if (status === 'planned') return <Badge variant="neutral">Planificada</Badge>;
        if (status === 'in_progress') return <Badge variant="warning">En curso</Badge>;
        if (status === 'completed') return <Badge variant="success">Completada</Badge>;
        if (status === 'cancelled') return <Badge variant="danger">Cancelada</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Producción" subtitle="Gestión integral OT, operaciones, materiales y competencias">
                {!isOperator && <Button variant="primary" onClick={() => setIsNewOrderOpen(true)}>Nueva Orden</Button>}
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Órdenes de producción">
                {loading ? (
                    <p className="text-muted">Cargando órdenes...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Orden</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Producido</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.orderNumber}</td>
                                        <td>{order.product}</td>
                                        <td>{order.quantity}</td>
                                        <td>{order.produced}</td>
                                        <td>{statusBadge(order.status)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => loadOrderDetails(order)}>VER DETALLE</Button>
                                                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => { setSelectedOrder(order); setIsLogOpen(true); }}>REGISTRAR AVANCE</Button>
                                                {!isOperator && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="text-amber-600" title="Editar Orden"><Play size={14}/></Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600" title="Eliminar Orden" onClick={() => alert('Función de eliminación protegida por seguridad de planta.')}><Square size={14}/></Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!orders.length && <tr><td colSpan="6" className="text-center text-muted">No hay órdenes activas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {selectedOrder && (
                <div ref={detailsRef} style={{ marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    <Card title={`Detalle OT ${selectedOrder.orderNumber}`} description="Control de ejecución">
                        {!isOperator && (
                            <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                                <Button variant="secondary" size="sm" onClick={() => setIsOperationOpen(true)}>Agregar operación</Button>
                                <Button variant="secondary" size="sm" onClick={() => setIsMaterialOpen(true)}>Agregar material</Button>
                                <Button variant="primary" size="sm" onClick={() => setIsAssignOpen(true)}>Asignar operario</Button>
                            </div>
                        )}
                        <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                            <Button variant="ghost" size="sm" onClick={() => createTimeEvent('start')}>Iniciar</Button>
                            <Button variant="ghost" size="sm" onClick={() => createTimeEvent('pause')}>Pausar</Button>
                            <Button variant="ghost" size="sm" onClick={() => createTimeEvent('resume')}>Reanudar</Button>
                            <Button variant="ghost" size="sm" onClick={() => createTimeEvent('end')}>Finalizar</Button>
                        </div>
                        <p><strong>Estado:</strong> {selectedOrder.status}</p>
                        <p><strong>Línea:</strong> {selectedOrder.line || '-'}</p>
                        <p><strong>Turno:</strong> {selectedOrder.shift || '-'}</p>
                        <p><strong>Producción:</strong> {selectedOrder.produced} / {selectedOrder.quantity}</p>
                    </Card>

                    <Card title="Nota de competencia">
                        <p className="text-muted">
                            {competenceNote || 'Valida competencia antes de asignar para saber si el operario cumple nivel mínimo.'}
                        </p>
                    </Card>

                    <Card title="Operaciones de la OT">
                        <div className="table-responsive">
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Orden</th>
                                        <th>Operación</th>
                                        <th>Estado</th>
                                        <th>Tiempo estándar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operations.map((op) => (
                                        <tr key={op.id}>
                                            <td>{op.orderNumber}</td>
                                            <td>{op.name}</td>
                                            <td>{op.status}</td>
                                            <td>{op.standardTime || '-'} s</td>
                                        </tr>
                                    ))}
                                    {!operations.length && <tr><td colSpan="4" className="text-center text-muted">Sin operaciones.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Materiales consumidos">
                        <div className="table-responsive">
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Lote</th>
                                        <th>Cantidad</th>
                                        <th>Unidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map((m) => (
                                        <tr key={m.id}>
                                            <td>{m.material}</td>
                                            <td>{m.lotNumber}</td>
                                            <td>{m.quantity}</td>
                                            <td>{m.unit}</td>
                                        </tr>
                                    ))}
                                    {!materials.length && <tr><td colSpan="4" className="text-center text-muted">Sin materiales.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            <Modal
                isOpen={isNewOrderOpen}
                onClose={() => setIsNewOrderOpen(false)}
                title="Crear orden de producción"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsNewOrderOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createOrder}>Crear</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <input className="form-input" placeholder="Número de orden" value={newOrder.orderNumber} onChange={(e) => setNewOrder((p) => ({ ...p, orderNumber: e.target.value }))} />
                    <input className="form-input" placeholder="Producto" value={newOrder.product} onChange={(e) => setNewOrder((p) => ({ ...p, product: e.target.value }))} />
                    <input className="form-input" type="number" min="1" placeholder="Cantidad" value={newOrder.quantity} onChange={(e) => setNewOrder((p) => ({ ...p, quantity: e.target.value }))} />
                    <input className="form-input" placeholder="Línea" value={newOrder.line} onChange={(e) => setNewOrder((p) => ({ ...p, line: e.target.value }))} />
                    <input className="form-input" placeholder="Turno" value={newOrder.shift} onChange={(e) => setNewOrder((p) => ({ ...p, shift: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={isLogOpen}
                onClose={() => setIsLogOpen(false)}
                title={`Registrar avance - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsLogOpen(false)}>Cancelar</Button><Button variant="primary" onClick={submitLog}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cantidad producida (OK)</label>
                        <input className="form-input" type="number" min="0" placeholder="0" value={logForm.quantity} onChange={(e) => setLogForm((p) => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Unidades Scrap (Mala calidad)</label>
                        <input className="form-input" type="number" min="0" placeholder="0" value={logForm.scrap} onChange={(e) => setLogForm((p) => ({ ...p, scrap: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tiempo de Paro (Minutos)</label>
                        <input className="form-input" type="number" min="0" placeholder="0" value={logForm.downtime} onChange={(e) => setLogForm((p) => ({ ...p, downtime: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Causa del Paro (Si aplica)</label>
                        <input className="form-input" placeholder="Ej: Falla mecánica, falta material" value={logForm.cause} onChange={(e) => setLogForm((p) => ({ ...p, cause: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Observaciones del turno</label>
                        <textarea className="form-input" placeholder="Notas adicionales..." value={logForm.notes} onChange={(e) => setLogForm((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isOperationOpen}
                onClose={() => setIsOperationOpen(false)}
                title={`Agregar operación - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsOperationOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createOperation}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <input className="form-input" placeholder="Nombre operación" value={operationForm.name} onChange={(e) => setOperationForm((p) => ({ ...p, name: e.target.value }))} />
                    <textarea className="form-input" placeholder="Descripción" value={operationForm.description} onChange={(e) => setOperationForm((p) => ({ ...p, description: e.target.value }))} />
                    <input className="form-input" type="number" min="1" placeholder="Tiempo estándar (seg)" value={operationForm.standardTime} onChange={(e) => setOperationForm((p) => ({ ...p, standardTime: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={isMaterialOpen}
                onClose={() => setIsMaterialOpen(false)}
                title={`Agregar material - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsMaterialOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createMaterial}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <input className="form-input" placeholder="Material" value={materialForm.material} onChange={(e) => setMaterialForm((p) => ({ ...p, material: e.target.value }))} />
                    <input className="form-input" placeholder="Lote" value={materialForm.lotNumber} onChange={(e) => setMaterialForm((p) => ({ ...p, lotNumber: e.target.value }))} />
                    <input className="form-input" type="number" min="0.01" step="0.01" placeholder="Cantidad" value={materialForm.quantity} onChange={(e) => setMaterialForm((p) => ({ ...p, quantity: e.target.value }))} />
                    <input className="form-input" placeholder="Unidad" value={materialForm.unit} onChange={(e) => setMaterialForm((p) => ({ ...p, unit: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={isAssignOpen}
                onClose={() => setIsAssignOpen(false)}
                title={`Asignar operario con validación de competencia - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Cerrar</Button><Button variant="secondary" onClick={() => validateCompetence()}>Validar</Button><Button variant="primary" onClick={assignOperator}>Asignar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <select className="form-input" value={assignForm.operationId} onChange={(e) => setAssignForm((p) => ({ ...p, operationId: e.target.value }))}>
                        <option value="">Selecciona operación</option>
                        {operations.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
                    </select>
                    <select className="form-input" value={assignForm.operatorId} onChange={(e) => setAssignForm((p) => ({ ...p, operatorId: e.target.value }))}>
                        <option value="">Selecciona operario</option>
                        {operators.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
                    </select>
                    <select className="form-input" value={assignForm.requiredSkillId} onChange={(e) => setAssignForm((p) => ({ ...p, requiredSkillId: e.target.value }))}>
                        <option value="">Skill requerida</option>
                        {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input className="form-input" type="number" min="1" max="4" value={assignForm.minLevel} onChange={(e) => setAssignForm((p) => ({ ...p, minLevel: e.target.value }))} placeholder="Nivel mínimo requerido" />
                    <div className="text-muted">{competenceNote || 'Sin validación aún.'}</div>
                </div>
            </Modal>
        </div>
    );
}
