import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { UploadCloud, FileText, Activity } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState(false);
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [selectedBreakdown, setSelectedBreakdown] = useState(null);
    const [solutionText, setSolutionText] = useState('');
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

    const handleResolveClick = (item) => {
        setSelectedBreakdown(item);
        setSolutionText('');
        setResolveModalOpen(true);
    };

    const confirmResolve = async () => {
        try {
            await apiClient.patch(`/maintenance/breakdowns/${selectedBreakdown.id}/resolve`, { 
                cause: solutionText || 'Reparación estándar' 
            });
            setResolveModalOpen(false);
            setSelectedBreakdown(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cerrar avería');
        }
    };

    const viewSolution = (item) => {
        setSelectedBreakdown(item);
        setViewMode(true);
        setResolveModalOpen(true);
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

            {/* Asistente Gemba AI Potenciado - Mantenimiento */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-indigo-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Activity size={32} className="text-indigo-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Ingeniería Gemba AI</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Monitoreo de Activos Críticos</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Confiabilidad de Máquina</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            "El mantenimiento preventivo no es un costo, es un seguro de producción. Detecto una alta incidencia de fallas por <strong>Sobrecalentamiento</strong> y <strong>Desgaste natural</strong> en tus registros. <strong>Mi recomendación:</strong> Implementar una rutina de <strong>Termografía Infrarroja</strong> mensual en los motores principales para detectar puntos calientes antes de la avería total. Además, sugiero revisar la frecuencia de lubricación en las prensas hidráulicas, ya que el 80% del desgaste prematuro se debe a la degradación de lubricantes por calor."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Importancia:</strong> El TPM reduce los micro-paros y estabiliza el tiempo de ciclo (OEE).</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                <p className="text-[11px] text-slate-300"><strong>Acción Sugerida:</strong> Chequeo preventivo de sensores inductivos por vibración excesiva.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

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
                                                <Button variant="primary" size="sm" onClick={() => handleResolveClick(item)} className="bg-green-600 text-[10px] font-bold tracking-widest transform scale-90 group-hover:scale-100 transition-transform">
                                                    RESOLVER
                                                </Button>
                                            ) : (
                                                <button onClick={() => viewSolution(item)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase flex items-center gap-1 ml-auto">
                                                    <Activity size={12} /> Ver Solución
                                                </button>
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
                isOpen={resolveModalOpen}
                onClose={() => { setResolveModalOpen(false); setViewMode(false); }}
                title={viewMode ? "Detalle de Reparación" : "Resolver Avería / Paro"}
            >
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Evento Reportado</p>
                        <p className="text-sm font-bold text-gray-800">{selectedBreakdown?.description}</p>
                        <div className="flex gap-4 mt-2">
                            <p className="text-[10px] font-bold text-red-600 uppercase">Paro: {selectedBreakdown?.downtimeMin} MIN</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Equipo: {selectedBreakdown?.equipment?.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-blue-900 tracking-tight">
                            {viewMode ? "Solución Técnica Aplicada" : "¿Cómo se resolvió la avería?"}
                        </label>
                        <textarea 
                            disabled={viewMode}
                            className="form-input min-h-[120px]"
                            placeholder="Describa la solución técnica (Ej: Se reemplazó el sensor inductivo y se recalibró el PLC)..."
                            value={viewMode ? selectedBreakdown?.cause : solutionText}
                            onChange={(e) => setSolutionText(e.target.value)}
                        ></textarea>
                    </div>

                    {!viewMode && (
                        <Button variant="primary" className="w-full py-4 bg-green-600 font-black tracking-widest" onClick={confirmResolve}>
                            CONFIRMAR CIERRE TÉCNICO
                        </Button>
                    )}
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
