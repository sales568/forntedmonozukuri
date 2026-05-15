import { useEffect, useState, useRef, useMemo } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Info, HelpCircle, AlertCircle, Play, Pause, Square, Plus, Activity, Monitor, Edit2, Trash2, Award, UserCheck } from 'lucide-react';

export default function ProductionOrdersPage() {
    const { user } = useAuth();
    const isOperator = user?.role === 'operario';
    const [orders, setOrders] = useState([]);
    const [operators, setOperators] = useState([]);
    const [skills, setSkills] = useState([]);
    const [operations, setOperations] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [inventory, setInventory] = useState([]);
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
    const [materialForm, setMaterialForm] = useState({ materialId: '', lotId: '', material: '', lotNumber: '', quantity: 1, unit: 'kg', stock: 0 });
    const [assignForm, setAssignForm] = useState({ operationId: '', operatorId: '', requiredSkillId: '', minLevel: 1 });
    const [competenceNote, setCompetenceNote] = useState('');
const filteredOperators = useMemo(() => {
    if (!assignForm.requiredSkillId) return operators;
    const minLvl = Number(assignForm.minLevel) || 0;
    
    // Filtro robusto: revisamos tanto us.skillId como us.skill.id por si la estructura varía
    const filtered = operators.filter(op => {
        const hasSkill = op.userSkills?.some(us => {
            const skillMatch = (us.skillId === assignForm.requiredSkillId) || (us.skill?.id === assignForm.requiredSkillId);
            const levelMatch = Number(us.level) >= minLvl;
            return skillMatch && levelMatch;
        });
        return hasSkill;
    });

    console.log('Filtrando operarios para skill:', assignForm.requiredSkillId, 'Mínimo:', minLvl);
    console.log('Operarios disponibles:', operators.length, 'Filtrados:', filtered.length);
    if (filtered.length === 0 && operators.length > 0) {
        console.warn('Advertencia: El filtro de skills está vaciando la lista. Revisa la estructura de op.userSkills de:', operators[0]);
    }
    
    return filtered;
}, [operators, assignForm.requiredSkillId, assignForm.minLevel]);

    useEffect(() => {
        if (selectedOrder && detailsRef.current) {
            detailsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedOrder]);

    useEffect(() => {
        if (isAssignOpen) {
            loadOrders();
        }
    }, [isAssignOpen]);

    const loadOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const [ordersRes, usersRes, skillsRes, invRes] = await Promise.all([
                apiClient.get('/production-orders'),
                apiClient.get('/labor'),
                apiClient.get('/competencies/skills'),
                apiClient.get('/inventory/materials'),
            ]);
            setOrders(ordersRes.data.items || []);
            setOperators(usersRes.data || []);
            setSkills(skillsRes.data || []);
            setInventory(invRes.data || []);
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
            setCompetenceNote(response.data.competence?.message || 'Asignación realizada.');
            setIsAssignOpen(false);
            await loadOrderDetails(selectedOrder);
        } catch (err) {
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
        if (status === 'pending') return <Badge variant="neutral">Pendiente</Badge>;
        if (status === 'in_progress') return <Badge variant="warning">En curso</Badge>;
        if (status === 'completed') return <Badge variant="success">Completada</Badge>;
        if (status === 'cancelled') return <Badge variant="danger">Cancelada</Badge>;
        return <Badge variant="neutral">{status}</Badge>;
    };

    const getStatusSemaphore = (produced, quantity) => {
        const prod = Number(produced) || 0;
        const target = Number(quantity) || 0;

        if (prod === 0) return (
            <Badge variant="neutral" className="font-black flex flex-col items-start gap-0.5">
                <span className="text-[9px] uppercase tracking-tighter opacity-70">Programada</span>
                <span className="text-[10px]">INICIO PENDIENTE</span>
            </Badge>
        );
        
        if (prod === target) return (
            <Badge variant="success" className="font-black flex flex-col items-start gap-0.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-tighter">
                    <Activity size={8} /> Finalizado
                </div>
                <span className="text-[10px]">LOTE COMPLETO</span>
            </Badge>
        );

        if (prod > target) return (
            <Badge variant="danger" className="font-black animate-pulse flex flex-col items-start gap-0.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-tighter">
                    <AlertCircle size={8} /> Alerta
                </div>
                <span className="text-[10px]">EXCEDIDO (+{prod - target})</span>
            </Badge>
        );
        
        const missing = target - prod;
        return (
            <Badge variant="warning" className="font-black flex flex-col items-start gap-0.5 border-amber-200/50">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-tighter">
                    <Play size={8} /> En curso
                </div>
                <span className="text-[10px]">FALTAN {missing}</span>
            </Badge>
        );
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Producción" subtitle="Gestión integral OT, operaciones, materiales y competencias">
                {!isOperator && <Button variant="primary" onClick={() => setIsNewOrderOpen(true)}>Nueva Orden</Button>}
            </PageHeader>

            {/* Asistente Gemba AI Potenciado - Producción */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-blue-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Activity size={32} className="text-blue-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Ingeniería Gemba AI</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Control de Flujo de Valor</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Gestión de Producción</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "Bienvenido al motor de ejecución de la planta. Aquí gestionamos la transformación de recursos en productos terminados. Las <strong>Órdenes de Trabajo (OT)</strong> son el documento maestro: sin ellas, perdemos la trazabilidad de materiales y el control de costos reales. Cada registro de avance que realizas alimenta el cálculo del cumplimiento del plan y asegura que el <strong>Lead Time</strong> prometido al cliente sea una realidad. ¡Mantén tus OT actualizadas para eliminar los cuellos de botella!"
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Importancia:</strong> Las OT garantizan la sincronización entre ventas, inventario y planta.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Objetivo:</strong> Maximizar el flujo y reducir el desperdicio de tiempo en cada operación.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Órdenes de producción">
                {loading ? (
                    <p className="text-muted">Cargando órdenes...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Orden</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Proceso/Op</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Cant.</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Prod.</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Estación</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Turno</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Operario</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                                    <th className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 group">
                                        <td className="px-2 font-black text-blue-600 py-3">{order.orderNumber}</td>
                                        <td className="px-2 font-bold text-slate-700 text-xs">{order.product}</td>
                                        <td className="px-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter truncate max-w-[100px]">Manufactura</span>
                                                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{order.currentOperation || 'Proceso General'}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 text-center font-bold text-slate-500">{order.quantity}</td>
                                        <td className="px-2 text-center">
                                            <span className={`font-black text-sm ${order.produced > order.quantity ? 'text-red-600' : 'text-slate-800'}`}>
                                                {order.produced}
                                            </span>
                                        </td>
                                        <td className="px-2">
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Monitor size={12} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase truncate max-w-[80px]">{order.line || 'Línea Central'}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 text-center">
                                            <Badge variant="info" className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-1.5 py-0.5">{order.shift || '1'}</Badge>
                                        </td>
                                        <td className="px-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-600 border border-indigo-200 shrink-0">
                                                    {order.assignedOperatorName?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[80px]">{order.assignedOperatorName || 'Pendiente'}</span>
                                            </div>
                                        </td>
                                        <td className="px-2">{getStatusSemaphore(order.produced, order.quantity)}</td>
                                        <td className="px-2 text-right">
                                            <div className="flex justify-end gap-1 items-center">
                                                <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50 text-[9px] px-1.5 py-1 h-auto" onClick={() => loadOrderDetails(order)}>VER DETALLE</Button>
                                                <Button variant="ghost" size="sm" className="text-indigo-600 font-black hover:bg-indigo-50 text-[9px] px-1.5 py-1 h-auto border border-indigo-100/50 bg-indigo-50/30" onClick={() => { setSelectedOrder(order); setIsLogOpen(true); }}>REGISTRAR</Button>
                                                {!isOperator && (
                                                    <div className="flex items-center gap-0.5 ml-1">
                                                        <Button variant="ghost" size="sm" className="text-amber-600 p-1 h-auto" title="Editar Orden" onClick={() => alert('La edición de Órdenes de Trabajo (OT) requiere confirmación del servidor. Función en desarrollo.')}><Edit2 size={12}/></Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600 p-1 h-auto" title="Eliminar Orden" onClick={() => alert('Función protegida por seguridad de planta.')}><Trash2 size={12}/></Button>
                                                    </div>
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
                        <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Proceso Actual</p>
                                <p className="text-sm font-bold text-purple-600">{selectedOrder.proceso || 'Manufactura General'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Operación</p>
                                <p className="text-sm font-bold text-slate-800">{selectedOrder.product}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Estación / Línea</p>
                                <p className="text-sm font-bold text-slate-600">{selectedOrder.line || 'Línea Central'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">Turno / Estado</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="neutral">{selectedOrder.shift || '1'}</Badge>
                                    {getStatusSemaphore(selectedOrder.produced, selectedOrder.quantity)}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Acciones de Ejecución</p>
                        <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                            <Button variant="ghost" size="sm" className="border border-slate-200" onClick={() => createTimeEvent('start')}>Iniciar</Button>
                            <Button variant="ghost" size="sm" className="border border-slate-200" onClick={() => createTimeEvent('pause')}>Pausar</Button>
                            <Button variant="ghost" size="sm" className="border border-slate-200" onClick={() => createTimeEvent('resume')}>Reanudar</Button>
                            <Button variant="ghost" size="sm" className="border border-slate-200 text-green-600" onClick={() => createTimeEvent('end')}>Finalizar</Button>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase">Cumplimiento del Plan</p>
                            <p className="text-lg font-black text-blue-700">{selectedOrder.produced} <span className="text-xs text-blue-400">/ {selectedOrder.quantity} UNIDADES</span></p>
                        </div>
                    </Card>

                    <Card title="Nota de competencia" description="Validación de habilidades para la OT">
                        <div className="space-y-4">
                            {competenceNote ? (
                                <div className={`p-4 rounded-xl border ${competenceNote.includes('NO habilitado') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${competenceNote.includes('NO habilitado') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Estado de Validación</p>
                                            <p className="text-sm font-bold leading-relaxed">{competenceNote}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <UserCheck size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Esperando asignación</p>
                                    <p className="text-xs text-slate-400 mt-1">Selecciona un operario para validar su competencia técnica.</p>
                                </div>
                            )}

                            {operations.some(op => op.customFields?.assignedOperatorName) && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Últimos Asignados</p>
                                    <div className="space-y-2">
                                        {operations.filter(op => op.customFields?.assignedOperatorName).map(op => (
                                            <div key={op.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">
                                                        {op.customFields.assignedOperatorName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-700">{op.customFields.assignedOperatorName}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium">{op.name}</p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">
                                                    Nivel {op.customFields.minLevel || 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Operaciones de la OT">
                        <div className="table-responsive">
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orden</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operación</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsable</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiempo Std</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operations.map((op) => (
                                        <tr key={op.id}>
                                            <td className="font-bold text-slate-400">{op.orderNumber}</td>
                                            <td className="font-bold text-slate-700">{op.name}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                        {op.customFields?.assignedOperatorName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-500">
                                                        {op.customFields?.assignedOperatorName || 'Sin asignar'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{statusBadge(op.status)}</td>
                                            <td className="font-bold text-slate-600">{op.standardTime || '-'} s</td>
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
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Código de la Orden</label>
                        <input className="form-input" placeholder="Ej: OT-GMC-2024-001" value={newOrder.orderNumber} onChange={(e) => setNewOrder((p) => ({ ...p, orderNumber: e.target.value }))} />
                        <p className="text-[9px] text-slate-400 italic">Identificador único de la orden de trabajo.</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto / Referencia</label>
                        <input className="form-input" placeholder="Nombre del producto a fabricar" value={newOrder.product} onChange={(e) => setNewOrder((p) => ({ ...p, product: e.target.value }))} />
                        <p className="text-[9px] text-slate-400 italic">Especifica el modelo o referencia exacta.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cantidad Planificada</label>
                            <input className="form-input" type="number" min="1" placeholder="100" value={newOrder.quantity} onChange={(e) => setNewOrder((p) => ({ ...p, quantity: e.target.value }))} />
                            <p className="text-[9px] text-slate-400 italic">Unidades totales a producir.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Línea de Producción</label>
                            <input className="form-input" placeholder="Ej: Línea A" value={newOrder.line} onChange={(e) => setNewOrder((p) => ({ ...p, line: e.target.value }))} />
                            <p className="text-[9px] text-slate-400 italic">Ubicación física en planta.</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turno Asignado</label>
                        <select className="form-input" value={newOrder.shift} onChange={(e) => setNewOrder((p) => ({ ...p, shift: e.target.value }))}>
                            <option value="">Selecciona Turno</option>
                            <option value="1">Turno 1 (Mañana)</option>
                            <option value="2">Turno 2 (Tarde)</option>
                            <option value="3">Turno 3 (Noche)</option>
                        </select>
                        <p className="text-[9px] text-slate-400 italic">Horario en el que se ejecutará la orden.</p>
                    </div>
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
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre de la Fase / Operación</label>
                        <input className="form-input" placeholder="Ej: Corte, Ensamble, Pintura" value={operationForm.name} onChange={(e) => setOperationForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción del Proceso</label>
                        <textarea className="form-input" placeholder="Detalles de la tarea..." value={operationForm.description} onChange={(e) => setOperationForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiempo Estándar (Segundos)</label>
                        <input className="form-input" type="number" placeholder="60" value={operationForm.standardTime} onChange={(e) => setOperationForm((p) => ({ ...p, standardTime: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isMaterialOpen}
                onClose={() => setIsMaterialOpen(false)}
                title={`Agregar material - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsMaterialOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createMaterial}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seleccionar Producto / Material</label>
                        <select 
                            className="form-input" 
                            value={materialForm.materialId} 
                            onChange={(e) => {
                                const mat = inventory.find(i => i.id === e.target.value);
                                if (mat) {
                                    const firstLot = mat.lots?.[0];
                                    setMaterialForm(p => ({ 
                                        ...p, 
                                        materialId: mat.id, 
                                        material: mat.name, 
                                        unit: mat.unit, 
                                        stock: mat.currentStock,
                                        lotId: firstLot?.id || '',
                                        lotNumber: firstLot?.lotNumber || `LOT-${mat.code}`
                                    }));
                                } else {
                                    setMaterialForm(p => ({ ...p, materialId: '', lotId: '', material: '', lotNumber: '', stock: 0 }));
                                }
                            }}
                        >
                            <option value="">-- Selecciona del inventario --</option>
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                            ))}
                        </select>
                        {inventory.length === 0 && (
                            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100 flex flex-col items-center gap-2">
                                <p className="text-[9px] text-amber-700 font-bold uppercase">Inventario Vacío</p>
                                <Button variant="ghost" size="sm" className="text-[9px] h-auto py-1 border border-amber-200" onClick={async () => {
                                    try {
                                        await apiClient.post('/inventory/seed');
                                        const res = await apiClient.get('/inventory/materials');
                                        setInventory(res.data);
                                    } catch (e) { alert('Error al cargar semillas'); }
                                }}>Cargar inventario demo</Button>
                            </div>
                        )}
                        {materialForm.materialId && (
                            <div className="flex justify-between items-center px-1 mt-1">
                                <p className="text-[9px] text-blue-500 font-bold uppercase">Stock Disponible: {materialForm.stock} {materialForm.unit}</p>
                                <p className="text-[9px] text-slate-400 italic">Unidad: {materialForm.unit}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lote Disponible</label>
                        <select 
                            className="form-input" 
                            value={materialForm.lotId} 
                            onChange={(e) => {
                                const selectedMat = inventory.find(i => i.id === materialForm.materialId);
                                const lot = selectedMat?.lots?.find(l => l.id === e.target.value);
                                if (lot) {
                                    setMaterialForm(p => ({ ...p, lotId: lot.id, lotNumber: lot.lotNumber, stock: lot.quantity }));
                                }
                            }}
                        >
                            <option value="">-- Selecciona el lote --</option>
                            {inventory.find(i => i.id === materialForm.materialId)?.lots?.map(lot => (
                                <option key={lot.id} value={lot.id}>{lot.lotNumber} (Stock: {lot.quantity})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cantidad a Descontar</label>
                            <input 
                                className="form-input" 
                                type="number" 
                                min="0.01" 
                                step="0.01" 
                                max={materialForm.stock}
                                placeholder="0.00" 
                                value={materialForm.quantity} 
                                onChange={(e) => setMaterialForm((p) => ({ ...p, quantity: e.target.value }))} 
                            />
                            {Number(materialForm.quantity) > materialForm.stock && (
                                <p className="text-[9px] text-red-500 font-bold mt-0.5">ALERTA: Cantidad excede el stock disponible.</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidad</label>
                            <input className="form-input bg-slate-50" readOnly value={materialForm.unit} />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isAssignOpen}
                onClose={() => setIsAssignOpen(false)}
                title={`Asignar operario con validación de competencia - ${selectedOrder?.orderNumber || ''}`}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Cerrar</Button><Button variant="secondary" onClick={() => validateCompetence()}>Validar</Button><Button variant="primary" onClick={assignOperator}>Asignar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fase / Operación</label>
                        <select className="form-input" value={assignForm.operationId} onChange={(e) => setAssignForm((p) => ({ ...p, operationId: e.target.value }))}>
                            <option value="">-- Selecciona la operación --</option>
                            {operations.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
                        </select>
                        <p className="text-[9px] text-slate-400 italic">Paso del proceso donde se asignará el personal.</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operario Responsable</label>
                        <select className="form-input" value={assignForm.operatorId} onChange={(e) => setAssignForm((p) => ({ ...p, operatorId: e.target.value }))}>
                            <option value="">-- Selecciona el empleado --</option>
                            {filteredOperators.map((op) => (<option key={op.id} value={op.id}>{op.name}</option>))}
                        </select>
                        <p className="text-[9px] text-slate-400 italic">Personal que ejecutará la tarea.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Habilidad (Skill) Crítica</label>
                            <select className="form-input" value={assignForm.requiredSkillId} onChange={(e) => setAssignForm((p) => ({ ...p, requiredSkillId: e.target.value }))}>
                                <option value="">Opcional: Skill Requerida</option>
                                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <p className="text-[9px] text-slate-400 italic">Competencia necesaria para validar.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nivel Mínimo (1-4)</label>
                            <input className="form-input" type="number" min="1" max="4" value={assignForm.minLevel} onChange={(e) => setAssignForm((p) => ({ ...p, minLevel: e.target.value }))} placeholder="1" />
                            <p className="text-[9px] text-slate-400 italic">Grado de maestría requerido.</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Resultado de Validación</p>
                        <div className="text-xs font-bold text-slate-600 italic">{competenceNote || 'Esperando validación de competencia...'}</div>
                    </div>
                    {assignForm.requiredSkillId && filteredOperators.length === 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500" />
                            <p className="text-[10px] font-bold text-red-600 uppercase">Sin operarios calificados para esta habilidad y nivel.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
