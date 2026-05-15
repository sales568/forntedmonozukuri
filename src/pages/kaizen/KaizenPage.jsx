import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { Sparkles, CheckCircle2, XCircle, Clock, Lightbulb, TrendingUp, Target, Activity } from 'lucide-react';

export default function KaizenPage() {
    const [suggestions, setSuggestions] = useState([]);
    const [aiProposals, setAiProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [areas, setAreas] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', area: '' });

    const loadSuggestions = async () => {
        setLoading(true);
        setError('');
        try {
            const [res, aRes] = await Promise.all([
                apiClient.get('/kaizen/suggestions'),
                apiClient.get('/labor/areas')
            ]);
            setSuggestions(res.data || []);
            setAreas(aRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Kaizen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuggestions();
    }, []);

    const createSuggestion = async (data) => {
        try {
            await apiClient.post('/kaizen/suggestions', data || form);
            setModalOpen(false);
            setAiModalOpen(false);
            setForm({ title: '', description: '', area: '' });
            await loadSuggestions();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear sugerencia');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await apiClient.patch(`/kaizen/suggestions/${id}/review`, { status });
            await loadSuggestions();
        } catch (err) {
            setError('No se pudo actualizar el estado');
        }
    };

    const getAiProposals = async () => {
        setAiLoading(true);
        try {
            const res = await apiClient.get('/kaizen/ai-proposals');
            setAiProposals(res.data || []);
            setAiModalOpen(true);
        } catch (err) {
            setError('Error al conectar con el motor de IA');
        } finally {
            setAiLoading(false);
        }
    };

    const statusBadge = (status) => {
        if (status === 'pending') return <Badge variant="warning">Pendiente</Badge>;
        if (status === 'reviewing') return <Badge variant="blue">En revisión</Badge>;
        if (status === 'approved' || status === 'implemented') return <Badge variant="success">Aprobada</Badge>;
        if (status === 'rejected') return <Badge variant="danger">Rechazada</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div>
            <PageHeader title="Mejora Continua" subtitle="Sugerencias y proyectos de optimización">
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        onClick={getAiProposals} 
                        disabled={aiLoading}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                        <Sparkles size={16} className={`mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                        {aiLoading ? 'Analizando...' : 'Sugerencias IA'}
                    </Button>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>Nueva sugerencia</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            {/* Asistente Gemba AI Potenciado - Mejora Continua */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Lightbulb size={80} className="text-yellow-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <Sparkles size={32} className="text-yellow-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Motor de Innovación</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Análisis de Ideas y Sugerencias</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Mejora Continua (Kaizen)</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "He analizado el buzón de sugerencias. Noto una tendencia recurrente sobre ajustes de parámetros en la línea de Extrusión. <strong>Mi recomendación:</strong> Consolidar las 3 ideas relacionadas en un solo proyecto PHVA y asignar a un líder técnico. Además, la tasa de implementación actual es del 45%; propongo revisar el comité de evaluación para agilizar la aprobación de ideas de bajo costo y alto impacto (Quick Wins)."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <TrendingUp size={14} className="text-emerald-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Adopción:</strong> 12 ideas implementadas este trimestre.</p>
                            </div>
                            <div className="flex gap-3">
                                <Activity size={14} className="text-blue-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Participación:</strong> 35% del personal activo.</p>
                            </div>
                            <div className="flex gap-3">
                                <Target size={14} className="text-yellow-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Pendientes:</strong> {suggestions.filter(s => s.status === 'pending').length} ideas por evaluar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Buzón de Ideas Kaizen">
                {loading ? <p className="text-muted">Cargando sugerencias...</p> : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Título / Descripción</th>
                                    <th>Área</th>
                                    <th>Autor</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suggestions.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ maxWidth: '300px' }}>
                                            <p className="font-bold mb-1">{s.title}</p>
                                            <p className="text-[10px] text-muted line-clamp-1">{s.description}</p>
                                        </td>
                                        <td><Badge variant="ghost">{s.area || '-'}</Badge></td>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    {s.author?.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                {s.author?.name || '-'}
                                            </div>
                                        </td>
                                        <td>{statusBadge(s.status)}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                {s.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => updateStatus(s.id, 'approved')}
                                                            className="p-1 hover:text-green-500 transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => updateStatus(s.id, 'rejected')}
                                                            className="p-1 hover:text-red-500 transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {s.status !== 'pending' && <Clock size={16} className="text-slate-600 ml-2" />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!suggestions.length && <tr><td colSpan="5" className="text-center text-muted py-8">No hay sugerencias registradas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal de Nueva Sugerencia Manual */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva sugerencia Kaizen"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={() => createSuggestion()}>Guardar Sugerencia</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <div className="form-group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Título del proyecto</label>
                        <input className="form-input" placeholder="Ej: Reducción de tiempo muerto en línea 2" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Área o Proceso</label>
                        <select className="form-input" value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}>
                            <option value="">Selecciona un área</option>
                            {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Descripción detallada</label>
                        <textarea className="form-input" rows="4" placeholder="Explica cómo esta idea mejora el proceso Gemba..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            {/* Modal de Propuestas IA */}
            <Modal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                title="Sugerencias Proactivas de Gemba AI"
                actions={<Button variant="ghost" onClick={() => setAiModalOpen(false)}>Cerrar</Button>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <p className="text-xs text-slate-400 italic mb-2">He analizado los datos de scrap y downtime de la planta. Aquí tienes algunas mejoras sugeridas:</p>
                    {aiProposals.map((proposal, idx) => (
                        <div key={idx} className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl group hover:bg-blue-500/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="blue">{proposal.area}</Badge>
                                <Button size="sm" variant="primary" onClick={() => createSuggestion(proposal)}>
                                    <Lightbulb size={12} className="mr-1" /> Adoptar
                                </Button>
                            </div>
                            <h4 className="text-sm font-bold text-blue-400 mb-1">{proposal.title}</h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{proposal.description}</p>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
