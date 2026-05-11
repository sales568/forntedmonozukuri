import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { UploadCloud, FileText } from 'lucide-react';
import MaintenanceDashboard from './MaintenanceDashboard';

export default function MaintenancePage() {
    const [breakdowns, setBreakdowns] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
    const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [breakdownForm, setBreakdownForm] = useState({ equipmentId: '', description: '', cause: '', downtimeMin: 0 });
    const [equipmentForm, setEquipmentForm] = useState({ workstationId: '', name: '', code: '', type: '', location: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [bRes, eRes, wsRes] = await Promise.all([
                apiClient.get('/maintenance/breakdowns'),
                apiClient.get('/maintenance/equipment'),
                apiClient.get('/fos/meta/workstations'),
            ]);
            setBreakdowns(bRes.data || []);
            setEquipment(eRes.data || []);
            setWorkstations(wsRes.data || []);
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

    const resolveBreakdown = async (id) => {
        try {
            await apiClient.patch(`/maintenance/breakdowns/${id}/resolve`, { cause: 'Cerrada desde la app' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cerrar avería');
        }
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

            {error && <div className="alert alert-danger mb-6">{error}</div>}

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
                                        <td className="px-6 py-4 font-bold text-sm text-gray-700">{item.description}</td>
                                        <td className="px-6 py-4 text-xs italic text-gray-500">{item.cause || 'Por analizar'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${item.downtimeMin > 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.downtimeMin} <span className="text-[10px] opacity-40">MIN</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">{statusBadge(item.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status !== 'resolved' ? (
                                                <Button variant="primary" size="sm" onClick={() => resolveBreakdown(item.id)} className="bg-green-600 text-[10px] font-bold tracking-widest transform scale-90 group-hover:scale-100 transition-transform">
                                                    RESOLVER
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Cerrada</span>
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
        </div>
    );
}
