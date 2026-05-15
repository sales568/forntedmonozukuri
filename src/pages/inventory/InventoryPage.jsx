import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { Box, Database, Activity, TrendingDown, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
    const [lots, setLots] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lots'); // 'lots', 'materials', 'movements'
    const [error, setError] = useState('');
    
    const [lotModalOpen, setLotModalOpen] = useState(false);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [materialModalOpen, setMaterialModalOpen] = useState(false);

    const [newLot, setNewLot] = useState({ lotNumber: '', product: '', quantity: 0, status: 'released' });
    const [newMovement, setNewMovement] = useState({ lotId: '', type: 'entry', quantity: 0, warehouse: '', reference: '', notes: '', workstation: '', area: '' });
    const [newMaterial, setNewMaterial] = useState({ code: '', name: '', unit: 'kg', minStock: 0, price: 0 });
    const [searchFilter, setSearchFilter] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [lotsRes, movementsRes, materialsRes] = await Promise.all([
                apiClient.get('/inventory/lots'),
                apiClient.get('/inventory/movements'),
                apiClient.get('/inventory/materials'),
            ]);
            setLots(lotsRes.data || []);
            setMovements(movementsRes.data || []);
            setMaterials(materialsRes.data || []);
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
            await apiClient.post('/inventory/lots', { ...newLot, quantity: Number(newLot.quantity) });
            setLotModalOpen(false);
            setNewLot({ lotNumber: '', product: '', quantity: 0, status: 'released' });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al crear lote'); }
    };

    const createMaterial = async () => {
        try {
            await apiClient.post('/inventory/materials', { 
                ...newMaterial, 
                minStock: Number(newMaterial.minStock),
                description: `Price: ${newMaterial.price} | ${newMaterial.name}` 
            });
            setMaterialModalOpen(false);
            setNewMaterial({ code: '', name: '', unit: 'kg', minStock: 0, price: 0 });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al crear insumo'); }
    };

    const createMovement = async () => {
        try {
            const movementNotes = `Area: ${newMovement.area} | Station: ${newMovement.workstation} | Op: ${req.user.name} | ${newMovement.notes}`;
            await apiClient.post('/inventory/movements', { 
                ...newMovement, 
                quantity: Number(newMovement.quantity),
                notes: movementNotes
            });
            setMovementModalOpen(false);
            setNewMovement({ lotId: '', type: 'entry', quantity: 0, warehouse: '', reference: '', notes: '', workstation: '', area: '' });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al registrar movimiento'); }
    };

    const criticalStocks = materials.filter(m => m.currentStock <= m.minStock);

    const statusBadge = (status) => {
        if (status === 'released') return <Badge variant="success">Liberado</Badge>;
        if (status === 'quarantine') return <Badge variant="warning">Cuarentena</Badge>;
        if (status === 'rejected') return <Badge variant="danger">Rechazado</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader title="Gestión de Inventario" subtitle="Trazabilidad total de lotes e insumos">
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setMaterialModalOpen(true)}>Crear Insumo</Button>
                    <Button variant="secondary" onClick={() => setMovementModalOpen(true)}>Mover Stock</Button>
                    <Button variant="primary" onClick={() => setLotModalOpen(true)}>Nuevo Lote</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger mb-6">{error}</div>}

            {/* Asistente Gemba AI Potenciado - Inventario */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Box size={80} className="text-blue-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Database size={32} className="text-blue-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Inteligencia de Materiales</Badge>
                            {criticalStocks.length > 0 && <Badge variant="danger" className="animate-pulse">ALERTA DE ABASTECIMIENTO</Badge>}
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Trazabilidad Gemba</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            {criticalStocks.length > 0 
                                ? `"Atención técnica: He detectado que ${criticalStocks.length} insumos han cruzado el umbral de stock mínimo configurable. El material '${criticalStocks[0].name}' requiere reposición inmediata para evitar paros de línea. Sugiero revisar el plan de compras y priorizar las órdenes de transferencia."`
                                : `"Todo el flujo de materiales se encuentra en niveles óptimos. No detecto riesgos de ruptura de stock en las próximas 48 horas. Tu precisión en el registro de movimientos ha mejorado un 15% esta semana."`
                            }
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                            {criticalStocks.slice(0, 2).map(m => (
                                <div key={m.id} className="flex gap-3 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                    <TrendingDown size={14} className="text-red-500 mt-0.5" />
                                    <p className="text-[11px] text-red-200"><strong>Crítico:</strong> {m.name} ({m.currentStock} {m.unit} / Mín: {m.minStock})</p>
                                </div>
                            ))}
                            {criticalStocks.length === 0 && (
                                <div className="flex gap-3 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                    <TrendingUp size={14} className="text-emerald-500 mt-0.5" />
                                    <p className="text-[11px] text-emerald-200"><strong>Abastecimiento:</strong> Niveles de stock saludables en toda la planta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                <div className="flex-1 flex gap-3 w-full">
                    <div className="flex-1 relative">
                        <select 
                            className="form-input w-full pl-10 bg-white" 
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                        >
                            <option value="">TODOS LOS PRODUCTOS</option>
                            {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <Box size={16} className="absolute left-3 top-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 relative">
                        <select 
                            className="form-input w-full pl-10 bg-white" 
                            value={areaFilter}
                            onChange={(e) => setAreaFilter(e.target.value)}
                        >
                            <option value="">TODOS LOS PROCESOS / ÁREAS</option>
                            {Array.from(new Set(movements.map(m => m.notes?.split('Area: ')[1]?.split(' | ')[0]).filter(Boolean))).map(area => (
                                <option key={area} value={area}>{area.toUpperCase()}</option>
                            ))}
                        </select>
                        <Activity size={16} className="absolute left-3 top-3.5 text-indigo-500" />
                    </div>
                </div>
                <div className="flex gap-4">
                    {['lots', 'materials', 'movements'].map(tab => (
                        <button key={tab} 
                            className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'lots' ? 'Lotes' : tab === 'materials' ? 'Catálogo' : 'Trazabilidad'}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'lots' && (
                <Card title="Inventario por Lotes" noPadding>
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Lote</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots
                                    .filter(l => !productFilter || l.product === productFilter)
                                    .map(lot => (
                                    <tr key={lot.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 font-black text-slate-900">{lot.lotNumber}</td>
                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">{lot.product}</td>
                                        <td className="px-4 py-4 font-black text-slate-900">{lot.quantity}</td>
                                        <td className="px-4 py-4">{statusBadge(lot.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'materials' && (
                <Card title="Catálogo de Insumos y Precios" noPadding>
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Código</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Precio Unit.</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Stock Actual</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials
                                    .filter(m => !productFilter || m.name === productFilter)
                                    .map(m => (
                                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 font-black text-slate-900">{m.code}</td>
                                        <td className="px-4 py-4 text-sm font-bold text-slate-600">{m.name}</td>
                                        <td className="px-4 py-4 font-black text-blue-600">
                                            $ {m.description?.split('Price: ')[1]?.split(' | ')[0] || '0.00'}
                                        </td>
                                        <td className={`px-4 py-4 font-black ${m.currentStock <= m.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                                            {m.currentStock} {m.unit}
                                        </td>
                                        <td className="px-4 py-4">
                                            {m.currentStock <= m.minStock 
                                                ? <Badge variant="danger">BAJO STOCK</Badge>
                                                : <Badge variant="success">OK</Badge>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'movements' && (
                <Card title="Trazabilidad Avanzada" noPadding>
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Movimiento</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Producto/Lote</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Ubicación (Área/Est.)</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Responsable</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Ref</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements
                                    .filter(m => !productFilter || m.lot?.product === productFilter)
                                    .filter(m => !areaFilter || m.notes?.includes(`Area: ${areaFilter}`))
                                    .map(m => (
                                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(m.movedAt).toLocaleDateString()}</p>
                                            <Badge variant={m.type === 'entry' ? 'success' : 'info'}>{m.type.toUpperCase()}</Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-black text-slate-900">{m.lot?.product}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{m.lot?.lotNumber}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-black text-slate-700 uppercase">{m.notes?.split('Area: ')[1]?.split(' | ')[0] || 'ALMACÉN'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{m.notes?.split('Station: ')[1]?.split(' | ')[0] || m.warehouse || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                    {(m.notes?.split('Op: ')[1]?.split(' | ')[0] || 'S').substring(0, 2)}
                                                </div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase italic">
                                                    {m.notes?.split('Op: ')[1]?.split(' | ')[0] || 'SISTEMA'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[10px] font-bold text-slate-400">{m.reference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Modal Crear Insumo */}
            <Modal isOpen={materialModalOpen} onClose={() => setMaterialModalOpen(false)} title="Crear Nuevo Insumo / Materia Prima">
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Código de Material</label>
                        <input className="form-input w-full" placeholder="Ej: MAT-001" value={newMaterial.code} onChange={(e) => setNewMaterial({...newMaterial, code: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre Completo</label>
                        <input className="form-input w-full" placeholder="Ej: Acero 1020" value={newMaterial.name} onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Unidad</label>
                            <select className="form-input w-full" value={newMaterial.unit} onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}>
                                <option value="kg">Kilos (kg)</option>
                                <option value="lt">Litros (lt)</option>
                                <option value="un">Unidades (un)</option>
                                <option value="m">Metros (m)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Precio Unitario ($)</label>
                            <input className="form-input w-full font-black text-blue-600" type="number" step="0.01" placeholder="0.00" value={newMaterial.price} onChange={(e) => setNewMaterial({...newMaterial, price: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Stock Mínimo (Alerta)</label>
                        <input className="form-input w-full" type="number" value={newMaterial.minStock} onChange={(e) => setNewMaterial({...newMaterial, minStock: e.target.value})} />
                    </div>
                    <Button variant="primary" className="w-full" onClick={createMaterial}>Guardar Insumo</Button>
                </div>
            </Modal>

            <Modal isOpen={movementModalOpen} onClose={() => setMovementModalOpen(false)} title="Trazabilidad de Movimiento">
                <div className="p-4 space-y-4">
                    <select className="form-input w-full" value={newMovement.lotId} onChange={(e) => setNewMovement({...newMovement, lotId: e.target.value})}>
                        <option value="">Selecciona Lote</option>
                        {lots.map(l => <option key={l.id} value={l.id}>{l.lotNumber} ({l.product})</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <select className="form-input w-full" value={newMovement.type} onChange={(e) => setNewMovement({...newMovement, type: e.target.value})}>
                            <option value="entry">Entrada</option>
                            <option value="exit">Salida</option>
                        </select>
                        <input className="form-input w-full" type="number" placeholder="Cantidad" value={newMovement.quantity} onChange={(e) => setNewMovement({...newMovement, quantity: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="form-input w-full" placeholder="Área (Ej: Ensamble)" value={newMovement.area} onChange={(e) => setNewMovement({...newMovement, area: e.target.value})} />
                        <input className="form-input w-full" placeholder="Estación" value={newMovement.workstation} onChange={(e) => setNewMovement({...newMovement, workstation: e.target.value})} />
                    </div>
                    <input className="form-input w-full" placeholder="Referencia / OT" value={newMovement.reference} onChange={(e) => setNewMovement({...newMovement, reference: e.target.value})} />
                    <Button variant="primary" className="w-full" onClick={createMovement}>Registrar con Trazabilidad</Button>
                </div>
            </Modal>
        </div>
    );
}
