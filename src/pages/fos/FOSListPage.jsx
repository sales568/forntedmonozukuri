import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { FileText, Plus, RefreshCw, Monitor, AlertCircle, Edit2, Eye, Layers, Trash2, Activity, List, Clock, Target, AlertTriangle, PenTool, Timer, Archive } from 'lucide-react';

export default function FOSListPage() {
    const [items, setItems] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFosContextId, setSelectedFosContextId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedFos, setSelectedFos] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState('');
    const [viewFos, setViewFos] = useState(null);
    const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);
    const [newProcessName, setNewProcessName] = useState('');
    const [form, setForm] = useState({
        code: '',
        nombreProceso: '',
        proceso: '',
        workstationId: '',
        estado: 'draft',
    });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [fosRes, wsRes] = await Promise.all([
                apiClient.get('/fos', { params: { limit: 100 } }).catch(err => {
                    console.error('Error fetching FOS:', err);
                    return { data: { items: [] } };
                }),
                apiClient.get('/fos/meta/workstations').catch(err => {
                    console.error('Error fetching workstations:', err);
                    return { data: [] };
                }),
            ]);

            setItems(fosRes.data?.items || []);
            setWorkstations(wsRes.data || []);
            const nextItems = fosRes.data?.items || [];
            if (!selectedFosContextId && nextItems.length) setSelectedFosContextId(nextItems[0].id);

            // Load processes from localStorage
            const stored = JSON.parse(localStorage.getItem('fos_processes') || '[]');
            setProcesses(stored);
        } catch (err) {
            console.error('General error in FOS loadData:', err);
            setError('Error de conexión con el servidor de estandarización.');
        } finally {
            setLoading(false);
        }
    };

    const createProcess = () => {
        if (!newProcessName.trim()) return;
        const updated = [...processes, { id: Date.now().toString(), name: newProcessName.trim() }];
        setProcesses(updated);
        localStorage.setItem('fos_processes', JSON.stringify(updated));
        setNewProcessName('');
    };

    const deleteProcess = (id) => {
        const updated = processes.filter(p => p.id !== id);
        setProcesses(updated);
        localStorage.setItem('fos_processes', JSON.stringify(updated));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateOpen = () => {
        setIsEditMode(false);
        setSelectedFos(null);
        setForm({ code: '', nombreProceso: '', proceso: '', workstationId: '', estado: 'draft' });
        setIsModalOpen(true);
    };

    const handleEditOpen = (fos) => {
        setIsEditMode(true);
        setSelectedFos(fos);
        setForm({
            code: fos.code,
            nombreProceso: fos.nombreProceso,
            proceso: fos.proceso || '',
            workstationId: fos.workstationId || fos.workstation?.id || '',
            estado: fos.estado || 'draft',
        });
        setIsModalOpen(true);
    };

    const handleViewOpen = async (fos) => {
        setIsViewOpen(true);
        setViewLoading(true);
        setViewError('');
        setViewFos(null);
        setSelectedVersionNumber(null);
        try {
            const res = await apiClient.get(`/fos/${fos.id}`);
            setViewFos(res.data);
            const latest = res.data?.versions?.[0]?.versionNumber ?? null;
            setSelectedVersionNumber(latest);
        } catch (err) {
            setViewError(err.response?.data?.message || 'No se pudo cargar el detalle de la FOS.');
        } finally {
            setViewLoading(false);
        }
    };

    const createFOS = async () => {
        if (!form.code || !form.nombreProceso || !form.workstationId) return;
        try {
            await apiClient.post('/fos', {
                code: form.code,
                nombreProceso: form.nombreProceso,
                proceso: form.proceso || undefined,
                workstationId: form.workstationId,
                estado: form.estado,
                foeData: {
                    metadatos: { proceso: form.proceso || form.nombreProceso },
                    etapas: [],
                    pie: {},
                },
                changelog: 'Creación inicial desde Gemba App',
            });
            setIsModalOpen(false);
            setForm({ code: '', nombreProceso: '', proceso: '', workstationId: '', estado: 'draft' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear la FOS.');
        }
    };

    const updateFOS = async () => {
        if (!selectedFos) return;
        try {
            await apiClient.patch(`/fos/${selectedFos.id}`, {
                code: form.code,
                nombreProceso: form.nombreProceso,
                proceso: form.proceso || undefined,
                workstationId: form.workstationId,
                estado: form.estado,
            });
            setIsModalOpen(false);
            setSelectedFos(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo actualizar la FOS.');
        }
    };

    const statusBadge = (status) => {
        const variants = {
            active: 'success',
            draft: 'neutral',
            review: 'warning'
        };
        const labels = {
            active: 'ACTIVO',
            draft: 'BORRADOR',
            review: 'EN REVISIÓN'
        };
        return <Badge variant={variants[status] || 'neutral'}>{labels[status] || status || 'N/D'}</Badge>;
    };

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto pb-10">
            <PageHeader title="Estandarización (FOS)" subtitle="Control de Fichas de Operación Estándar y Estándares de Planta">
                <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="font-bold border border-gray-200">
                        <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsProcessModalOpen(true)} className="font-bold border border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Layers size={14} className="mr-2" /> Gestionar Procesos
                    </Button>
                    <Button variant="primary" onClick={handleCreateOpen} className="bg-blue-600 shadow-sm px-6 font-bold">
                        <Plus size={16} className="mr-2" /> NUEVO ESTÁNDAR FOS
                    </Button>
                </div>
            </PageHeader>

            {/* Asistente Gemba AI Potenciado - FOS */}
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
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Estandarización de Operaciones</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Fichas de Operación Estándar (FOS)</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "Bienvenido al núcleo del conocimiento de la planta. Aquí documentamos la mejor forma conocida de hacer el trabajo. Las <strong>Fichas de Operación Estándar (FOS)</strong> son la base de la mejora continua y el entrenamiento de operarios. Sin estándares, no hay mejora posible. Mantén tus FOS actualizadas para asegurar la calidad y la seguridad operativa en cada estación del Gemba."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Importancia:</strong> Las FOS garantizan la repetibilidad del proceso y son la línea base para auditorías.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Objetivo:</strong> Eliminar la variabilidad, reducir errores y facilitar la capacitación de nuevos talentos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger mb-6 flex items-center gap-3">
                <AlertCircle size={18} /> {error}
            </div>}

            <Card noPadding>
                {loading ? (
                    <div className="p-20 text-center">
                        <RefreshCw className="animate-spin mx-auto text-blue-600 mb-4 opacity-50" size={40} />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando Gemba...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Código</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Proceso</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Operación</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Estación Gemba</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Versión</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Estado</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((fos) => (
                                    <tr
                                        key={fos.id}
                                        className="hover:bg-blue-50/40 transition-all group cursor-pointer"
                                        onClick={() => handleViewOpen(fos)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">
                                                {fos.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {fos.proceso ? (
                                                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-tight">
                                                    <Layers size={11} /> {fos.proceso}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs italic">Sin proceso</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800 text-sm">{fos.nombreProceso}</p>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Editado hace 2 días</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Monitor size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-600">{fos.workstation?.name || 'No asignada'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-900">v{fos.versionActual}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {statusBadge(fos.estado)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-[10px] tracking-widest text-blue-600"
                                                    onClick={(e) => { e.stopPropagation(); handleEditOpen(fos); }}
                                                >
                                                    <Edit2 size={12} className="mr-1" /> EDITAR
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-[10px] tracking-widest text-gray-500"
                                                    onClick={(e) => { e.stopPropagation(); handleViewOpen(fos); }}
                                                >
                                                    <Eye size={12} className="mr-1" /> VER
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!items.length && !loading && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-20 bg-gray-50/50">
                                            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sin registros base</p>
                                            <p className="text-gray-400 text-sm mt-1">Configure su primer estándar para habilitar el Gemba.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="mt-6">
                <Card className="border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400">Contexto de registro</div>
                            <div className="text-sm font-bold text-gray-800">Selecciona el estándar (FOS) para guardar y consultar el historial</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Uso rápido: 1) Selecciona un FOS. 2) En “Formatos N1” selecciona un formato (se muestra a la derecha). 3) Haz clic en `ABRIR` o `DILIGENCIAR`.
                                4) Presiona `GUARDAR REGISTRO`. 5) El resultado queda en el panel derecho `Vista / Historial` para ese FOS.
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                className="form-input gemba-input"
                                value={selectedFosContextId}
                                onChange={(e) => setSelectedFosContextId(e.target.value)}
                                style={{ minWidth: 320 }}
                            >
                                <option value="">-- Seleccione un FOS --</option>
                                {items.map((fos) => (
                                    <option key={fos.id} value={fos.id}>{fos.code} - {fos.nombreProceso}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>
            </div>

            <ModuleFormats
                module="fos"
                context={{
                    fosId: selectedFosContextId || null,
                    fosCode: items.find((i) => i.id === selectedFosContextId)?.code || null,
                }}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? "Editar Estándar Operativo" : "Crear Nuevo Estándar Operativo (FOS)"}
                maxWidth="600px"
            >
                <div className="p-6 flex flex-col gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Código Único del Estándar</label>
                        <input
                            className="form-input gemba-input"
                            placeholder="Ej: FOS-ENS-001"
                            value={form.code}
                            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                        />
                        <p className="text-[9px] text-slate-400 italic">Identificador alfanumérico para control documental.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Macro-Proceso</label>
                            <select
                                className="form-input gemba-input"
                                value={form.proceso}
                                onChange={(e) => setForm((prev) => ({ ...prev, proceso: e.target.value }))}
                            >
                                <option value="">-- Selecciona Proceso --</option>
                                {processes.map((p) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-[9px] text-slate-400 italic">Categoría general del trabajo.</p>
                                <button type="button" className="text-[9px] text-purple-600 font-bold hover:underline" onClick={() => setIsProcessModalOpen(true)}>
                                    + CONFIGURAR
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Nombre de la Operación</label>
                            <input
                                className="form-input gemba-input"
                                placeholder="Ej: Ensamble de Chasis"
                                value={form.nombreProceso}
                                onChange={(e) => setForm((prev) => ({ ...prev, nombreProceso: e.target.value }))}
                            />
                            <p className="text-[9px] text-slate-400 italic">Tarea específica que se estandariza.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Estación de Trabajo (Gemba)</label>
                            <select
                                className="form-input gemba-input"
                                value={form.workstationId}
                                onChange={(e) => setForm((prev) => ({ ...prev, workstationId: e.target.value }))}
                            >
                                <option value="">-- Selecciona Puesto --</option>
                                {workstations.map((ws) => (
                                    <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-slate-400 italic">Lugar físico donde se ejecuta.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Ciclo de Vida / Estado</label>
                            <select
                                className="form-input gemba-input font-bold"
                                value={form.estado}
                                onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
                                style={{
                                    backgroundColor: form.estado === 'active' ? '#f0fdf4' : form.estado === 'review' ? '#fffbeb' : '#f8fafc',
                                    color: form.estado === 'active' ? '#166534' : form.estado === 'review' ? '#92400e' : '#475569'
                                }}
                            >
                                <option value="draft">BORRADOR (En edición)</option>
                                <option value="review">EN REVISIÓN (Por Ingeniería)</option>
                                <option value="active">ACTIVO (Uso en Planta)</option>
                            </select>
                            <p className="text-[9px] text-slate-400 italic">Nivel de madurez del documento.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={isEditMode ? updateFOS : createFOS}
                            className="bg-blue-600 px-8 font-bold"
                        >
                            {isEditMode ? 'Guardar Cambios' : 'Crear FOS'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                title="Detalle del Estándar (FOS)"
                maxWidth="1100px"
                actions={(
                    <div className="flex gap-2">
                        {viewFos && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setIsViewOpen(false);
                                    handleEditOpen(viewFos);
                                }}
                                className="bg-blue-600 font-bold"
                            >
                                Editar
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
                    </div>
                )}
            >
                <div className="p-6">
                    {viewLoading ? (
                        <p className="text-muted">Cargando detalle...</p>
                    ) : viewError ? (
                        <div className="alert alert-danger">{viewError}</div>
                    ) : viewFos ? (
                        <div className="flex flex-col gap-6">
                            {/* TOP: Resumen general y Controles de versión */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border border-gray-100 bg-gray-50/50">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-400">Resumen del Estándar</div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-semibold uppercase">Proceso:</span>
                                            <span className="text-sm font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{viewFos.proceso || 'Sin asignar'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-semibold uppercase">Operación:</span>
                                            <span className="text-sm font-bold text-gray-800">{viewFos.nombreProceso}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-semibold uppercase">Estación:</span>
                                            <span className="text-xs font-bold text-gray-600">{viewFos.workstation?.name || 'N/D'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span className="text-xs text-gray-500 font-semibold uppercase">Estado Actual:</span>
                                            {statusBadge(viewFos.estado)}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border border-gray-100">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-400">Selección de Versión</div>
                                    <div className="mt-4">
                                        <select 
                                            className="form-input gemba-input w-full font-bold text-blue-600 bg-blue-50/30"
                                            value={selectedVersionNumber || ''}
                                            onChange={(e) => setSelectedVersionNumber(Number(e.target.value))}
                                        >
                                            {(viewFos.versions || []).map(v => (
                                                <option key={v.id} value={v.versionNumber}>Versión v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})</option>
                                            ))}
                                        </select>
                                        <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                            Mostrando los datos de la versión seleccionada. Usa el historial abajo para más detalles.
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* MIDDLE: Contenido de la versión (Steps, Tools, etc) */}
                            <Card className="border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-400">Desarrollo Operativo (v{selectedVersionNumber})</div>
                                </div>
                                
                                {(() => {
                                    const versionData = (viewFos.versions || []).find((v) => v.versionNumber === selectedVersionNumber)?.data;
                                    if (!versionData) return <div className="text-[11px] bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-400 text-center font-bold">No hay datos seleccionados</div>;

                                    const steps = versionData.etapas || versionData.steps || [];
                                    const tools = versionData.tools || versionData.herramientas || [];
                                    const taktTime = versionData.taktTime || versionData.tiempoCiclo || null;
                                    const metadatos = versionData.metadatos || {};

                                    return (
                                        <div className="space-y-6 animate-fade-in bg-white" style={{ maxHeight: 600, overflow: 'auto' }}>
                                            
                                            {/* Cabecera Adicional: Tools y TaktTime */}
                                            {(tools.length > 0 || taktTime) && (
                                                <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                    {taktTime && (
                                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                                <Timer size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Takt Time / Ciclo</div>
                                                                <div className="text-sm font-black text-gray-800">{taktTime}s</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {tools.length > 0 && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                <PenTool size={12} /> Herramientas y Equipos Necesarios
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {tools.map((t, i) => (
                                                                    <span key={i} className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-md shadow-sm">
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pasos / Etapas */}
                                            <div>
                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <List size={16} className="text-blue-500" /> Secuencia de la Operación
                                                </h4>
                                                {steps.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {steps.map((step, idx) => (
                                                            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors">
                                                                <div className="flex flex-col md:flex-row gap-4">
                                                                    {/* Número y Tiempo */}
                                                                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-2 md:w-28 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-3 md:pb-0 md:pr-4">
                                                                        <div className="bg-blue-50 text-blue-600 font-black text-xl w-10 h-10 rounded-lg flex items-center justify-center border border-blue-100">
                                                                            {step.step || step.numero || (idx + 1)}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md text-xs font-bold border border-gray-100">
                                                                            <Clock size={12} /> {step.time || step.tiempo || step.duracion || 0}s
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Contenido principal */}
                                                                    <div className="flex-1 space-y-3">
                                                                        <div>
                                                                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tarea Principal</div>
                                                                            <div className="text-sm font-bold text-gray-800 mt-0.5">{step.task || step.descripcion || step.tarea || 'Sin descripción'}</div>
                                                                        </div>
                                                                        
                                                                        {(step.keyPoints || step.puntosClave || step.puntos_clave) && (
                                                                            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                                                                                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1">
                                                                                    <Target size={12} /> Puntos Clave
                                                                                </div>
                                                                                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{step.keyPoints || step.puntosClave || step.puntos_clave}</div>
                                                                            </div>
                                                                        )}

                                                                        {(step.safety || step.seguridad || step.calidad) && (
                                                                            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                                                                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                                                                                    <AlertTriangle size={12} /> Seguridad / Calidad
                                                                                </div>
                                                                                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{step.safety || step.seguridad || step.calidad}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                                                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">Sin pasos registrados</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Datos Adicionales (Fallback final solo para campos no mapeados) */}
                                            {(() => {
                                                const residualData = Object.fromEntries(Object.entries(versionData).filter(([k]) => !['steps', 'etapas', 'metadatos', 'pie', 'tools', 'herramientas', 'taktTime', 'tiempoCiclo'].includes(k)));
                                                if(Object.keys(residualData).length > 0) {
                                                    return (
                                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                                            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1"><Archive size={12}/> Metadatos Adicionales</div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                                {Object.entries(residualData).map(([k, v]) => (
                                                                    <div key={k}>
                                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{k}</div>
                                                                        <div className="text-sm font-semibold text-gray-800 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    );
                                })()}
                            </Card>

                            {/* BOTTOM: Historial de versiones */}
                            <Card className="border border-gray-100">
                                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Historial de versiones y Cambios</div>
                                <div className="mt-4 flex flex-col gap-2">
                                    {(viewFos.versions || []).map((v) => (
                                        <button
                                            key={v.id}
                                            className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between ${selectedVersionNumber === v.versionNumber ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-300/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                            onClick={() => setSelectedVersionNumber(v.versionNumber)}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black ${selectedVersionNumber === v.versionNumber ? 'text-blue-600' : 'text-gray-700'}`}>v{v.versionNumber}</span>
                                                    <span className="text-xs text-gray-400 font-semibold">{new Date(v.createdAt).toLocaleString()}</span>
                                                </div>
                                                {v.changelog && <div className="text-sm text-gray-600 mt-1 font-medium">{v.changelog}</div>}
                                            </div>
                                            {selectedVersionNumber === v.versionNumber && (
                                                <Badge variant="info" className="bg-blue-100 text-blue-700">Versión Visible</Badge>
                                            )}
                                        </button>
                                    ))}
                                    {!viewFos.versions?.length && (
                                        <div className="text-sm text-gray-500 p-4 border border-dashed rounded-xl text-center">Sin versiones registradas.</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </Modal>

            {/* Modal Gestión de Procesos */}
            <Modal
                isOpen={isProcessModalOpen}
                onClose={() => setIsProcessModalOpen(false)}
                title="Gestionar Procesos"
                maxWidth="560px"
            >
                <div className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                className="form-input gemba-input flex-1"
                                placeholder="Nombre del proceso (Ej: Ensamble, Pintura...)"
                                value={newProcessName}
                                onChange={(e) => setNewProcessName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createProcess()}
                            />
                            <Button variant="primary" onClick={createProcess} className="bg-purple-600 font-bold px-5">
                                <Plus size={16} />
                            </Button>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">Añade macro-categorías para organizar tus fichas FOS.</p>
                    </div>

                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                        {processes.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <Layers size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No hay procesos creados aún</p>
                            </div>
                        )}
                        {processes.map((p) => (
                            <div key={p.id} className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 group">
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-purple-500" />
                                    <span className="text-sm font-bold text-purple-800">{p.name}</span>
                                </div>
                                <button onClick={() => deleteProcess(p.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => setIsProcessModalOpen(false)}>Cerrar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
