import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { Layout, ShieldCheck, History, AlertCircle, Activity } from 'lucide-react';

export default function SafetyPage() {
    const [audits, setAudits] = useState([]);
    const [referenceStates, setReferenceStates] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    
    const [auditForm, setAuditForm] = useState({ workstationId: '', area: '', department: '', responsible: '' });
    const [referenceForm, setReferenceForm] = useState({ workstationId: '', title: '', version: '', observations: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        console.log("Iniciando carga de datos de Seguridad...");
        
        try {
            // Cargas individuales para no bloquear
            const fetchAudits = async () => {
                try {
                    const res = await apiClient.get('/safety/audits-5s');
                    setAudits(res.data || []);
                } catch (e) { console.error("Error en Auditorias:", e); }
            };

            const fetchRefs = async () => {
                try {
                    const res = await apiClient.get('/safety/reference-states');
                    setReferenceStates(res.data || []);
                } catch (e) { console.error("Error en Estados:", e); }
            };

            const fetchWS = async () => {
                try {
                    const res = await apiClient.get('/safety/workstations');
                    setWorkstations(res.data || []);
                } catch (e) { console.error("Error en Puestos:", e); }
            };

            await Promise.allSettled([fetchAudits(), fetchRefs(), fetchWS()]);
            
        } catch (err) {
            console.error("Fallo crítico en loadData:", err);
            setError('DIAGNÓSTICO: Error en Sincronización Gemba');
        } finally {
            setLoading(false);
        }
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
            setReferenceForm({ workstationId: '', title: '', version: '', observations: '' });
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
        });
        setReferenceModalOpen(true);
    };

    return (
        <div className="w-full space-y-6">
            <PageHeader title="Seguridad y 5S" subtitle="Gestión de estándares y auditorías operativas">
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => { setEditingId(null); setViewMode(false); setReferenceForm({ workstationId: '', title: '', version: '', observations: '' }); setReferenceModalOpen(true); }}>
                        <Layout size={16} className="mr-2" /> Crear Estado de Referencia
                    </Button>
                    <Button variant="primary" onClick={() => setAuditModalOpen(true)}>
                        <ShieldCheck size={16} className="mr-2" /> Nueva Auditoría 5S
                    </Button>
                </div>
            </PageHeader>

            {/* Asistente Gemba AI Potenciado */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
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
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Módulo de Seguridad Industrial</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Excelencia Operativa</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "Bienvenido al núcleo de estandarización Monozukuri. Las <strong>Auditorías 5S</strong> son procesos sistemáticos de evaluación que garantizan la disciplina operativa y detectan desviaciones antes de que se conviertan en incidentes. El <strong>Estado de Referencia</strong> es tu 'Estándar de Oro'; define la condición ideal del puesto de trabajo y establece el alcance técnico para las auditorías competitivas. Juntos, estos pilares aseguran una planta organizada, segura y de alta eficiencia."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Alcance:</strong> Estandarización de todos los puestos UET y áreas operativas.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Propósito:</strong> Cero riesgos laborales y máxima optimización de flujos de trabajo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500">
                    <AlertCircle size={20} />
                    <span className="font-bold text-sm">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card title="Auditorías 5S" icon={<ShieldCheck size={18} className="text-blue-500" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="pb-3 px-4">Fecha / Hora</th>
                                    <th className="pb-3 px-4">Puesto</th>
                                    <th className="pb-3 px-4">Puntaje</th>
                                    <th className="pb-3 px-4">Auditor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {audits.map((a) => (
                                    <tr key={a.id} className="text-sm hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4">{new Date(a.createdAt).toLocaleString()}</td>
                                        <td className="py-3 px-4 font-medium">{a.workstation?.name || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.score >= 90 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {a.score}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">{a.user?.name || '-'}</td>
                                    </tr>
                                ))}
                                {!loading && audits.length === 0 && (
                                    <tr><td colSpan="4" className="py-10 text-center text-slate-500 italic">No se registran auditorías en este periodo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card title="Historial de Estados de Referencia" icon={<History size={18} className="text-purple-500" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="pb-3 px-4">Fecha</th>
                                    <th className="pb-3 px-4">Puesto de Trabajo</th>
                                    <th className="pb-3 px-4">Título del Estándar</th>
                                    <th className="pb-3 px-4">Versión</th>
                                    <th className="pb-3 px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {referenceStates.map((r) => (
                                    <tr key={r.id} className="text-sm hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 font-bold">{r.workstation?.name || '-'}</td>
                                        <td className="py-3 px-4">{r.findings?.title || '-'}</td>
                                        <td className="py-3 px-4"><Badge variant="blue">v{r.findings?.version || '01'}</Badge></td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-3">
                                                <button onClick={() => openReferenceEdit(r, true)} className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-tight transition-colors">Visualizar</button>
                                                <button onClick={() => openReferenceEdit(r, false)} className="text-amber-400 hover:text-amber-300 font-bold text-xs uppercase tracking-tight transition-colors">Editar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && referenceStates.length === 0 && (
                                    <tr><td colSpan="5" className="py-10 text-center text-slate-500 italic">Aún no se han definido estándares de referencia.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <ModuleFormats module="safety" />

            <Modal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} title="Nueva Auditoría 5S">
                <div className="p-4 space-y-4">
                    <select className="form-input" value={auditForm.workstationId} onChange={(e) => setAuditForm(p => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <input className="form-input" placeholder="Responsable" value={auditForm.responsible} onChange={(e) => setAuditForm(p => ({ ...p, responsible: e.target.value }))} />
                    <Button variant="primary" className="w-full" onClick={createAudit}>Guardar Auditoría</Button>
                </div>
            </Modal>

            <Modal isOpen={referenceModalOpen} onClose={() => setReferenceModalOpen(false)} title={viewMode ? "Consultar Estándar" : "Gestionar Estado de Referencia"}>
                <div className="p-4 space-y-4">
                    <select disabled={viewMode} className="form-input" value={referenceForm.workstationId} onChange={(e) => setReferenceForm(p => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <input disabled={viewMode} className="form-input" placeholder="Título del Estándar" value={referenceForm.title} onChange={(e) => setReferenceForm(p => ({ ...p, title: e.target.value }))} />
                    <input disabled={viewMode} className="form-input" placeholder="Versión" value={referenceForm.version} onChange={(e) => setReferenceForm(p => ({ ...p, version: e.target.value }))} />
                    <textarea disabled={viewMode} className="form-input" placeholder="Observaciones" value={referenceForm.observations} onChange={(e) => setReferenceForm(p => ({ ...p, observations: e.target.value }))} />
                    {!viewMode && <Button variant="primary" className="w-full" onClick={handleSaveReference}>Guardar Cambios</Button>}
                </div>
            </Modal>
        </div>
    );
}
