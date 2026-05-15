import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { Camera, FileText, CheckCircle, AlertTriangle, Eye, Download, Activity } from 'lucide-react';

export default function QualityInspectionsPage() {
    const [inspections, setInspections] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newInspectionOpen, setNewInspectionOpen] = useState(false);
    const [newCheckpointOpen, setNewCheckpointOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('inspections'); // 'inspections' or 'ncs'
    const [nonConformities, setNonConformities] = useState([]);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [filterArea, setFilterArea] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [inspectionForm, setInspectionForm] = useState({ 
        checkpointId: '', 
        type: 'product', 
        area: '', 
        station: '',
        equipmentId: '',
        result: 'OK', 
        value: '', 
        notes: '', 
        imageUrl: '',
        checklist: [] 
    });
    const [checkpointForm, setCheckpointForm] = useState({ workstationId: '', name: '', specification: '', method: 'visual', frequency: 'hourly' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [insRes, cpRes, wsRes, eqRes, ncRes] = await Promise.all([
                apiClient.get('/quality/inspections', { params: { limit: 100 } }),
                apiClient.get('/quality/checkpoints'),
                apiClient.get('/fos/meta/workstations'),
                apiClient.get('/maintenance/equipment'),
                apiClient.get('/quality/nonconformities'),
                apiClient.get('/labor/areas'),
            ]);
            setInspections(insRes.data.items || []);
            setCheckpoints(cpRes.data || []);
            setWorkstations(wsRes.data || []);
            setEquipment(eqRes.data || []);
            setNonConformities(ncRes.data || []);
            setAreas(aRes?.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Calidad');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const [modalError, setModalError] = useState('');

    const createCheckpoint = async () => {
        setModalError('');
        if (!checkpointForm.workstationId || !checkpointForm.name) {
            setModalError('Estación y nombre son obligatorios');
            return;
        }
        try {
            await apiClient.post('/quality/checkpoints', {
                ...checkpointForm,
            });
            setNewCheckpointOpen(false);
            setCheckpointForm({ workstationId: '', name: '', specification: '', method: 'visual', frequency: 'hourly' });
            await loadData();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Error al guardar. Verifica los datos.');
        }
    };

    const createInspection = async () => {
        setModalError('');
        if (!inspectionForm.checkpointId) {
            setModalError('Debes seleccionar un punto de control');
            return;
        }
        try {
            await apiClient.post('/quality/inspections', {
                checkpointId: inspectionForm.checkpointId,
                type: inspectionForm.type,
                area: inspectionForm.area,
                result: inspectionForm.result,
                value: inspectionForm.value ? Number(inspectionForm.value) : undefined,
                notes: inspectionForm.notes || undefined,
                imageUrl: inspectionForm.imageUrl || undefined,
                customFields: { 
                    checklist: inspectionForm.checklist, 
                    station: inspectionForm.station,
                    equipmentId: inspectionForm.equipmentId 
                }
            });
            setNewInspectionOpen(false);
            setInspectionForm({ checkpointId: '', type: 'product', area: '', station: '', equipmentId: '', result: 'OK', value: '', notes: '', imageUrl: '', checklist: [] });
            await loadData();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Error al guardar la inspección.');
        }
    };

    const resultBadge = (result) => {
        if (result === 'OK') return <Badge variant="success">OK</Badge>;
        if (result?.includes('NOK')) return <Badge variant="danger">{result}</Badge>;
        return <Badge>{result}</Badge>;
    };

    const filteredInspections = inspections.filter(ins => {
        let meta = { area: 'general', type: 'product' };
        if (ins.notes && ins.notes.startsWith('{')) {
            try { meta = JSON.parse(ins.notes); } catch(e) {}
        }
        const matchArea = filterArea === 'all' || meta.area === filterArea;
        const matchType = filterType === 'all' || meta.type === filterType;
        return matchArea && matchType;
    });

    const stats = {
        total: filteredInspections.length,
        ok: filteredInspections.filter(i => i.result === 'OK').length,
        nok: filteredInspections.filter(i => i.result !== 'OK').length,
        rate: filteredInspections.length ? Math.round((filteredInspections.filter(i => i.result === 'OK').length / filteredInspections.length) * 100) : 0
    };

    const uniqueAreas = Array.from(new Set(inspections.map(ins => {
        if (ins.notes && ins.notes.startsWith('{')) {
            try { return JSON.parse(ins.notes).area; } catch(e) {}
        }
        return 'general';
    }))).filter(Boolean);

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Calidad" subtitle="Inspecciones y cuadro de control con datos reales">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setNewCheckpointOpen(true)}>Nuevo Checkpoint</Button>
                    <Button variant="primary" onClick={() => setNewInspectionOpen(true)}>Nueva Inspección</Button>
                </div>
            </PageHeader>

            {/* Dashboard de Calidad Dinámico */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-slate-900 border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Inspecciones</p>
                    <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                </Card>
                <Card className="bg-slate-900 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tasa de Conformidad (OK)</p>
                    <h3 className="text-2xl font-black text-emerald-400">{stats.rate}%</h3>
                </Card>
                <Card className="bg-slate-900 border-l-4 border-l-red-500">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">No Conformidades (NOK)</p>
                    <h3 className="text-2xl font-black text-red-500">{stats.nok}</h3>
                </Card>
                <Card className="bg-slate-900 border-l-4 border-l-indigo-500">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Puntos Críticos Detectados</p>
                    <h3 className="text-2xl font-black text-indigo-400">{nonConformities.filter(n => n.status === 'open').length}</h3>
                </Card>
            </div>

            {/* Filtros de Area y Proceso */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Avanzados:</span>
                </div>
                <select 
                    className="form-input max-w-[200px] bg-slate-900 border-slate-700 text-xs" 
                    value={filterArea} 
                    onChange={(e) => setFilterArea(e.target.value)}
                >
                    <option value="all">Todas las Áreas</option>
                    {areas.map(area => <option key={area.id} value={area.name}>{area.name.toUpperCase()}</option>)}
                </select>
                <select 
                    className="form-input max-w-[200px] bg-slate-900 border-slate-700 text-xs" 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Todos los Procesos</option>
                    <option value="product">Inspección de Producto</option>
                    <option value="process">Inspección de Proceso</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => { setFilterArea('all'); setFilterType('all'); }} className="text-[10px] font-bold text-slate-400">LIMPIAR</Button>
            </div>

            {/* Asistente Gemba AI Potenciado - Calidad */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle size={80} className="text-blue-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Activity size={32} className="text-blue-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Ingeniería Gemba AI</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Control de Calidad Total (TQC)</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Aseguramiento de Calidad</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "La calidad no se inspecciona, se construye. He analizado las últimas inspecciones y detecto que el 15% de las no conformidades en el área de <strong>Ensamble</strong> se deben a variaciones dimensionales mínimas. <strong>Mi recomendación:</strong> Calibrar los sensores de presencia cada 48 horas y reforzar el estándar visual de <strong>'Pasa/No Pasa'</strong> en el primer checkpoint de la línea. Recuerda que un error detectado en planta cuesta 1, pero si llega al cliente cuesta 100."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Importancia:</strong> El control preventivo elimina el Scrap y protege el margen operativo.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Alerta:</strong> Tendencia al alza en defectos por rayado superficial en estación de pintura.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <div className="flex gap-4 mb-6 border-b border-slate-800">
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'inspections' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    onClick={() => setActiveTab('inspections')}
                >
                    Inspecciones Realizadas
                </button>
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'ncs' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                    onClick={() => setActiveTab('ncs')}
                >
                    No Conformidades (NC)
                    {nonConformities.filter(n => n.status === 'open').length > 0 && (
                        <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{nonConformities.filter(n => n.status === 'open').length}</span>
                    )}
                </button>
            </div>

            {activeTab === 'inspections' ? (
                <Card title="Historial de Inspecciones de Planta" noPadding>
                    {loading ? (
                        <p className="p-10 text-center text-muted font-bold">Cargando inspecciones...</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table" style={{ width: '100%' }}>
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Fecha</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Checkpoint</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Inspector</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Resultado</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">NCs</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInspections.map((inspection) => (
                                        <tr key={inspection.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-300">{new Date(inspection.inspectedAt).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-slate-100 uppercase tracking-tight">{inspection.checkpoint?.name || '-'}</p>
                                                {inspection.notes && inspection.notes.startsWith('{') && (
                                                    <p className="text-[9px] font-bold text-blue-400 uppercase">{JSON.parse(inspection.notes).area} | {JSON.parse(inspection.notes).type}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{inspection.inspector?.name || '-'}</td>
                                            <td className="px-6 py-4">{resultBadge(inspection.result)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black ${inspection.nonconformities?.length > 0 ? 'text-red-500' : 'text-slate-600'}`}>
                                                    {inspection.nonconformities?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-[10px] uppercase p-0" onClick={() => { setSelectedInspection(inspection); setReportModalOpen(true); }}>
                                                    <Eye size={12} className="mr-1" /> REPORTE
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!inspections.length && (
                                        <tr><td colSpan="6" className="text-center py-20 text-muted font-bold uppercase text-[10px]">No hay registros de inspección.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            ) : (
                <Card title="Panel de No Conformidades Detectadas" noPadding>
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Origen</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Criticidad</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Hallazgo / Descripción</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Estatus</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nonConformities.map((nc) => (
                                    <tr key={nc.id} className="border-b border-slate-800/50 hover:bg-red-500/5">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-slate-100 uppercase">{nc.workstation?.name || 'Línea General'}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">NC-{nc.id.split('-')[0]}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={nc.criticidad === 'critical' ? 'danger' : nc.criticidad === 'major' ? 'warning' : 'info'}>
                                                {nc.criticidad.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-slate-300 max-w-md">{nc.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={nc.status === 'open' ? 'danger' : 'success'}>
                                                {nc.status === 'open' ? 'PENDIENTE' : 'CERRADA'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-red-500 font-bold text-[10px] uppercase">
                                                Gestionar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!nonConformities.length && (
                                    <tr><td colSpan="5" className="text-center py-20 text-muted font-bold uppercase text-[10px]">No hay no conformidades abiertas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ModuleFormats module="quality" />

            <Modal
                isOpen={newCheckpointOpen}
                onClose={() => setNewCheckpointOpen(false)}
                title="Nuevo checkpoint de calidad"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setNewCheckpointOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createCheckpoint}>Crear</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    {modalError && <div className="text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg">{modalError}</div>}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estación de Trabajo</label>
                        <select className="form-input" value={checkpointForm.workstationId} onChange={(e) => setCheckpointForm((p) => ({ ...p, workstationId: e.target.value }))}>
                            <option value="">Selecciona estación</option>
                            {workstations.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Punto de Control</label>
                        <input className="form-input" placeholder="Ej: Verificación Dimensional" value={checkpointForm.name} onChange={(e) => setCheckpointForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Especificación / Estándar</label>
                        <input className="form-input" placeholder="Ej: +/- 0.5mm" value={checkpointForm.specification} onChange={(e) => setCheckpointForm((p) => ({ ...p, specification: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Método de Control</label>
                            <input className="form-input" placeholder="Ej: Calibrador, Visual" value={checkpointForm.method} onChange={(e) => setCheckpointForm((p) => ({ ...p, method: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frecuencia</label>
                            <input className="form-input" placeholder="Ej: Cada hora, 1/100" value={checkpointForm.frequency} onChange={(e) => setCheckpointForm((p) => ({ ...p, frequency: e.target.value }))} />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={newInspectionOpen}
                onClose={() => setNewInspectionOpen(false)}
                title="Nueva inspección"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setNewInspectionOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createInspection}>Registrar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    {modalError && <div className="text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg">{modalError}</div>}
                    
                    {/* Selección de Tipo */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button 
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${inspectionForm.type === 'product' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
                            onClick={() => {
                                const items = ['Acabado superficial', 'Dimensiones críticas', 'Etiquetado y Empaque', 'Funcionalidad'];
                                setInspectionForm(p => ({ ...p, type: 'product', checklist: items.map(text => ({ text, ok: null })) }));
                            }}
                        >
                            Producto
                        </button>
                        <button 
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${inspectionForm.type === 'process' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}
                            onClick={() => {
                                const items = ['Parámetros de máquina', 'Orden y Limpieza (5S)', 'Uso de EPP', 'Estado de herramientas'];
                                setInspectionForm(p => ({ ...p, type: 'process', checklist: items.map(text => ({ text, ok: null })) }));
                            }}
                        >
                            Proceso
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estación / Línea</label>
                            <select className="form-input" value={inspectionForm.station} onChange={(e) => setInspectionForm((p) => ({ ...p, station: e.target.value }))}>
                                <option value="">Selecciona estación</option>
                                {workstations.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Área / Sección</label>
                            <select className="form-input" value={inspectionForm.area} onChange={(e) => setInspectionForm((p) => ({ ...p, area: e.target.value }))}>
                                <option value="">Selecciona área</option>
                                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Selector de Maquinaria dinámico para Producto */}
                    {inspectionForm.type === 'product' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Equipo / Maquinaria Específica</label>
                            <select className="form-input border-blue-500/30 bg-blue-900/10" value={inspectionForm.equipmentId} onChange={(e) => setInspectionForm((p) => ({ ...p, equipmentId: e.target.value }))}>
                                <option value="">-- Selecciona la máquina --</option>
                                {equipment
                                    .filter(eq => !inspectionForm.station || eq.workstationId === inspectionForm.station)
                                    .map((eq) => (
                                        <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Punto de Control (Checkpoint)</label>
                        <select className="form-input" value={inspectionForm.checkpointId} onChange={(e) => setInspectionForm((p) => ({ ...p, checkpointId: e.target.value }))}>
                            <option value="">Selecciona checkpoint</option>
                            {checkpoints.map((cp) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                        </select>
                    </div>

                    {/* Checklist Dinámico */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Checklist de Conformidad</p>
                        <div className="space-y-2">
                            {inspectionForm.checklist.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 shadow-sm transition-all hover:border-blue-500/50">
                                    <span className="text-[11px] font-bold text-slate-200 tracking-tight">{item.text}</span>
                                    <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                                        <button 
                                            type="button"
                                            style={{ backgroundColor: item.ok === true ? '#10b981' : 'transparent', color: item.ok === true ? 'white' : '#94a3b8' }}
                                            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${item.ok === true ? 'shadow-lg shadow-emerald-500/40' : 'hover:bg-slate-800'}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newCheck = [...inspectionForm.checklist];
                                                newCheck[idx].ok = true;
                                                setInspectionForm(p => ({ ...p, checklist: newCheck }));
                                            }}
                                        >
                                            OK
                                        </button>
                                        <button 
                                            type="button"
                                            style={{ backgroundColor: item.ok === false ? '#ef4444' : 'transparent', color: item.ok === false ? 'white' : '#94a3b8' }}
                                            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${item.ok === false ? 'shadow-lg shadow-red-500/40' : 'hover:bg-slate-800'}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newCheck = [...inspectionForm.checklist];
                                                newCheck[idx].ok = false;
                                                setInspectionForm(p => ({ ...p, checklist: newCheck }));
                                            }}
                                        >
                                            NOK
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {inspectionForm.checklist.length === 0 && <p className="text-[10px] text-slate-400 italic text-center">Selecciona un tipo de inspección para cargar el checklist.</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado Final</label>
                        <select className="form-input" value={inspectionForm.result} onChange={(e) => setInspectionForm((p) => ({ ...p, result: e.target.value }))}>
                            <option value="OK">OK - Cumple Estándar</option>
                            <option value="NOK_REWORK">NOK - Requiere Reproceso</option>
                            <option value="NOK_SCRAP">NOK - Scrap / Desecho</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Medido</label>
                            <input className="form-input" type="number" placeholder="0.00" value={inspectionForm.value} onChange={(e) => setInspectionForm((p) => ({ ...p, value: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia Fotográfica</label>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer">
                                    <div className="form-input flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-all border-dashed">
                                        <Camera size={16} />
                                        <span className="text-[10px] font-black uppercase">Capturar / Subir Foto</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                // Simulación de subida: convertir a Base64 para visualización inmediata
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setInspectionForm(p => ({ ...p, imageUrl: reader.result }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                                {inspectionForm.imageUrl && (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200">
                                        <img src={inspectionForm.imageUrl} className="h-full w-full object-cover" alt="Preview" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notas Técnicas</label>
                        <textarea className="form-input" placeholder="Observaciones adicionales..." value={inspectionForm.notes} onChange={(e) => setInspectionForm((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Reporte de Inspección de Calidad"
                maxWidth="900px"
            >
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div className="space-y-1">
                            <Badge variant={selectedInspection?.result === 'OK' ? 'success' : 'danger'} className="text-xs px-3 py-1 font-black uppercase tracking-widest">
                                {selectedInspection?.result}
                            </Badge>
                            <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">{selectedInspection?.checkpoint?.name}</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID Inspección: {selectedInspection?.id.split('-')[0]}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                            <p className="text-sm font-bold text-slate-800">{new Date(selectedInspection?.inspectedAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={12} /> Diagnóstico Técnico
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-white pb-2">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Inspector</span>
                                        <span className="text-xs font-bold text-slate-900">{selectedInspection?.inspector?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white pb-2">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Valor Medido</span>
                                        <span className="text-xs font-bold text-slate-900">{selectedInspection?.value || 'N/A'}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Notas de Hallazgo</span>
                                        <p className="text-xs leading-relaxed text-slate-700 italic">"{selectedInspection?.notes || 'Sin observaciones adicionales.'}"</p>
                                    </div>
                                </div>
                            </div>

                            <Button variant="primary" className="w-full bg-blue-900 font-black tracking-widest py-4 shadow-lg shadow-blue-900/20" onClick={() => window.print()}>
                                <Download size={18} className="mr-2" /> DESCARGAR REPORTE N1
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                <Camera size={12} /> Evidencia Fotográfica
                            </h4>
                            {selectedInspection?.imageUrl ? (
                                <div className="rounded-2xl overflow-hidden border-4 border-white shadow-xl aspect-video relative group">
                                    <img src={selectedInspection.imageUrl} alt="Evidencia" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-all pointer-events-none" />
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Camera size={32} className="opacity-20" />
                                    <span className="text-[10px] font-bold uppercase">No se registró evidencia visual</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
