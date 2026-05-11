import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Modal } from '../../components/ui';
import apiClient from '../../api/client';

export default function CostsPage() {
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ orderId: '', category: 'materials', amount: 0, currency: 'USD', description: '' });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [recordsRes, summaryRes, ordersRes] = await Promise.all([
                apiClient.get('/costs/records'),
                apiClient.get('/costs/summary'),
                apiClient.get('/production-orders', { params: { limit: 100 } }),
            ]);
            setRecords(recordsRes.data || []);
            setSummary(summaryRes.data || []);
            setOrders(ordersRes.data.items || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Costos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const createRecord = async () => {
        try {
            await apiClient.post('/costs/records', {
                ...form,
                amount: Number(form.amount),
            });
            setModalOpen(false);
            setForm({ orderId: '', category: 'materials', amount: 0, currency: 'USD', description: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar costo');
        }
    };

    return (
        <div>
            <PageHeader title="Costos" subtitle="Costeo por orden y categoría">
                <Button variant="primary" onClick={() => setModalOpen(true)}>Nuevo registro</Button>
            </PageHeader>

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Resumen de Costos por Categoría">
                    {loading ? <p className="text-muted">Cargando...</p> : (
                        <div className="table-responsive">
                            <table className="table w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-gray-400">Categoría</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-gray-400">Total Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map((s, idx) => (
                                        <tr key={`${s.category}-${idx}`} className="border-b border-gray-50">
                                            <td className="px-4 py-3 font-bold text-gray-700 uppercase text-xs">{s.category}</td>
                                            <td className="px-4 py-3 text-right font-black text-blue-600">
                                                {s._sum?.amount?.toLocaleString()} <span className="text-[10px] text-gray-400">{s.currency}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!summary.length && <tr><td colSpan="2" className="text-center py-10 text-gray-400 text-xs font-bold uppercase">Sin datos</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Card title="Asignación por Orden de Producción">
                    <div className="p-4 space-y-3">
                        {records.reduce((acc, r) => {
                            const orderNum = r.order?.orderNumber || 'Sin Orden';
                            acc[orderNum] = (acc[orderNum] || 0) + r.amount;
                            return acc;
                        }, {}) && Object.entries(records.reduce((acc, r) => {
                            const orderNum = r.order?.orderNumber || 'Sin Orden';
                            acc[orderNum] = (acc[orderNum] || 0) + r.amount;
                            return acc;
                        }, {})).map(([order, total]) => (
                            <div key={order} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Orden #</p>
                                    <p className="font-bold text-gray-800">{order}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Costo Total</p>
                                    <p className="font-black text-indigo-600">${total.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        {!records.length && <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase">Sin registros</p>}
                    </div>
                </Card>
            </div>

            <Card title="Historial de Transacciones de Costo" style={{ marginTop: 'var(--space-6)' }} noPadding>
                <div className="table-responsive">
                    <table className="table w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Fecha</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Orden de Producción</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Categoría</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">Monto</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Glosa / Descripción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">{new Date(r.recordedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{r.order?.orderNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                                            {r.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900 border-r border-gray-50">${r.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs italic text-gray-500">{r.description || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nuevo Gasto Administrativo / Operativo"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createRecord}>Guardar Gasto</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Orden de Producción Vinculada</label>
                        <select className="form-input" value={form.orderId} onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}>
                            <option value="">Selecciona orden</option>
                            {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNumber} - {o.product}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Rubro / Categoría</label>
                        <select className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                            <option value="materials">Materia Prima / Materiales</option>
                            <option value="labor">Mano de Obra (MOD/MOI)</option>
                            <option value="energy">Suministros (Energía/Agua)</option>
                            <option value="overhead">Indirectos / Otros</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Monto Total</label>
                            <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Moneda</label>
                            <input className="form-input font-bold" placeholder="USD" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nota Explicativa</label>
                        <textarea className="form-input" placeholder="Justificación del gasto..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
