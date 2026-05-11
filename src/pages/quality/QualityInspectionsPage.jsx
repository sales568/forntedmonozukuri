import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';

export default function QualityInspectionsPage() {
    const [inspections, setInspections] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newInspectionOpen, setNewInspectionOpen] = useState(false);
    const [newCheckpointOpen, setNewCheckpointOpen] = useState(false);
    const [inspectionForm, setInspectionForm] = useState({ checkpointId: '', result: 'OK', value: '', notes: '' });
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
            });
            setNewInspectionOpen(false);
            setInspectionForm({ checkpointId: '', result: 'OK', value: '', notes: '' });
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
                        <option value="OK">OK</option>
                        <option value="NOK_REWORK">NOK_REWORK</option>
                        <option value="NOK_SCRAP">NOK_SCRAP</option>
                    </select>
                    <input className="form-input" type="number" placeholder="Valor medido (opcional)" value={inspectionForm.value} onChange={(e) => setInspectionForm((p) => ({ ...p, value: e.target.value }))} />
                    <textarea className="form-input" placeholder="Notas" value={inspectionForm.notes} onChange={(e) => setInspectionForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
}
