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

    const handleDrop = async (e, column) => {
        const id = e.dataTransfer.getData('id');
        const originalTasks = [...tasks];

        // Optimistic update
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));

        try {
            await apiClient.patch(`/phva/tasks/${id}`, { column });
        } catch (err) {
            setTasks(originalTasks);
            setError('No se pudo mover la tarea. Inténtelo de nuevo.');
        }
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto min-h-[600px]">
                {columns.map((col) => (
                    <div
                        key={col}
                        className="bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col p-4 shadow-inner"
                        onDragOver={allowDrop}
                        onDrop={(e) => handleDrop(e, col)}
                    >
                        <div className="flex justify-between items-center mb-5 px-1">
                            <h3 className="font-black text-gray-700 uppercase tracking-widest text-[10px]">{col}</h3>
                            <Badge variant="neutral" className="bg-white border border-gray-100">{tasks.filter(t => t.column === col).length}</Badge>
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            {tasks.filter(t => t.column === col).map((task) => (
                                <Card
                                    key={task.id}
                                    className="p-4 cursor-grab hover:shadow-xl transition-all bg-white rounded-xl border-l-[6px] border-l-blue-500 hover:-translate-y-1 relative group"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant={task.priority === 'Alta' ? 'error' : task.priority === 'Media' ? 'warning' : 'success'} className="text-[9px] px-2">
                                            {task.priority}
                                        </Badge>
                                        <div className="flex gap-2">
                                            <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                            <GripVertical size={14} className="text-gray-200" />
                                        </div>
                                    </div>
                                    <h4 className="font-black text-xs text-gray-800 leading-tight mb-2 uppercase tracking-tight">{task.title}</h4>
                                    <p className="text-[11px] text-gray-400 font-medium leading-normal">{task.description}</p>
                                </Card>
                            ))}
                            {tasks.filter(t => t.column === col).length === 0 && (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl flex-1 flex flex-col items-center justify-center opacity-40">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Soltar aquí</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
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
