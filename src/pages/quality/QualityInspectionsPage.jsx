import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { Camera, FileText, CheckCircle, AlertTriangle, Eye, Download } from 'lucide-react';

export default function QualityInspectionsPage() {
    const [inspections, setInspections] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newInspectionOpen, setNewInspectionOpen] = useState(false);
    const [newCheckpointOpen, setNewCheckpointOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [inspectionForm, setInspectionForm] = useState({ checkpointId: '', result: 'OK', value: '', notes: '', imageUrl: '' });
    const [checkpointForm, setCheckpointForm] = useState({ workstationId: '', name: '', specification: '', method: 'visual', frequency: 'hourly' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [insRes, cpRes, wsRes] = await Promise.all([
                apiClient.get('/quality/inspections', { params: { limit: 100 } }),
                apiClient.get('/quality/checkpoints'),
                apiClient.get('/fos/meta/workstations'),
            ]);
            setInspections(insRes.data.items || []);
            setCheckpoints(cpRes.data || []);
            setWorkstations(wsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Calidad');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const [modalError, setModalError] = useState('');

    const createCheckpoint = async () => {
        setModalError('');
        if (!checkpointForm.workstationId || !checkpointForm.name) {
            setModalError('Estación y nombre son obligatorios');
            return;
        }
        try {
            await apiClient.post('/quality/checkpoints', {
                ...checkpointForm,
            });
            setNewCheckpointOpen(false);
            setCheckpointForm({ workstationId: '', name: '', specification: '', method: 'visual', frequency: 'hourly' });
            await loadData();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Error al guardar. Verifica los datos.');
        }
    };

    const createInspection = async () => {
        setModalError('');
        if (!inspectionForm.checkpointId) {
            setModalError('Debes seleccionar un punto de control');
            return;
        }
        try {
            await apiClient.post('/quality/inspections', {
                checkpointId: inspectionForm.checkpointId,
                result: inspectionForm.result,
                value: inspectionForm.value ? Number(inspectionForm.value) : undefined,
                notes: inspectionForm.notes || undefined,
                imageUrl: inspectionForm.imageUrl || undefined,
            });
            setNewInspectionOpen(false);
            setInspectionForm({ checkpointId: '', result: 'OK', value: '', notes: '', imageUrl: '' });
            await loadData();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Error al guardar la inspección.');
        }
    };

    const resultBadge = (result) => {
        if (result === 'OK') return <Badge variant="success">OK</Badge>;
        if (result?.includes('NOK')) return <Badge variant="danger">{result}</Badge>;
        return <Badge>{result}</Badge>;
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Calidad" subtitle="Inspecciones y cuadro de control con datos reales">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setNewCheckpointOpen(true)}>Nuevo Checkpoint</Button>
                    <Button variant="primary" onClick={() => setNewInspectionOpen(true)}>Nueva Inspección</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Inspecciones">
                {loading ? (
                    <p className="text-muted">Cargando inspecciones...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Checkpoint</th>
                                    <th>Inspector</th>
                                    <th>Resultado</th>
                                    <th>No conformidades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspections.map((inspection) => (
                                    <tr key={inspection.id}>
                                        <td>{new Date(inspection.inspectedAt).toLocaleString()}</td>
                                        <td>{inspection.checkpoint?.name || '-'}</td>
                                        <td>{inspection.inspector?.name || '-'}</td>
                                        <td>{resultBadge(inspection.result)}</td>
                                        <td>{inspection.nonconformities?.length || 0}</td>
                                        <td className="text-right">
                                            <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-[10px] uppercase p-0" onClick={() => { setSelectedInspection(inspection); setReportModalOpen(true); }}>
                                                <Eye size={12} className="mr-1" /> Ver Reporte
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!inspections.length && (
                                    <tr><td colSpan="5" className="text-center text-muted">No hay inspecciones.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <ModuleFormats module="quality" />

            <Modal
                isOpen={newCheckpointOpen}
                onClose={() => setNewCheckpointOpen(false)}
                title="Nuevo checkpoint de calidad"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setNewCheckpointOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createCheckpoint}>Crear</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    {modalError && <div className="text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg">{modalError}</div>}
                    <select className="form-input" value={checkpointForm.workstationId} onChange={(e) => setCheckpointForm((p) => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona estación</option>
                        {workstations.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                    </select>
                    <input className="form-input" placeholder="Nombre checkpoint" value={checkpointForm.name} onChange={(e) => setCheckpointForm((p) => ({ ...p, name: e.target.value }))} />
                    <input className="form-input" placeholder="Especificación" value={checkpointForm.specification} onChange={(e) => setCheckpointForm((p) => ({ ...p, specification: e.target.value }))} />
                    <input className="form-input" placeholder="Método" value={checkpointForm.method} onChange={(e) => setCheckpointForm((p) => ({ ...p, method: e.target.value }))} />
                    <input className="form-input" placeholder="Frecuencia" value={checkpointForm.frequency} onChange={(e) => setCheckpointForm((p) => ({ ...p, frequency: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={newInspectionOpen}
                onClose={() => setNewInspectionOpen(false)}
                title="Nueva inspección"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setNewInspectionOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createInspection}>Registrar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    {modalError && <div className="text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg">{modalError}</div>}
                    <select className="form-input" value={inspectionForm.checkpointId} onChange={(e) => setInspectionForm((p) => ({ ...p, checkpointId: e.target.value }))}>
                        <option value="">Selecciona checkpoint</option>
                        {checkpoints.map((cp) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                    </select>
                    <select className="form-input" value={inspectionForm.result} onChange={(e) => setInspectionForm((p) => ({ ...p, result: e.target.value }))}>
                        <option value="OK">OK - Cumple Estándar</option>
                        <option value="NOK_REWORK">NOK - Requiere Reproceso</option>
                        <option value="NOK_SCRAP">NOK - Scrap / Desecho</option>
                    </select>
                    <div className="flex gap-2">
                        <input className="form-input flex-1" type="number" placeholder="Valor medido" value={inspectionForm.value} onChange={(e) => setInspectionForm((p) => ({ ...p, value: e.target.value }))} />
                        <input className="form-input flex-1" placeholder="URL Foto Evidencia" value={inspectionForm.imageUrl} onChange={(e) => setInspectionForm((p) => ({ ...p, imageUrl: e.target.value }))} />
                    </div>
                    <textarea className="form-input" placeholder="Notas técnicas del hallazgo..." value={inspectionForm.notes} onChange={(e) => setInspectionForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Reporte de Inspección de Calidad"
                maxWidth="900px"
            >
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div className="space-y-1">
                            <Badge variant={selectedInspection?.result === 'OK' ? 'success' : 'danger'} className="text-xs px-3 py-1 font-black uppercase tracking-widest">
                                {selectedInspection?.result}
                            </Badge>
                            <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">{selectedInspection?.checkpoint?.name}</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID Inspección: {selectedInspection?.id.split('-')[0]}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                            <p className="text-sm font-bold text-slate-800">{new Date(selectedInspection?.inspectedAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={12} /> Diagnóstico Técnico
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-white pb-2">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Inspector</span>
                                        <span className="text-xs font-bold text-slate-900">{selectedInspection?.inspector?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white pb-2">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Valor Medido</span>
                                        <span className="text-xs font-bold text-slate-900">{selectedInspection?.value || 'N/A'}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Notas de Hallazgo</span>
                                        <p className="text-xs leading-relaxed text-slate-700 italic">"{selectedInspection?.notes || 'Sin observaciones adicionales.'}"</p>
                                    </div>
                                </div>
                            </div>

                            <Button variant="primary" className="w-full bg-blue-900 font-black tracking-widest py-4 shadow-lg shadow-blue-900/20" onClick={() => window.print()}>
                                <Download size={18} className="mr-2" /> DESCARGAR REPORTE N1
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                <Camera size={12} /> Evidencia Fotográfica
                            </h4>
                            {selectedInspection?.imageUrl ? (
                                <div className="rounded-2xl overflow-hidden border-4 border-white shadow-xl aspect-video relative group">
                                    <img src={selectedInspection.imageUrl} alt="Evidencia" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-all pointer-events-none" />
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Camera size={32} className="opacity-20" />
                                    <span className="text-[10px] font-bold uppercase">No se registró evidencia visual</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
