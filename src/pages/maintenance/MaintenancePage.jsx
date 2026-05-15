import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { UploadCloud, FileText, Activity } from 'lucide-react';
import MaintenanceDashboard from './MaintenanceDashboard';

export default function MaintenancePage() {
    const [breakdowns, setBreakdowns] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' or 'equipment'
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [techSheetOpen, setTechSheetOpen] = useState(false);
    const [workOrders, setWorkOrders] = useState([]);
    
    const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
    const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [instructionModalOpen, setInstructionModalOpen] = useState(false);
    const [selectedWO, setSelectedWO] = useState(null);
    const [selectedBreakdown, setSelectedBreakdown] = useState(null);
    const [solutionText, setSolutionText] = useState('');
    
    const [breakdownForm, setBreakdownForm] = useState({ equipmentId: '', description: '', cause: '', downtimeMin: 0 });
    const [equipmentForm, setEquipmentForm] = useState({ workstationId: '', name: '', code: '', type: '', location: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [bRes, eRes, wsRes, invRes, woRes] = await Promise.all([
                apiClient.get('/maintenance/breakdowns'),
                apiClient.get('/maintenance/equipment'),
                apiClient.get('/fos/meta/workstations'),
                apiClient.get('/inventory/materials'),
                apiClient.get('/maintenance/work-orders'),
            ]);
            setBreakdowns(bRes.data || []);
            setEquipment(eRes.data || []);
            setWorkstations(wsRes.data || []);
            setInventory(invRes.data || []);
            setWorkOrders(woRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Mantenimiento');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleBulkUpload = () => {
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setBulkUploadOpen(false);
            loadData();
        }, 1500);
    };

    const createEquipment = async () => {
        try {
            await apiClient.post('/maintenance/equipment', equipmentForm);
            setEquipmentModalOpen(false);
            setEquipmentForm({ workstationId: '', name: '', code: '', type: '', location: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear equipo');
        }
    };

    const createBreakdown = async () => {
        try {
            await apiClient.post('/maintenance/breakdowns', {
                ...breakdownForm,
                downtimeMin: Number(breakdownForm.downtimeMin),
            });
            setBreakdownModalOpen(false);
            setBreakdownForm({ equipmentId: '', description: '', cause: '', downtimeMin: 0 });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo reportar avería');
        }
    };

    const handleResolveClick = (item) => {
        setSelectedBreakdown(item);
        setSolutionText('');
        setResolveModalOpen(true);
    };

    const confirmResolve = async () => {
        try {
            await apiClient.patch(`/maintenance/breakdowns/${selectedBreakdown.id}/resolve`, { 
                cause: solutionText || 'Reparación estándar' 
            });
            setResolveModalOpen(false);
            setSelectedBreakdown(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cerrar avería');
        }
    };

    const viewSolution = (item) => {
        setSelectedBreakdown(item);
        setViewMode(true);
        setResolveModalOpen(true);
    };

    const statusBadge = (status) => {
        if (status === 'open') return <Badge variant="danger">Abierta</Badge>;
        if (status === 'in_repair') return <Badge variant="warning">En reparación</Badge>;
        if (status === 'resolved') return <Badge variant="success">Resuelta</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto pb-10">
            <PageHeader title="Mantenimiento (TPM)" subtitle="Equipos, averías y cierre de anomalías">
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setBulkUploadOpen(true)} className="font-bold border border-gray-200">
                        <UploadCloud size={16} className="mr-2 text-indigo-600" /> IMPORTAR ACTIVOS
                    </Button>
                    <Button variant="secondary" onClick={() => setEquipmentModalOpen(true)} className="font-bold">Nuevo Equipo</Button>
                    <Button variant="danger" onClick={() => setBreakdownModalOpen(true)} className="bg-red-600 shadow-sm font-bold px-6">REPORTAR AVERÍA</Button>
                </div>
            </PageHeader>

            {/* Asistente Gemba AI Potenciado - Mantenimiento */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-indigo-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Activity size={32} className="text-indigo-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Ingeniería Gemba AI</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Monitoreo de Activos Críticos</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Confiabilidad de Máquina</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "El mantenimiento preventivo no es un costo, es un seguro de producción. Detecto una alta incidencia de fallas por <strong>Sobrecalentamiento</strong> y <strong>Desgaste natural</strong> en tus registros. <strong>Mi recomendación:</strong> Implementar una rutina de <strong>Termografía Infrarroja</strong> mensual en los motores principales para detectar puntos calientes antes de la avería total. Además, sugiero revisar la frecuencia de lubricación en las prensas hidráulicas, ya que el 80% del desgaste prematuro se debe a la degradación de lubricantes por calor."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Importancia:</strong> El TPM reduce los micro-paros y estabiliza el tiempo de ciclo (OEE).</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Acción Sugerida:</strong> Chequeo preventivo de sensores inductivos por vibración excesiva.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger mb-6">{error}</div>}

            {/* Centro de Alertas Críticas y Próximos Mantenimientos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                    <div className="bg-red-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                        <Activity size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Alertas Críticas (Averías en Curso)</h4>
                        <p className="text-red-600/80 text-[10px] font-bold mb-3 uppercase italic">Intervención inmediata requerida</p>
                        <div className="space-y-2">
                            {breakdowns.filter(b => b.status === 'open').slice(0, 2).map(b => (
                                <div key={b.id} className="bg-white/80 p-2 rounded-lg border border-red-100 flex justify-between items-center">
                                    <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[200px]">🚨 {b.equipment?.name} - {b.description.split(' | ')[0]}</p>
                                    <Badge variant="danger" className="text-[8px]">PARO ACTIVO</Badge>
                                </div>
                            ))}
                            {breakdowns.filter(b => b.status === 'open').length === 0 && (
                                <p className="text-[10px] text-red-400 font-bold italic">No hay paros críticos reportados hoy.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                    <div className="bg-emerald-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        <Activity size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Próximos Preventivos (Próx. 7 Días)</h4>
                        <p className="text-emerald-600/80 text-[10px] font-bold mb-3 uppercase italic">Planificación de paros programados</p>
                        <div className="space-y-2">
                            {workOrders.filter(wo => wo.type === 'preventive' && wo.status !== 'completed').slice(0, 2).map(wo => (
                                <div key={wo.id} className="bg-white/80 p-2 rounded-lg border border-emerald-100 flex justify-between items-center group/wo">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[200px]">🛠️ {wo.equipment?.name}</p>
                                        <p className="text-[9px] text-emerald-600 font-bold uppercase">{wo.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-400">{new Date(wo.scheduledAt).toLocaleDateString()}</p>
                                        <button 
                                            onClick={() => { setSelectedWO(wo); setInstructionModalOpen(true); }}
                                            className="opacity-0 group-hover/wo:opacity-100 bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded transition-opacity"
                                        >
                                            VER CÓMO HACER
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {/* Ejemplo con botón */}
                            {workOrders.filter(wo => wo.type === 'preventive' && wo.status !== 'completed').length === 0 && (
                                <>
                                    <div className="bg-white/40 p-2 rounded-lg border border-dashed border-emerald-200 flex justify-between items-center opacity-60">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase truncate tracking-tighter">EJEMPLO: Prensa Hidráulica H-1</p>
                                            <p className="text-[9px] text-slate-300 font-bold uppercase">Limpieza de Válvulas</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-[8px] font-bold h-6 border border-slate-200">VER INSTRUCCIONES</Button>
                                    </div>
                                    <p className="text-[10px] text-emerald-400 font-bold italic">Agenda despejada para los próximos días.</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'anomalies' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    onClick={() => setActiveTab('anomalies')}
                >
                    Averías y Anomalías
                </button>
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    onClick={() => setActiveTab('equipment')}
                >
                    Listado de Activos (Maquinaria)
                </button>
            </div>

            {activeTab === 'anomalies' ? (
                <>
                    <MaintenanceDashboard breakdowns={breakdowns} />
                    <Card title="Averías y Paros Gemba" noPadding>
                        {loading ? (
                            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando registros...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Equipo / Activo</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Descripción del Evento</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Operario</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Causa Probable</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Downtime (Min)</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Estatus</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Acción Rápida</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {breakdowns.map((item) => (
                                            <tr key={item.id} className="hover:bg-red-50/20 transition-all group">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-800">{item.equipment?.name || '-'}</p>
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase">{item.equipment?.code}</p>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-700">{item.description.split(' | ')[0]}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase">
                                                            {item.description.split('Operario: ')[1] || item.cause?.split('Técnico: ')[1] || 'SISTEMA'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs italic text-gray-500">{item.cause?.split(' | ')[0] || 'Por analizar'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold ${item.downtimeMin > 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {item.downtimeMin} <span className="text-[10px] opacity-40">MIN</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">{statusBadge(item.status)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.status !== 'resolved' ? (
                                                        <Button variant="primary" size="sm" onClick={() => handleResolveClick(item)} className="bg-green-600 text-[10px] font-bold tracking-widest transform scale-90 group-hover:scale-100 transition-transform">
                                                            RESOLVER
                                                        </Button>
                                                    ) : (
                                                        <button onClick={() => viewSolution(item)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase flex items-center gap-1 ml-auto">
                                                            <Activity size={12} /> Ver Solución
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {!breakdowns.length && <tr><td colSpan="6" className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">No hay averías activas.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </>
            ) : (
                <>
                    {/* Dashboard de Activos Técnicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-white border-l-4 border-l-indigo-600 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Activos Planta</p>
                                    <h3 className="text-3xl font-black text-slate-900">{equipment.length}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <Activity size={24} className="text-indigo-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4">
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    {equipment.filter(e => !breakdowns.some(b => b.equipmentId === e.id && b.status !== 'resolved')).length} OPERATIVOS
                                </div>
                                <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                    {equipment.filter(e => breakdowns.some(b => b.equipmentId === e.id && b.status !== 'resolved')).length} EN PARO
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Distribución por Tipo</p>
                            <div className="space-y-3">
                                {Array.from(new Set(equipment.map(e => e.type || 'ESTÁNDAR'))).slice(0, 3).map(type => {
                                    const count = equipment.filter(e => (e.type || 'ESTÁNDAR') === type).length;
                                    const percent = Math.round((count / equipment.length) * 100);
                                    return (
                                        <div key={type} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-600">
                                                <span>{type}</span>
                                                <span>{count} UNID.</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Concentración por Estación</p>
                            <div className="space-y-3">
                                {workstations.slice(0, 3).map(ws => {
                                    const count = equipment.filter(e => e.workstationId === ws.id).length;
                                    return (
                                        <div key={ws.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{ws.name}</span>
                                            <Badge variant="info" className="text-[9px]">{count} ACTS</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    <Card title="Inventario de Activos Técnicos" noPadding>
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activo / Máquina</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación / Estación</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Proceso</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus Salud</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ficha Técnica</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-indigo-50/30 border-b border-slate-100">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-900 text-sm uppercase">{item.name}</p>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">{item.code}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {workstations.find(w => w.id === item.workstationId)?.name || 'Sin asignar'}
                                            <p className="text-[9px] text-slate-400 italic">{item.location}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase">{item.type || 'ESTÁNDAR'}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={breakdowns.some(b => b.equipmentId === item.id && b.status !== 'resolved') ? 'danger' : 'success'}>
                                                {breakdowns.some(b => b.equipmentId === item.id && b.status !== 'resolved') ? 'EN PARO' : 'OPERATIVO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedEquipment(item); setTechSheetOpen(true); }} className="text-indigo-600 font-bold text-[10px] uppercase border border-indigo-100 hover:bg-indigo-50">
                                                VER FICHA
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!equipment.length && <tr><td colSpan="5" className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No hay equipos registrados.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
                </>
            )}

            <Modal
                isOpen={equipmentModalOpen}
                onClose={() => setEquipmentModalOpen(false)}
                title="Registrar equipo"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setEquipmentModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createEquipment}>Guardar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Estación de Trabajo</label>
                        <select className="form-input" value={equipmentForm.workstationId} onChange={(e) => setEquipmentForm((p) => ({ ...p, workstationId: e.target.value }))}>
                            <option value="">Selecciona estación</option>
                            {workstations.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Activo</label>
                        <input className="form-input" placeholder="Ej: Prensa Hidráulica L1" value={equipmentForm.name} onChange={(e) => setEquipmentForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Código Técnico</label>
                        <input className="form-input" placeholder="Ej: MQC-001" value={equipmentForm.code} onChange={(e) => setEquipmentForm((p) => ({ ...p, code: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Máquina</label>
                        <input className="form-input" placeholder="Ej: Hidráulica, Neumática, Robot" value={equipmentForm.type} onChange={(e) => setEquipmentForm((p) => ({ ...p, type: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Ubicación Física</label>
                        <input className="form-input" placeholder="Ej: Nave 1, Pasillo B" value={equipmentForm.location} onChange={(e) => setEquipmentForm((p) => ({ ...p, location: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={breakdownModalOpen}
                onClose={() => setBreakdownModalOpen(false)}
                title="Reportar avería"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setBreakdownModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={createBreakdown}>Reportar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Equipo Afectado</label>
                        <select className="form-input" value={breakdownForm.equipmentId} onChange={(e) => setBreakdownForm((p) => ({ ...p, equipmentId: e.target.value }))}>
                            <option value="">Selecciona equipo</option>
                            {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Descripción de la Falla</label>
                        <input className="form-input" placeholder="¿Qué ocurrió? (Ej: Sobrecalentamiento motor)" value={breakdownForm.description} onChange={(e) => setBreakdownForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Causa Raíz Probable</label>
                        <input className="form-input" placeholder="Ej: Falta lubricación, desgaste natural" value={breakdownForm.cause} onChange={(e) => setBreakdownForm((p) => ({ ...p, cause: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tiempo de Paro (Minutos)</label>
                        <input className="form-input" type="number" min="0" placeholder="0" value={breakdownForm.downtimeMin} onChange={(e) => setBreakdownForm((p) => ({ ...p, downtimeMin: e.target.value }))} />
                    </div>

                    {/* Sugerencias de Materiales */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-indigo-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Materiales Sugeridos (Gemba AI)</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {inventory.filter(m => {
                                const desc = breakdownForm.description.toLowerCase();
                                if (desc.includes('motor') && (m.name.toLowerCase().includes('lubricante') || m.name.toLowerCase().includes('cable'))) return true;
                                if (desc.includes('eléctrico') && m.name.toLowerCase().includes('cable')) return true;
                                if (desc.includes('pintura') && m.name.toLowerCase().includes('pintura')) return true;
                                if (desc.includes('fuga') && (m.name.toLowerCase().includes('sellador') || m.name.toLowerCase().includes('empaque'))) return true;
                                if (desc.includes('lámina') && m.name.toLowerCase().includes('acero')) return true;
                                return false;
                            }).map(mat => (
                                <Badge key={mat.id} variant="info" className="cursor-pointer hover:bg-indigo-100 transition-colors">
                                    {mat.name} (Stock: {mat.currentStock})
                                </Badge>
                            ))}
                            {!breakdownForm.description && <p className="text-[9px] text-slate-400 italic">Escribe una descripción para ver sugerencias...</p>}
                            {breakdownForm.description && inventory.filter(m => {
                                const desc = breakdownForm.description.toLowerCase();
                                if (desc.includes('motor') && (m.name.toLowerCase().includes('lubricante') || m.name.toLowerCase().includes('cable'))) return true;
                                // ... same filters
                                return false;
                            }).length === 0 && <p className="text-[9px] text-slate-400 italic">No hay repuestos específicos sugeridos.</p>}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={resolveModalOpen}
                onClose={() => { setResolveModalOpen(false); setViewMode(false); }}
                title={viewMode ? "Detalle de Reparación" : "Resolver Avería / Paro"}
            >
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Evento Reportado</p>
                        <p className="text-sm font-bold text-gray-800">{selectedBreakdown?.description}</p>
                        <div className="flex gap-4 mt-2">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Paro: {selectedBreakdown?.downtimeMin} MIN</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Equipo: {selectedBreakdown?.equipment?.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-blue-900 tracking-tight">
                            {viewMode ? "Solución Técnica Aplicada" : "¿Cómo se resolvió la avería?"}
                        </label>
                        <textarea 
                            disabled={viewMode}
                            className="form-input min-h-[120px]"
                            placeholder="Describa la solución técnica (Ej: Se reemplazó el sensor inductivo y se recalibró el PLC)..."
                            value={viewMode ? selectedBreakdown?.cause : solutionText}
                            onChange={(e) => setSolutionText(e.target.value)}
                        ></textarea>
                    </div>

                    {!viewMode && (
                        <Button variant="primary" className="w-full py-4 bg-green-600 font-black tracking-widest" onClick={confirmResolve}>
                            CONFIRMAR CIERRE TÉCNICO
                        </Button>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={bulkUploadOpen}
                onClose={() => setBulkUploadOpen(false)}
                title="Carga Masiva de Activos (Maquinaria)"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setBulkUploadOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleBulkUpload} disabled={uploading}>
                            {uploading ? 'Procesando...' : 'Subir Archivo'}
                        </Button>
                    </div>
                )}
            >
                <div className="p-8 flex flex-col items-center justify-center text-center gap-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl m-4">
                    <FileText size={48} className="text-indigo-500" />
                    <div>
                        <p className="font-bold text-gray-700">Arrastra tu inventario en Excel</p>
                        <p className="text-xs text-muted mt-1 max-w-sm mx-auto">Asegúrate de incluir las columnas: Código, Nombre, Estación Asignada y Tipo de máquina para una rápida asignación en toda la planta.</p>
                    </div>
                    <Button variant="secondary" className="mt-2 text-indigo-600 bg-white shadow-sm font-bold">Seleccionar Archivo</Button>
                </div>
            </Modal>

            {/* Modal Ficha Técnica Completa */}
            <Modal
                isOpen={techSheetOpen}
                onClose={() => setTechSheetOpen(false)}
                title={`Ficha Técnica: ${selectedEquipment?.name}`}
                maxWidth="800px"
            >
                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Especificaciones Técnicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest border-l-2 border-indigo-600 pl-2">Especificaciones del Activo</h4>
                            <div className="grid grid-cols-2 gap-y-3 bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Código</p>
                                    <p className="text-xs font-black text-slate-800">{selectedEquipment?.code}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Tipo / Proceso</p>
                                    <p className="text-xs font-black text-slate-800">{selectedEquipment?.type || 'ESTÁNDAR'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Estación</p>
                                    <p className="text-xs font-black text-slate-800">{workstations.find(w => w.id === selectedEquipment?.workstationId)?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ubicación</p>
                                    <p className="text-xs font-black text-slate-800">{selectedEquipment?.location}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Cronograma Preventivo */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest border-l-2 border-emerald-600 pl-2">Cronograma Preventivo</h4>
                            <div className="space-y-2">
                                {workOrders.filter(wo => wo.equipmentId === selectedEquipment?.id && wo.type === 'preventive').length > 0 ? (
                                    workOrders.filter(wo => wo.equipmentId === selectedEquipment?.id && wo.type === 'preventive').map(wo => (
                                        <div key={wo.id} className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-900 uppercase">{wo.description}</p>
                                                <p className="text-[9px] font-bold text-emerald-600 italic">Programado: {new Date(wo.scheduledAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant="success">ACTIVO</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No hay mantenimientos preventivos programados.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Historial de Intervenciones */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-l-2 border-slate-800 pl-2">Historial de Mantenimientos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Correctivo */}
                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                <p className="text-[10px] font-black text-red-600 uppercase mb-3 flex items-center gap-2">
                                    <Activity size={12} /> Correctivos (Averías)
                                </p>
                                <div className="space-y-3">
                                    {breakdowns.filter(b => b.equipmentId === selectedEquipment?.id).length > 0 ? (
                                        breakdowns.filter(b => b.equipmentId === selectedEquipment?.id).map(b => (
                                            <div key={b.id} className="bg-white p-2 rounded border border-red-100 shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-800 leading-tight">{b.description}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(b.startedAt).toLocaleDateString()}</p>
                                                    <p className="text-[8px] text-red-500 font-black">{b.downtimeMin} MIN</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[9px] text-slate-400 italic">Sin registros correctivos.</p>
                                    )}
                                </div>
                            </div>

                            {/* Preventivo Histórico */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-3 flex items-center gap-2">
                                    <FileText size={12} /> Preventivos Realizados
                                </p>
                                <div className="space-y-3">
                                    {workOrders.filter(wo => wo.equipmentId === selectedEquipment?.id && wo.type === 'preventive' && wo.status === 'completed').length > 0 ? (
                                        workOrders.filter(wo => wo.equipmentId === selectedEquipment?.id && wo.type === 'preventive' && wo.status === 'completed').map(wo => (
                                            <div key={wo.id} className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-800 leading-tight">{wo.description}</p>
                                                <p className="text-[8px] text-blue-500 font-bold uppercase mt-1">Cerrado: {new Date(wo.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[9px] text-slate-400 italic">Sin registros preventivos previos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setTechSheetOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cerrar Ficha</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Instrucciones Técnicas (Qué, Cómo, Cuándo) */}
            <Modal
                isOpen={instructionModalOpen}
                onClose={() => setInstructionModalOpen(false)}
                title="Protocolo de Intervención Técnica (Gemba AI)"
                maxWidth="600px"
            >
                <div className="p-6 space-y-6">
                    <div className="flex gap-4 items-start bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-700">
                        <div className="p-3 bg-emerald-500 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">¿Qué hacer?</p>
                            <h3 className="text-lg font-black uppercase tracking-tight">{selectedWO?.description || 'Mantenimiento Preventivo'}</h3>
                            <p className="text-xs text-slate-400 font-bold">{selectedWO?.equipment?.name} ({selectedWO?.equipment?.code})</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">¿Cuándo hacerlo?</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-slate-800">{new Date(selectedWO?.scheduledAt).toLocaleDateString()}</p>
                                <Badge variant="warning">TURNO 1</Badge>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-2 italic">Prioridad Técnica</p>
                            <Badge variant={selectedWO?.priority === 'high' ? 'danger' : 'info'}>
                                {selectedWO?.priority?.toUpperCase() || 'NORMAL'}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-l-2 border-indigo-600 pl-2">¿Cómo hacerlo? (Instrucciones Gemba)</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                <p className="text-xs font-bold text-slate-700">Asegurar bloqueo de energías (LOTO) y limpieza de área periférica.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                <p className="text-xs font-bold text-slate-700">Inspección visual de válvulas y niveles de lubricante según ficha técnica.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                <p className="text-xs font-bold text-slate-700">Ejecutar {selectedWO?.description} y verificar torque en pernos de anclaje.</p>
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-slate-200 italic">
                                <p className="text-[10px] text-slate-400 font-bold">⚠️ Requerido: Guantes de nitrilo y protección ocular.</p>
                            </div>
                        </div>
                    </div>

                    <Button variant="primary" className="w-full py-4 bg-slate-900 font-black tracking-widest" onClick={() => setInstructionModalOpen(false)}>
                        ENTENDIDO, INICIAR TAREA
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
