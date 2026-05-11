import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';

export default function SafetyPage() {
    const [audits, setAudits] = useState([]);
    const [referenceStates, setReferenceStates] = useState([]);
    const [workstations, setWorkstations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    const [auditForm, setAuditForm] = useState({ workstationId: '', area: '', department: '', responsible: '' });
    const [referenceForm, setReferenceForm] = useState({ workstationId: '', title: '', version: '', observations: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [auditsRes, refRes, wsRes] = await Promise.all([
                apiClient.get('/safety/audits-5s'),
                apiClient.get('/safety/reference-states'),
                apiClient.get('/safety/workstations'),
            ]);
            setAudits(auditsRes.data || []);
            setReferenceStates(refRes.data || []);
            setWorkstations(wsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Seguridad/5S');
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
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear auditoría 5S');
        }
    };

    const createReferenceState = async () => {
        try {
            await apiClient.post('/safety/reference-states', {
                ...referenceForm,
                visualControls: [],
            });
            setReferenceModalOpen(false);
            setReferenceForm({ workstationId: '', title: '', version: '', observations: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear estado de referencia');
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <PageHeader title="Seguridad y 5S" subtitle="Auditoría 5S y estado de referencia real">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setReferenceModalOpen(true)}>Estado de Referencia</Button>
                    <Button variant="primary" onClick={() => setAuditModalOpen(true)}>Nueva Auditoría 5S</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Auditorías 5S">
                {loading ? <p className="text-muted">Cargando...</p> : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Puesto</th>
                                    <th>Puntaje</th>
                                    <th>Auditor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audits.map((a) => (
                                    <tr key={a.id}>
                                        <td>{new Date(a.createdAt).toLocaleString()}</td>
                                        <td>{a.workstation?.name || '-'}</td>
                                        <td>{a.score}%</td>
                                        <td>{a.user?.name || '-'}</td>
                                    </tr>
                                ))}
                                {!audits.length && <tr><td colSpan="4" className="text-center text-muted">Sin auditorías.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card title="Estados de referencia" style={{ marginTop: 'var(--space-6)' }}>
                <div className="table-responsive">
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Puesto</th>
                                <th>Título</th>
                                <th>Versión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referenceStates.map((r) => (
                                <tr key={r.id}>
                                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                                    <td>{r.workstation?.name || '-'}</td>
                                    <td>{r.findings?.title || '-'}</td>
                                    <td>{r.findings?.version || '-'}</td>
                                </tr>
                            ))}
                            {!referenceStates.length && <tr><td colSpan="4" className="text-center text-muted">Sin estados de referencia.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ModuleFormats module="safety" />

            <Modal
                isOpen={auditModalOpen}
                onClose={() => setAuditModalOpen(false)}
                title="Nueva auditoría 5S"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setAuditModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createAudit}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <select className="form-input" value={auditForm.workstationId} onChange={(e) => setAuditForm((p) => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map((w) => <option value={w.id} key={w.id}>{w.name}</option>)}
                    </select>
                    <input className="form-input" placeholder="Área" value={auditForm.area} onChange={(e) => setAuditForm((p) => ({ ...p, area: e.target.value }))} />
                    <input className="form-input" placeholder="Departamento" value={auditForm.department} onChange={(e) => setAuditForm((p) => ({ ...p, department: e.target.value }))} />
                    <input className="form-input" placeholder="Responsable" value={auditForm.responsible} onChange={(e) => setAuditForm((p) => ({ ...p, responsible: e.target.value }))} />
                </div>
            </Modal>

            <Modal
                isOpen={referenceModalOpen}
                onClose={() => setReferenceModalOpen(false)}
                title="Estado de referencia"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setReferenceModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createReferenceState}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    <select className="form-input" value={referenceForm.workstationId} onChange={(e) => setReferenceForm((p) => ({ ...p, workstationId: e.target.value }))}>
                        <option value="">Selecciona puesto</option>
                        {workstations.map((w) => <option value={w.id} key={w.id}>{w.name}</option>)}
                    </select>
                    <input className="form-input" placeholder="Título" value={referenceForm.title} onChange={(e) => setReferenceForm((p) => ({ ...p, title: e.target.value }))} />
                    <input className="form-input" placeholder="Versión" value={referenceForm.version} onChange={(e) => setReferenceForm((p) => ({ ...p, version: e.target.value }))} />
                    <textarea className="form-input" placeholder="Observaciones" value={referenceForm.observations} onChange={(e) => setReferenceForm((p) => ({ ...p, observations: e.target.value }))} />
                </div>
            </Modal>
        </div>
    );
}
