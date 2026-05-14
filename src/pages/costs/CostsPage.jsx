import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '../../components/ui';
import apiClient from '../../api/client';
import { 
    Wallet, TrendingDown, Layers, Users, Trash2, 
    RefreshCcw, Settings, GraduationCap, Zap, BookOpen 
} from 'lucide-react';

const CATEGORIES = [
    { id: 'Materiales Directos', icon: Layers, color: 'blue' },
    { id: 'Mano de Obra Directa', icon: Users, color: 'indigo' },
    { id: 'Scrap', icon: Trash2, color: 'red' },
    { id: 'Retrabajos', icon: RefreshCcw, color: 'orange' },
    { id: 'Mantenimiento (Averías)', icon: Settings, color: 'slate' },
    { id: 'Overhead Básico', icon: Wallet, color: 'emerald' },
    { id: 'Costos de Formación', icon: GraduationCap, color: 'purple' },
    { id: 'Costos de Mejora', icon: Zap, color: 'yellow' },
    { id: 'Amortización de Proyectos', icon: BookOpen, color: 'cyan' },
];

export default function CostsPage() {
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(false);
    const [form, setForm] = useState({ 
        orderId: '', 
        category: CATEGORIES[0].id, 
        amount: '', 
        currency: 'COP', 
        description: '' 
    });

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
            setIsCustom(false);
            setForm({ orderId: '', category: CATEGORIES[0].id, amount: '', currency: 'COP', description: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar costo');
        }
    };

    const handleCategoryChange = (val) => {
        if (val === 'CUSTOM') {
            setIsCustom(true);
            setForm(p => ({ ...p, category: '' }));
        } else {
            setIsCustom(false);
            setForm(p => ({ ...p, category: val }));
        }
    };

    const getCategoryStyles = (catId) => {
        const found = CATEGORIES.find(c => c.id === catId);
        return found || { icon: Layers, color: 'slate' };
    };

    const totalPlantCost = summary.reduce((acc, s) => acc + (s._sum?.amount || 0), 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Analítica de Costos" subtitle="Control financiero del flujo de valor industrial">
                <Button variant="primary" onClick={() => setModalOpen(true)}>Registrar Rubro</Button>
            </PageHeader>

            {error && <div className="alert alert-danger mb-6">{error}</div>}

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                    <div className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Costo Total de Operación</p>
                        <h2 className="text-3xl font-black text-white">${totalPlantCost.toLocaleString()} <span className="text-xs text-slate-500">COP</span></h2>
                        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
                            <TrendingDown size={14} /> -2.4% VS MES ANTERIOR
                        </div>
                    </div>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <div className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Órdenes Costeadas</p>
                        <h2 className="text-3xl font-black text-white">{new Set(records.map(r => r.orderId)).size}</h2>
                        <p className="text-[10px] text-slate-600 mt-2">Distribución en {summary.length} categorías activas</p>
                    </div>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <div className="p-6 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Rubro Más Impactante</p>
                        <h2 className="text-xl font-black text-blue-400 uppercase truncate">
                            {summary.sort((a,b) => (b._sum?.amount||0) - (a._sum?.amount||0))[0]?.category || 'N/A'}
                        </h2>
                        <p className="text-[10px] text-slate-600 mt-2">Basado en acumulado histórico</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Categorías Principales */}
                <div className="lg:col-span-4 space-y-4">
                    <Card title="Estructura por Rubro" noPadding>
                        <div className="divide-y divide-slate-800/50">
                            {summary.map((s, idx) => {
                                const styles = getCategoryStyles(s.category);
                                return (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl bg-${styles.color}-500/10 text-${styles.color}-400`}>
                                                <styles.icon size={16} />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{s.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-white">${(s._sum?.amount || 0).toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-slate-600">
                                                {totalPlantCost > 0 ? (( (s._sum?.amount || 0) / totalPlantCost * 100 ).toFixed(1)) : '0.0'}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {!summary.length && <p className="text-center py-10 text-slate-600 text-[10px] font-bold uppercase">Sin datos registrados</p>}
                        </div>
                    </Card>
                </div>

                {/* Detalle por Orden */}
                <div className="lg:col-span-8">
                    <Card title="Impacto en Órdenes de Producción" noPadding>
                        <div className="table-responsive">
                            <table className="table w-full">
                                <thead className="bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Orden / Producto</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Último Gasto</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest">Costo Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {Object.entries(records.reduce((acc, r) => {
                                        const key = r.order?.id || 'unknown';
                                        if (!acc[key]) acc[key] = { name: r.order?.orderNumber, product: r.order?.product, total: 0, last: r.category };
                                        acc[key].total += r.amount;
                                        return acc;
                                    }, {})).map(([id, data]) => (
                                        <tr key={id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-white">{data.name}</p>
                                                <p className="text-[10px] text-slate-500">{data.product}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="ghost" className="border-slate-700 text-[9px] uppercase">{data.last}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-indigo-400">${data.total.toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Historial General */}
            <Card title="Historial de Movimientos de Costo" noPadding>
                <div className="table-responsive">
                    <table className="table w-full">
                        <thead className="bg-slate-800/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-600">Fecha</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-600">Rubro</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-600">Descripción / Orden</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {records.map((r) => {
                                const styles = getCategoryStyles(r.category);
                                return (
                                    <tr key={r.id} className="hover:bg-slate-800/10 text-xs">
                                        <td className="px-6 py-4 text-slate-500 font-medium">{new Date(r.recordedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <styles.icon size={14} className={`text-${styles.color}-500`} />
                                                <span className="font-bold text-slate-200">{r.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-300 font-medium">{r.description || 'Sin nota'}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{r.order?.orderNumber}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-white">${r.amount.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Registro */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registrar Rubro de Costo Industrial"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createRecord}>Guardar Registro</Button></div>}
            >
                <div className="p-6 flex flex-col gap-5">
                    <div className="form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Seleccionar Rubro</label>
                        <select 
                            className="form-input" 
                            value={isCustom ? 'CUSTOM' : form.category} 
                            onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                            <option value="CUSTOM">+ Definir Rubro Personalizado...</option>
                        </select>
                    </div>

                    {isCustom && (
                        <div className="form-group animate-slide-up">
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">Nombre del Nuevo Rubro</label>
                            <input 
                                className="form-input border-blue-500/50 bg-blue-500/5" 
                                placeholder="Ej: Servicios de Limpieza Especializada" 
                                value={form.category} 
                                onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} 
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Monto a Digitar</label>
                            <input className="form-input text-lg font-black text-blue-400" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0" />
                        </div>
                        <div className="form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Moneda</label>
                            <input className="form-input font-bold text-slate-400" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} readOnly />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Vincular a Orden de Producción</label>
                        <select className="form-input" value={form.orderId} onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}>
                            <option value="">Selecciona orden</option>
                            {orders.map((o) => <option key={o.id} value={o.id}>{o.orderNumber} - {o.product}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Justificación / Descripción</label>
                        <textarea className="form-input" rows="3" placeholder="Detalle del gasto o rubro..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
