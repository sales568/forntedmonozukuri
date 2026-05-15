import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import { Plus, GripVertical, AlertCircle, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';

export default function PhvaBoardPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', column: 'Planear', priority: 'Media' });

    const loadTasks = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/phva/tasks');
            setTasks(res.data || []);
        } catch (err) {
            setError('Error al conectar con el servidor PHVA.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('id', id);
    };

    const changePhase = async (id, column) => {
        const originalTasks = [...tasks];
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));
        try {
            await apiClient.patch(`/phva/tasks/${id}`, { column });
        } catch (err) {
            setTasks(originalTasks);
            setError('No se pudo actualizar la fase.');
        }
    };

    const parseDescription = (desc, title) => {
        try {
            if (desc && desc.startsWith('{')) {
                const parsed = JSON.parse(desc);
                if (parsed.planear) return parsed;
            }
        } catch (e) {}
        return {
            planear: `Definir equipo y cronograma para: ${title}. Analizar causa raíz.`,
            hacer: desc || `Ejecutar piloto de la mejora propuesta.`,
            verificar: `Medir resultados y comparar con indicadores iniciales.`,
            actuar: `Estandarizar solución si es exitosa o reiniciar ciclo.`
        };
    };

    const allowDrop = (e) => e.preventDefault();

    const createTask = async () => {
        if (!form.title) return;
        try {
            await apiClient.post('/phva/tasks', form);
            setIsModalOpen(false);
            setForm({ title: '', description: '', column: 'Planear', priority: 'Media' });
            await loadTasks();
        } catch (err) {
            setError('Error al crear la acción PHVA.');
        }
    };

    const deleteTask = async (id) => {
        if (!confirm('¿Eliminar esta acción PHVA?')) return;
        try {
            await apiClient.delete(`/phva/tasks/${id}`);
            await loadTasks();
        } catch (err) {
            setError('Error al eliminar la acción.');
        }
    };

    const columns = ['Planear', 'Hacer', 'Verificar', 'Actuar'];

    return (
        <div className="animate-fade-in w-full h-full flex flex-col pb-10">
            <PageHeader title="Tablero PHVA (PDCA)" subtitle="Gestión visual de Mejora Continua y QC-Story">
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className="bg-blue-600 font-bold">
                    <Plus size={16} className="mr-2" /> NUEVA ACCIÓN PHVA
                </Button>
            </PageHeader>

            {error && <div className="alert alert-danger mb-6 flex items-center gap-3"><AlertCircle size={18} /> {error}</div>}

            <div className="flex-1 flex flex-col gap-8 max-w-5xl mx-auto w-full">
                {tasks.map((task) => {
                    const aiPlan = parseDescription(task.description, task.title);
                    return (
                        <div key={task.id} className="phva-idea-card group">
                            {/* Header (Idea) */}
                            <div className="phva-idea-header">
                                <button onClick={() => deleteTask(task.id)} style={{position: 'absolute', right: 0, top: 0, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px'}}>
                                    <Trash2 size={16} />
                                </button>
                                <div style={{display: 'inline-flex', marginBottom: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                    IDEA KAIZEN
                                </div>
                                <h2 className="phva-idea-title">[{task.title}]</h2>
                                <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic', fontWeight: '500'}}>Ciclo PHVA generado por Gemba AI</p>
                            </div>

                            {/* Matrix Graphic */}
                            <div className="phva-matrix">
                                {[
                                    { phase: 'Planear', text: aiPlan.planear },
                                    { phase: 'Hacer', text: aiPlan.hacer },
                                    { phase: 'Verificar', text: aiPlan.verificar },
                                    { phase: 'Actuar', text: aiPlan.actuar },
                                ].map((quad) => {
                                    const isActive = task.column === quad.phase;
                                    return (
                                        <div 
                                            key={quad.phase}
                                            onClick={() => changePhase(task.id, quad.phase)}
                                            className={`phva-quadrant ${isActive ? `active-${quad.phase}` : ''}`}
                                        >
                                            <div className="phva-quadrant-header">
                                                <h3 className="phva-quadrant-title">
                                                    {quad.phase}
                                                </h3>
                                                {isActive && <span className="phva-pulse" />}
                                            </div>
                                            <p className="phva-quadrant-text">{quad.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/20">
                        <AlertCircle size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Sin Proyectos Activos</h3>
                        <p className="text-slate-500 mt-2 text-center max-w-sm">Aprueba sugerencias desde el buzón Kaizen o crea una nueva idea manualmente para ver el ciclo PHVA impulsado por Gemba AI.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva Acción PHVA"
                maxWidth="500px"
            >
                <div className="p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-blue-500">Título de la Acción</label>
                        <input className="form-input" placeholder="Ej: Reducir scrap en línea 3" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-blue-500">Descripción detallada</label>
                        <textarea className="form-input" rows={3} placeholder="Describa el plan o la acción correctiva..." value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-blue-500">Columna Inicial</label>
                            <select className="form-input" value={form.column} onChange={(e) => setForm(p => ({ ...p, column: e.target.value }))}>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-blue-500">Prioridad Impacto</label>
                            <select className="form-input" value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}>
                                <option value="Alta">Alta</option>
                                <option value="Media">Media</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createTask} className="bg-blue-600 font-black px-8">CREAR ACCIÓN</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
