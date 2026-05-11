import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';

export default function InventoryPage() {
    const [lots, setLots] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lotModalOpen, setLotModalOpen] = useState(false);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [newLot, setNewLot] = useState({ lotNumber: '', product: '', quantity: 0, status: 'released' });
    const [newMovement, setNewMovement] = useState({ lotId: '', type: 'entry', quantity: 0, warehouse: '', reference: '', notes: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [lotsRes, movementsRes] = await Promise.all([
                apiClient.get('/inventory/lots'),
                apiClient.get('/inventory/movements'),
            ]);
            setLots(lotsRes.data || []);
            setMovements(movementsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const createLot = async () => {
        try {
            await apiClient.post('/inventory/lots', {
                ...newLot,
                quantity: Number(newLot.quantity),
            });
            setLotModalOpen(false);
            setNewLot({ lotNumber: '', product: '', quantity: 0, status: 'released' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear lote');
        }
    };

    const createMovement = async () => {
        try {
            await apiClient.post('/inventory/movements', {
                ...newMovement,
                quantity: Number(newMovement.quantity),
            });
            setMovementModalOpen(false);
            setNewMovement({ lotId: '', type: 'entry', quantity: 0, warehouse: '', reference: '', notes: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo registrar movimiento');
        }
    };

    const statusBadge = (status) => {
        if (status === 'released') return <Badge variant="success">Liberado</Badge>;
        if (status === 'quarantine') return <Badge variant="warning">Cuarentena</Badge>;
        if (status === 'rejected') return <Badge variant="danger">Rechazado</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Inventario y trazabilidad" subtitle="Lotes y movimientos con persistencia real">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setMovementModalOpen(true)}>Registrar Movimiento</Button>
                    <Button variant="primary" onClick={() => setLotModalOpen(true)}>Nuevo Lote</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card title="Lotes">
                {loading ? (
                    <p className="text-muted">Cargando lotes...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Lote</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.map((lot) => (
                                    <tr key={lot.id}>
                                        <td>{lot.lotNumber}</td>
                                        <td>{lot.product}</td>
                                        <td>{lot.quantity}</td>
                                        <td>{statusBadge(lot.status)}</td>
                                    </tr>
                                ))}
                                {!lots.length && <tr><td colSpan="4" className="text-center text-muted">No hay lotes.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card title="Movimientos recientes" style={{ marginTop: 'var(--space-6)' }}>
                <div className="table-responsive">
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Lote</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Referencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => (
                                <tr key={m.id}>
                                    <td>{new Date(m.movedAt).toLocaleString()}</td>
                                    <td>{m.lot?.lotNumber || '-'}</td>
                                    <td>{m.type}</td>
                                    <td>{m.quantity}</td>
                                    <td>{m.reference || '-'}</td>
                                </tr>
                            ))}
                            {!movements.length && <tr><td colSpan="5" className="text-center text-muted">Sin movimientos.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={lotModalOpen}
                onClose={() => setLotModalOpen(false)}
                title="Crear Nuevo Lote"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setLotModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createLot}>Guardar Lote</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Número de Lote / Trace ID</label>
                        <input className="form-input" placeholder="Ej: LOT-2024-001" value={newLot.lotNumber} onChange={(e) => setNewLot((p) => ({ ...p, lotNumber: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Producto / SKU</label>
                        <input className="form-input" placeholder="Ej: Chasis A-1" value={newLot.product} onChange={(e) => setNewLot((p) => ({ ...p, product: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cantidad Inicial</label>
                        <input className="form-input" type="number" min="1" placeholder="0" value={newLot.quantity} onChange={(e) => setNewLot((p) => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Estatus de Calidad</label>
                        <select className="form-input" value={newLot.status} onChange={(e) => setNewLot((p) => ({ ...p, status: e.target.value }))}>
                            <option value="released">Liberado (OK)</option>
                            <option value="quarantine">Cuarentena (Hold)</option>
                            <option value="rejected">Rechazado (Scrap)</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={movementModalOpen}
                onClose={() => setMovementModalOpen(false)}
                title="Registrar Movimiento de Almacén"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setMovementModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createMovement}>Registrar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Lote de Origen/Destino</label>
                        <select className="form-input" value={newMovement.lotId} onChange={(e) => setNewMovement((p) => ({ ...p, lotId: e.target.value }))}>
                            <option value="">Selecciona lote</option>
                            {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lotNumber}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Operación</label>
                        <select className="form-input" value={newMovement.type} onChange={(e) => setNewMovement((p) => ({ ...p, type: e.target.value }))}>
                            <option value="entry">Entrada (Entry)</option>
                            <option value="exit">Salida (Exit)</option>
                            <option value="quarantine">Bloqueo (Quarantine)</option>
                            <option value="transfer">Transferencia</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cantidad</label>
                        <input className="form-input" type="number" min="1" placeholder="0" value={newMovement.quantity} onChange={(e) => setNewMovement((p) => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Almacén / Ubicación</label>
                        <input className="form-input" placeholder="Ej: WH-NORTH-01" value={newMovement.warehouse} onChange={(e) => setNewMovement((p) => ({ ...p, warehouse: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Referencia (OT / Factura)</label>
                        <input className="form-input" placeholder="Ej: OT-123" value={newMovement.reference} onChange={(e) => setNewMovement((p) => ({ ...p, reference: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Observaciones</label>
                        <textarea className="form-input" placeholder="Detalles del movimiento..." value={newMovement.notes} onChange={(e) => setNewMovement((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
