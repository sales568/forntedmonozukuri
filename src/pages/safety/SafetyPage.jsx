import { useEffect, useState, useMemo } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { Layout, ShieldCheck, History, AlertCircle, Activity, Briefcase, Info, Package, BarChart2, Clock, X, Filter, TrendingUp, TrendingDown } from 'lucide-react';

export default function SafetyPage() {
    const [audits, setAudits] = useState([]);
    const [referenceStates, setReferenceStates] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [areaReport, setAreaReport] = useState([]);
    const [traceability, setTraceability] = useState([]);
    const [traceWs, setTraceWs] = useState(null);
    const [traceModalOpen, setTraceModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('report');
    const [filterArea, setFilterArea] = useState('');
    const [filterWs, setFilterWs] = useState('');
    const [auditForm, setAuditForm] = useState({ workstationId: '', area: '', department: '', responsible: '' });
    const [referenceForm, setReferenceForm] = useState({ workstationId: '', title: '', version: '', observations: '', ergonomicsLevel: 'BAJO', epps: '', materials: '' });

    const uetAreas = useMemo(() => [...new Set(workstations.map(w => w.uet?.name).filter(Boolean))], [workstations]);
    const filteredWorkstations = useMemo(() => workstations.filter(w =>
        (!filterArea || w.uet?.name === filterArea) &&
        (!filterWs || w.name.toLowerCase().includes(filterWs.toLowerCase()))
    ), [workstations, filterArea, filterWs]);
    const filteredAudits = useMemo(() => audits.filter(a =>
        (!filterArea || workstations.find(w => w.id === a.workstationId)?.uet?.name === filterArea) &&
        (!filterWs || a.workstation?.name?.toLowerCase().includes(filterWs.toLowerCase()))
    ), [audits, filterArea, filterWs, workstations]);
    const filteredAreaReport = useMemo(() => areaReport.filter(r =>
        !filterArea || r.uetName === filterArea
    ), [areaReport, filterArea]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.allSettled([
                apiClient.get('/safety/audits-5s').then(r => setAudits(r.data || [])).catch(() => {}),
                apiClient.get('/safety/reference-states').then(r => setReferenceStates(r.data || [])).catch(() => {}),
                apiClient.get('/safety/workstations').then(r => setWorkstations(r.data || [])).catch(() => {}),
                apiClient.get('/safety/area-report').then(r => setAreaReport(r.data || [])).catch(() => {}),
            ]);
        } catch (err) {
            setError('Error en Sincronización Gemba');
        } finally {
            setLoading(false);
        }
    };

    const openTraceability = async (ws) => {
        setTraceWs(ws);
        setTraceModalOpen(true);
        try {
            const res = await apiClient.get(`/safety/traceability/${ws.id}`);
            setTraceability(res.data || []);
        } catch { setTraceability([]); }
    };

    useEffect(() => {
        loadData();
    }, []);

    const createAudit = async () => {
        try {
            await apiClient.post('/safety/audits-5s', {
                ...auditForm,
                checklist: [
                    { s: 'SEIRI', item: 'Orden del puesto', ok: true },
                    { s: 'SEITON', item: 'Ubicación definida', ok: true },
                    { s: 'SEISO', item: 'Limpieza', ok: true },
                    { s: 'SEIKETSU', item: 'Estandarización', ok: true },
                    { s: 'SHITSUKE', item: 'Disciplina', ok: true },
                ],
            });
            setAuditModalOpen(false);
            setAuditForm({ workstationId: '', area: '', department: '', responsible: '' });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear auditoría 5S');
        }
    };

    const handleSaveReference = async () => {
        try {
            if (editingId) {
                await apiClient.patch(`/safety/reference-states/${editingId}`, referenceForm);
            } else {
                await apiClient.post('/safety/reference-states', {
                    ...referenceForm,
                    visualControls: [],
                });
            }
            setReferenceModalOpen(false);
            setEditingId(null);
            setViewMode(false);
            setReferenceForm({ workstationId: '', title: '', version: '', observations: '', ergonomicsLevel: 'BAJO', epps: '', materials: '' });
            loadData();
        } catch (err) {
            setError('No se pudo guardar el registro');
        }
    };

    const openReferenceEdit = (record, view = false) => {
        setEditingId(record.id);
        setViewMode(view);
        setReferenceForm({
            workstationId: record.workstationId,
            title: record.findings?.title || '',
            version: record.findings?.version || '',
            observations: record.findings?.observations || '',
            ergonomicsLevel: record.findings?.ergonomicsLevel || 'BAJO',
            epps: record.findings?.epps || '',
            materials: record.findings?.materials || '',
        });
        setReferenceModalOpen(true);
    };

    return (
        <div className="w-full space-y-6">
            <PageHeader title="Seguridad y 5S" subtitle="Trazabilidad, cumplimiento y estándares por área operativa">
                <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" onClick={() => { setEditingId(null); setViewMode(false); setReferenceForm({ workstationId: '', title: '', version: '', observations: '', ergonomicsLevel: 'BAJO', epps: '', materials: '' }); setReferenceModalOpen(true); }}>
                        <Layout size={14} className="mr-1" /> Nuevo Estándar
                    </Button>
                    <Button variant="primary" onClick={() => setAuditModalOpen(true)}>
                        <ShieldCheck size={14} className="mr-1" /> Nueva Auditoría 5S
                    </Button>
                </div>
            </PageHeader>

            {/* Gemba AI Banner */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80} className="text-blue-500" /></div>
                <div className="flex gap-4 items-center relative z-10">
                    <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30"><Activity size={28} className="text-blue-400" /></div>
                    <div>
                        <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase">Gemba AI · Seguridad Industrial</Badge>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter mt-1">Trazabilidad y Cumplimiento 5S por Área</h2>
                        <p className="text-slate-400 text-xs mt-1">Monitorea el % de cumplimiento por UET, analiza la evolución histórica de cada puesto y asegura que los EPPs y estándares ergonómicos estén documentados en toda la planta.</p>
                    </div>
                </div>
            </Card>

            {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500"><AlertCircle size={18} /><span className="font-bold text-sm">{error}</span></div>}

            {/* Filter Bar */}
            <Card>
                <div className="flex flex-wrap gap-3 items-center">
                    <Filter size={16} className="text-slate-400" />
                    <select className="form-input w-auto" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
                        <option value="">Todas las Áreas / UET</option>
                        {uetAreas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <input className="form-input w-auto" placeholder="Buscar puesto..." value={filterWs} onChange={e => setFilterWs(e.target.value)} />
                    {(filterArea || filterWs) && (
                        <button onClick={() => { setFilterArea(''); setFilterWs(''); }} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700">
                            <X size={14} /> Limpiar filtros
                        </button>
                    )}
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-0">
                {[['report','Reporte por Área'],['traceability','Trazabilidad'],['summary','Resumen por Puesto']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* TAB: Reporte por Área */}
            {activeTab === 'report' && (
                <div className="space-y-4">
                    {filteredAreaReport.length === 0 && !loading && (
                        <Card><p className="text-center text-slate-400 italic py-8">No hay datos de área disponibles.</p></Card>
                    )}
                    {filteredAreaReport.map(area => (
                        <Card key={area.uetId}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-slate-800 text-base uppercase tracking-tight flex items-center gap-2">
                                        <BarChart2 size={18} className="text-blue-500" /> {area.uetName}
                                        <span className="text-xs font-bold text-slate-400 normal-case">{area.uetCode}</span>
                                    </h3>
                                    <div className="flex gap-4 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Puntaje Prom.</p>
                                            <p className={`text-xl font-black ${area.avgScore >= 90 ? 'text-green-600' : area.avgScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {area.avgScore ?? 'N/A'}{area.avgScore !== null ? '%' : ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Cobertura</p>
                                            <p className="text-xl font-black text-blue-600">{area.compliancePct}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Auditorías</p>
                                            <p className="text-xl font-black text-slate-700">{area.totalAudits}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Compliance bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                        <span>% Puestos auditados: {area.coveredWorkstations}/{area.workstationCount}</span>
                                        <span>{area.compliancePct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className={`h-3 rounded-full transition-all ${area.compliancePct >= 90 ? 'bg-green-500' : area.compliancePct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                                            style={{ width: `${area.compliancePct}%` }} />
                                    </div>
                                </div>
                                {/* Workstation breakdown */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {area.workstations.map(ws => (
                                        <div key={ws.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                                            <p className="text-[11px] font-black text-slate-700 uppercase truncate">{ws.name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-black ${ws.lastScore >= 90 ? 'text-green-600' : ws.lastScore >= 70 ? 'text-amber-500' : ws.lastScore !== null ? 'text-red-500' : 'text-slate-300'}`}>
                                                    {ws.lastScore !== null ? `${ws.lastScore}%` : 'Sin datos'}
                                                </span>
                                                <button onClick={() => openTraceability(workstations.find(w => w.id === ws.id) || ws)}
                                                    className="text-[9px] font-black text-blue-500 uppercase hover:underline">
                                                    Ver historial
                                                </button>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${ws.lastScore >= 90 ? 'bg-green-500' : ws.lastScore >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                    style={{ width: `${ws.lastScore ?? 0}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* TAB: Trazabilidad */}
            {activeTab === 'traceability' && (
                <Card title="Trazabilidad de Auditorías 5S" icon={<History size={18} className="text-purple-500" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="pb-3 px-4">Fecha</th>
                                    <th className="pb-3 px-4">Área / UET</th>
                                    <th className="pb-3 px-4">Puesto</th>
                                    <th className="pb-3 px-4">Tipo</th>
                                    <th className="pb-3 px-4">Puntaje</th>
                                    <th className="pb-3 px-4">Auditor</th>
                                    <th className="pb-3 px-4">Historial</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAudits.map(a => {
                                    const ws = workstations.find(w => w.id === a.workstationId);
                                    return (
                                        <tr key={a.id} className="text-sm hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3 px-4 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-xs font-bold text-indigo-600">{ws?.uet?.name || '-'}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800">{a.workstation?.name || '-'}</td>
                                            <td className="py-3 px-4"><Badge variant="blue" className="text-[9px]">Auditoría 5S</Badge></td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${a.score >= 90 ? 'bg-green-100 text-green-700' : a.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                                    {a.score}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 text-xs">{a.user?.name || '-'}</td>
                                            <td className="py-3 px-4">
                                                <button onClick={() => openTraceability(ws || { id: a.workstationId, name: a.workstation?.name })}
                                                    className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1">
                                                    <Clock size={12} /> Ver todo
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredAudits.length === 0 && (
                                    <tr><td colSpan="7" className="py-10 text-center text-slate-400 italic">No se registran auditorías. Aplica una para comenzar la trazabilidad.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* TAB: Resumen por Puesto */}
            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkstations.map(ws => {
                        const ref = referenceStates.find(r => r.workstationId === ws.id);
                        const lastAudit = audits.find(a => a.workstationId === ws.id);
                        return (
                            <Card key={ws.id} className={`border-l-4 ${lastAudit?.score >= 90 ? 'border-l-green-500' : lastAudit?.score >= 70 ? 'border-l-amber-400' : lastAudit ? 'border-l-red-400' : 'border-l-slate-300'}`}>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase">{ws.uet?.name}</p>
                                            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-1">
                                                <Briefcase size={14} className="text-blue-500" /> {ws.name}
                                            </h3>
                                        </div>
                                        <Badge variant={ref?.findings?.ergonomicsLevel === 'ALTO' ? 'danger' : ref?.findings?.ergonomicsLevel === 'MEDIO' ? 'warning' : 'success'}>
                                            Ergo: {ref?.findings?.ergonomicsLevel || 'N/A'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-start gap-2">
                                            <ShieldCheck size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">EPPs</p>
                                            <p className="text-xs text-slate-600">{ref?.findings?.epps || 'No definidos'}</p></div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Package size={13} className="text-amber-500 mt-0.5 shrink-0" />
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">Materiales</p>
                                            <p className="text-xs text-slate-600">{ref?.findings?.materials || 'Estándar'}</p></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Info size={13} className="text-slate-400 shrink-0" />
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Último 5S:</p>
                                                <span className={`text-xs font-black ${lastAudit?.score >= 90 ? 'text-green-600' : lastAudit?.score >= 70 ? 'text-amber-500' : lastAudit ? 'text-red-500' : 'text-slate-300'}`}>
                                                    {lastAudit ? `${lastAudit.score}%` : 'Sin auditoría'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex justify-between">
                                        <button onClick={() => openTraceability(ws)} className="text-[10px] font-black text-purple-600 uppercase hover:underline flex items-center gap-1">
                                            <Clock size={11} /> Trazabilidad
                                        </button>
                                        <button onClick={() => ref ? openReferenceEdit(ref, true) : null} className="text-[10px] font-black text-blue-600 uppercase hover:underline">
                                            Ver Estándar
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {filteredWorkstations.length === 0 && !loading && (
                        <p className="col-span-3 text-center text-slate-400 italic py-10">No hay puestos que coincidan con el filtro.</p>
                    )}
                </div>
            )}

            <ModuleFormats module="safety" />

            {/* Traceability Modal */}
            <Modal isOpen={traceModalOpen} onClose={() => setTraceModalOpen(false)} title={`Trazabilidad: ${traceWs?.name || ''}`}>
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {traceability.length === 0 && <p className="text-center text-slate-400 italic py-6">Sin registros de auditoría para este puesto.</p>}
                    {traceability.map((t, i) => (
                        <div key={t.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full mt-1 ${t.score >= 90 ? 'bg-green-500' : t.score >= 70 ? 'bg-amber-400' : t.status === 'reference_state' ? 'bg-blue-500' : 'bg-red-400'}`} />
                                {i < traceability.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                            </div>
                            <div className="pb-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-black text-slate-700">{t.status === 'reference_state' ? 'Estado de Referencia' : 'Auditoría 5S'}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleString()} · {t.user?.name}</p>
                                    </div>
                                    {t.status === 'completed' && (
                                        <span className={`text-sm font-black px-2 py-0.5 rounded-full ${t.score >= 90 ? 'bg-green-100 text-green-700' : t.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                            {t.score}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} title="Nueva Auditoría 5S">
                <div className="p-4 space-y-4">
                    <select className="form-input" value={auditForm.workstationId} onChange={(e) => setAuditForm(p => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map(w => <option key={w.id} value={w.id}>{w.uet?.name} › {w.name}</option>)}
                    </select>
                    <input className="form-input" placeholder="Responsable" value={auditForm.responsible} onChange={(e) => setAuditForm(p => ({ ...p, responsible: e.target.value }))} />
                    <Button variant="primary" className="w-full" onClick={createAudit}>Guardar Auditoría</Button>
                </div>
            </Modal>

            <Modal isOpen={referenceModalOpen} onClose={() => setReferenceModalOpen(false)} title={viewMode ? "Consultar Estándar" : "Gestionar Estado de Referencia"}>
                <div className="p-4 space-y-4">
                    <select disabled={viewMode} className="form-input" value={referenceForm.workstationId} onChange={(e) => setReferenceForm(p => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map(w => <option key={w.id} value={w.id}>{w.uet?.name} › {w.name}</option>)}
                    </select>
                    <input disabled={viewMode} className="form-input" placeholder="Título del Estándar" value={referenceForm.title} onChange={(e) => setReferenceForm(p => ({ ...p, title: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-4">
                        <input disabled={viewMode} className="form-input" placeholder="Versión" value={referenceForm.version} onChange={(e) => setReferenceForm(p => ({ ...p, version: e.target.value }))} />
                        <select disabled={viewMode} className="form-input" value={referenceForm.ergonomicsLevel} onChange={(e) => setReferenceForm(p => ({ ...p, ergonomicsLevel: e.target.value }))}>
                            <option value="BAJO">Ergonomía: BAJO</option>
                            <option value="MEDIO">Ergonomía: MEDIO</option>
                            <option value="ALTO">Ergonomía: ALTO</option>
                        </select>
                    </div>
                    <input disabled={viewMode} className="form-input" placeholder="EPPs Requeridos (coma separados)" value={referenceForm.epps} onChange={(e) => setReferenceForm(p => ({ ...p, epps: e.target.value }))} />
                    <input disabled={viewMode} className="form-input" placeholder="Materiales Críticos" value={referenceForm.materials} onChange={(e) => setReferenceForm(p => ({ ...p, materials: e.target.value }))} />
                    <textarea disabled={viewMode} className="form-input" placeholder="Observaciones Generales" value={referenceForm.observations} onChange={(e) => setReferenceForm(p => ({ ...p, observations: e.target.value }))} />
                    {!viewMode && <Button variant="primary" className="w-full" onClick={handleSaveReference}>Guardar Estándar de Puesto</Button>}
                </div>
            </Modal>
        </div>
    );
}
