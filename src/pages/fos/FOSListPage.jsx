import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { FileText, Plus, RefreshCw, Monitor, AlertCircle, Edit2, Eye } from 'lucide-react';

export default function FOSListPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFos, setSelectedFos] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [form, setForm] = useState({
        code: '',
        nombreProceso: '',
        workstationId: '',
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
        } catch (err) {
            console.error('General error in FOS loadData:', err);
            setError('Error de conexión con el servidor de estandarización.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateOpen = () => {
        setIsEditMode(false);
        setSelectedFos(null);
        setForm({ code: '', nombreProceso: '', workstationId: '' });
        setIsModalOpen(true);
    };

    const handleEditOpen = (fos) => {
        setIsEditMode(true);
        setSelectedFos(fos);
        setForm({
            code: fos.code,
            nombreProceso: fos.nombreProceso,
            workstationId: fos.workstationId,
        });
        setIsModalOpen(true);
    };

    const createFOS = async () => {
        if (!form.code || !form.nombreProceso || !form.workstationId) return;
        try {
            await apiClient.post('/fos', {
                code: form.code,
                nombreProceso: form.nombreProceso,
                workstationId: form.workstationId,
                foeData: {
                    metadatos: { proceso: form.nombreProceso },
                    etapas: [],
                    pie: {},
                },
                changelog: 'Creación inicial desde Gemba App',
            });
            setIsModalOpen(false);
            setForm({ code: '', nombreProceso: '', workstationId: '' });
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
                workstationId: form.workstationId,
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
                    <Button variant="primary" onClick={handleCreateOpen} className="bg-blue-600 shadow-sm px-6 font-bold">
                        <Plus size={16} className="mr-2" /> NUEVO ESTÁNDAR FOS
                    </Button>
                </div>
            </PageHeader>

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
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Proceso / Operación</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Estación Gemba</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Versión</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Estado</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((fos) => (
                                    <tr key={fos.id} className="hover:bg-blue-50/40 transition-all group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">
                                                {fos.code}
                                            </span>
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
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-[10px] tracking-widest text-blue-600"
                                                    onClick={() => handleEditOpen(fos)}
                                                >
                                                    <Edit2 size={12} className="mr-1" /> EDITAR
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="font-bold text-[10px] tracking-widest text-gray-500 hover:text-blue-600"
                                                    onClick={() => navigate(`/fos/${fos.id}`)}
                                                >
                                                    <Eye size={12} className="mr-1" /> VER
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!items.length && !loading && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20 bg-gray-50/50">
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

            <ModuleFormats module="fos" />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? "Editar Estándar Operativo" : "Crear Nuevo Estándar Operativo (FOS)"}
                maxWidth="600px"
            >
                <div className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-blue-400">Código del Estándar</label>
                        <input
                            className="form-input gemba-input"
                            placeholder="Ej: FOS-ENS-001"
                            value={form.code}
                            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-blue-400">Nombre del Proceso</label>
                        <input
                            className="form-input gemba-input"
                            placeholder="Ej: Ensamble de Chasis"
                            value={form.nombreProceso}
                            onChange={(e) => setForm((prev) => ({ ...prev, nombreProceso: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-blue-400">Estación de Trabajo (Gemba)</label>
                        <select
                            className="form-input gemba-input"
                            value={form.workstationId}
                            onChange={(e) => setForm((prev) => ({ ...prev, workstationId: e.target.value }))}
                        >
                            <option value="">-- Seleccione el puesto de trabajo --</option>
                            {workstations.map((ws) => (
                                <option key={ws.id} value={ws.id}>{ws.name} ({ws.code})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-muted italic mt-1">* Si no aparece la estación, genérela primero en el módulo de Configuración de Planta.</p>
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
        </div>
    );
}
