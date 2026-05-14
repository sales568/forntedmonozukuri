import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { FileText, Plus, RefreshCw, Monitor, AlertCircle, Edit2, Eye } from 'lucide-react';

export default function FOSListPage() {
    const [items, setItems] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFosContextId, setSelectedFosContextId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFos, setSelectedFos] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState('');
    const [viewFos, setViewFos] = useState(null);
    const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);
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
            const nextItems = fosRes.data?.items || [];
            if (!selectedFosContextId && nextItems.length) setSelectedFosContextId(nextItems[0].id);
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
            workstationId: fos.workstationId || fos.workstation?.id || '',
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
                        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                            <Card className="border border-gray-100">
                                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Resumen</div>
                                <div className="mt-3">
                                    <div className="text-sm font-black text-gray-800">{viewFos.code}</div>
                                    <div className="text-sm font-bold text-gray-600 mt-1">{viewFos.nombreProceso}</div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Estación: {viewFos.workstation?.name || 'N/D'} ({viewFos.workstation?.code || '—'})
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Versión actual: v{viewFos.versionActual}</div>
                                    <div className="text-xs text-gray-500 mt-1">Estado: {viewFos.estado || 'N/D'}</div>
                                </div>

                                <div className="mt-6">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-400">Historial de versiones</div>
                                    <div className="mt-3 flex flex-col gap-2" style={{ maxHeight: 360, overflow: 'auto' }}>
                                        {(viewFos.versions || []).map((v) => (
                                            <button
                                                key={v.id}
                                                className={`text-left p-3 rounded-xl border transition-all ${selectedVersionNumber === v.versionNumber ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                                onClick={() => setSelectedVersionNumber(v.versionNumber)}
                                            >
                                                <div className="text-xs font-black text-gray-700">v{v.versionNumber}</div>
                                                <div className="text-[11px] text-gray-500 mt-1">{new Date(v.createdAt).toLocaleString()}</div>
                                                {v.changelog && <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">{v.changelog}</div>}
                                            </button>
                                        ))}
                                        {!viewFos.versions?.length && (
                                            <div className="text-sm text-gray-500">Sin versiones registradas.</div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card className="border border-gray-100">
                                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Contenido de versión</div>
                                <div className="text-sm text-gray-600 mt-2">
                                    {selectedVersionNumber ? `Mostrando v${selectedVersionNumber}` : 'Selecciona una versión'}
                                </div>
                                <pre className="mt-4 text-[11px] bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto" style={{ maxHeight: 520 }}>
                                    {JSON.stringify(
                                        (viewFos.versions || []).find((v) => v.versionNumber === selectedVersionNumber)?.data || {},
                                        null,
                                        2
                                    )}
                                </pre>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}
