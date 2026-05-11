import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import { Factory, Layers, Monitor, Package, AlertCircle, Save, Edit3, X } from 'lucide-react';

export default function PlantConfigurationPage() {
    const [plant, setPlant] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modals
    const [uetModalOpen, setUetModalOpen] = useState(false);
    const [wsModalOpen, setWsModalOpen] = useState(false);
    const [matModalOpen, setMatModalOpen] = useState(false);
    
    // Forms
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({ name: '', nit: '', address: '', country: '', currency: '' });
    const [uetForm, setUetForm] = useState({ name: '', code: '' });
    const [wsForm, setWsForm] = useState({ name: '', code: '', uetId: '' });
    const [matForm, setMatForm] = useState({ code: '', name: '', unit: 'UN', minStock: 0, currentStock: 0 });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [plantRes, matRes] = await Promise.all([
                apiClient.get('/admin/my-plant'),
                apiClient.get('/admin/my-plant/materials')
            ]);
            
            const plantData = plantRes.data;
            setPlant(plantData);
            setInfoForm({
                name: plantData.name || '',
                nit: plantData.nit || '',
                address: plantData.address || '',
                country: plantData.country || '',
                currency: plantData.currency || ''
            });
            setMaterials(matRes.data || []);
        } catch (err) {
            console.error('Error loading configuration:', err);
            setError(err.response?.data?.message || 'No se pudo cargar la configuración de la planta.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updatePlantInfo = async () => {
        try {
            const res = await apiClient.patch('/admin/my-plant', infoForm);
            setPlant(res.data);
            setIsEditingInfo(false);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar información de la empresa.');
        }
    };

    const createUet = async () => {
        if (!uetForm.name || !uetForm.code) return;
        try {
            await apiClient.post('/admin/my-plant/uets', uetForm);
            setUetModalOpen(false);
            setUetForm({ name: '', code: '' });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al crear UET.'); }
    };

    const createWs = async () => {
        if (!wsForm.name || !wsForm.code || !wsForm.uetId) return;
        try {
            await apiClient.post('/admin/my-plant/workstations', wsForm);
            setWsModalOpen(false);
            setWsForm({ name: '', code: '', uetId: '' });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al crear estación de trabajo.'); }
    };

    const createMaterial = async () => {
        if (!matForm.name || !matForm.code) return;
        try {
            await apiClient.post('/admin/my-plant/materials', matForm);
            setMatModalOpen(false);
            setMatForm({ code: '', name: '', unit: 'UN', minStock: 0, currentStock: 0 });
            await loadData();
        } catch (err) { setError(err.response?.data?.message || 'Error al registrar material.'); }
    };

    if (loading) return <div className="p-8 text-center text-muted">Cargando configuración...</div>;
    if (error && !plant) return <div className="p-8 text-center text-danger">{error}</div>;

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader 
                title={`Configuración de Planta: ${plant?.name || 'Cargando...'}`} 
                subtitle="Parámetros base, estructura Gemba y gestión de insumos"
            >
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setMatModalOpen(true)}>
                        <Package size={16} className="mr-2" /> Cargar Insumo
                    </Button>
                    <Button variant="primary" onClick={() => setUetModalOpen(true)}>
                        <Layers size={16} className="mr-2" /> Nueva UET
                    </Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Datos de la Compañía */}
                <div className="flex flex-col gap-6">
                    <Card title="Datos de la Compañía" icon={Factory}>
                        <div className="p-4 flex flex-col gap-4">
                            {isEditingInfo ? (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-black text-blue-900 uppercase">Nombre de Empresa</label>
                                        <input className="form-input mt-1" value={infoForm.name} onChange={e => setInfoForm({...infoForm, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-blue-900 uppercase">NIT (ID Tributario)</label>
                                        <input className="form-input mt-1" value={infoForm.nit} onChange={e => setInfoForm({...infoForm, nit: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-blue-900 uppercase">Dirección Física</label>
                                        <input className="form-input mt-1" value={infoForm.address} onChange={e => setInfoForm({...infoForm, address: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsEditingInfo(false)}>
                                            <X size={14} className="mr-1" /> Cancelar
                                        </Button>
                                        <Button variant="primary" size="sm" className="flex-1" onClick={updatePlantInfo}>
                                            <Save size={14} className="mr-1" /> Guardar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted uppercase">Nombre</span>
                                        <span className="font-bold">{plant?.name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted uppercase">NIT</span>
                                        <span className="font-bold">{plant?.nit || 'No definido'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted uppercase">Tenant Code</span>
                                        <Badge variant="neutral" className="w-fit">{plant?.code}</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted uppercase">Dirección</span>
                                        <span className="font-bold">{plant?.address || 'No definida'}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="mt-2 border border-blue-900/20" onClick={() => setIsEditingInfo(true)}>
                                        <Edit3 size={14} className="mr-2" /> Editar Información
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Inventario Crítico" icon={Package}>
                        <div className="p-0">
                            <table className="table" style={{ width: '100%' }}>
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-[10px] font-black">INSUMO</th>
                                        <th className="text-[10px] font-black text-center">STOCK</th>
                                        <th className="text-[10px] font-black text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map(m => (
                                        <tr key={m.id}>
                                            <td className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{m.name}</span>
                                                    <span className="text-[9px] text-muted">{m.code}</span>
                                                </div>
                                            </td>
                                            <td className="text-center font-bold text-sm">{m.currentStock} {m.unit}</td>
                                            <td className="text-center">
                                                {m.currentStock <= m.minStock ? 
                                                    <Badge variant="danger" className="text-[9px]"><AlertCircle size={10} className="mr-1"/> BAJO</Badge> : 
                                                    <Badge variant="success" className="text-[9px]">OK</Badge>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    {!materials.length && <tr><td colSpan="3" className="text-center py-6 text-muted text-xs italic">No hay materiales registrados.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Estructura Gemba */}
                <div className="xl:col-span-2">
                    <Card title="Estructura Organizativa (Gemba)" icon={Layers}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-sm text-muted">Configura tus áreas productivas y estaciones de trabajo para los formularios.</p>
                                <Button variant="primary" size="sm" onClick={() => setWsModalOpen(true)}>
                                    <Monitor size={14} className="mr-2"/> Nueva Estación
                                </Button>
                            </div>
                            
                            {!plant?.uets?.length ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                    <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h4 className="font-bold text-gray-500">Sin Áreas Configuradas</h4>
                                    <p className="text-xs text-muted mt-2">Crea tu primera UET para empezar a organizar tus estaciones.</p>
                                    <Button variant="primary" size="sm" className="mt-4" onClick={() => setUetModalOpen(true)}>Crear UET Ahora</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {plant.uets.map((uet) => (
                                        <div key={uet.id} className="border-2 border-blue-900/5 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-blue-900 text-lg leading-tight uppercase">{uet.name}</h4>
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">ÁREA ID: {uet.code}</span>
                                                </div>
                                                <Badge variant="blue" className="font-black">{uet.workstations?.length || 0} WS</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                                                {uet.workstations?.map(ws => (
                                                    <div key={ws.id} className="px-3 py-1.5 bg-blue-50/50 text-blue-900 rounded-lg border border-blue-900/10 text-xs font-bold flex items-center shadow-sm">
                                                        <Monitor size={12} className="mr-2 opacity-50" /> {ws.name}
                                                    </div>
                                                ))}
                                                {(!uet.workstations || uet.workstations.length === 0) && (
                                                    <span className="text-[10px] text-muted italic">Sin estaciones en esta área.</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modals de Configuración */}
            <Modal isOpen={uetModalOpen} onClose={() => setUetModalOpen(false)} title="Crear UET (Unidad Elemental de Trabajo)" maxWidth="1000px">
                <div className="p-8 flex flex-col gap-8">
                    <p className="text-lg font-bold text-muted border-l-4 border-blue-500 pl-4">Una UET es un área autónoma de producción (ej. Línea A, Taller Pintura).</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Nombre del Área</label>
                            <input className="gemba-input" placeholder="Ej: Celda de Ensamble" value={uetForm.name} onChange={e => setUetForm({...uetForm, name: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Código de Área</label>
                            <input className="gemba-input" placeholder="Ej: UET-ENS-01" value={uetForm.code} onChange={e => setUetForm({...uetForm, code: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="ghost" size="lg" onClick={() => setUetModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" size="lg" className="px-12 font-black" onClick={createUet}>Crear Área</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={wsModalOpen} onClose={() => setWsModalOpen(false)} title="Registrar Estación de Trabajo" maxWidth="1000px">
                <div className="p-8 flex flex-col gap-8">
                    <p className="text-lg font-bold text-muted border-l-4 border-blue-500 pl-4">Define un puesto de trabajo específico dentro de un área (UET).</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Área de Pertenencia (UET)</label>
                            <select className="gemba-input" value={wsForm.uetId} onChange={e => setWsForm({...wsForm, uetId: e.target.value})}>
                                <option value="">-- Seleccionar --</option>
                                {plant?.uets?.map(uet => <option key={uet.id} value={uet.id}>{uet.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Nombre de la Estación</label>
                            <input className="gemba-input" placeholder="Ej: Puesto Ensamble 1" value={wsForm.name} onChange={e => setWsForm({...wsForm, name: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Código de Estación</label>
                            <input className="gemba-input" placeholder="Ej: WS-001" value={wsForm.code} onChange={e => setWsForm({...wsForm, code: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="ghost" size="lg" onClick={() => setWsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" size="lg" className="px-12 font-black" onClick={createWs}>Registrar Puesto</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={matModalOpen} onClose={() => setMatModalOpen(false)} title="Cargar Nuevo Material / Insumo" maxWidth="1000px">
                <div className="p-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Código Material</label>
                            <input className="gemba-input" placeholder="MZ-MAT-001" value={matForm.code} onChange={e => setMatForm({...matForm, code: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Nombre Material</label>
                            <input className="gemba-input" placeholder="Ej: Tornillos M8" value={matForm.name} onChange={e => setMatForm({...matForm, name: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Unidad</label>
                            <input className="gemba-input" placeholder="KG, UN, LT" value={matForm.unit} onChange={e => setMatForm({...matForm, unit: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Stock Inicial</label>
                            <input className="gemba-input" type="number" value={matForm.currentStock} onChange={e => setMatForm({...matForm, currentStock: Number(e.target.value)})} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="gemba-label">Mínimo (Alerta)</label>
                            <input className="gemba-input" type="number" value={matForm.minStock} onChange={e => setMatForm({...matForm, minStock: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="ghost" size="lg" onClick={() => setMatModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" size="lg" className="px-12 font-black" onClick={createMaterial}>Guardar Material</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
