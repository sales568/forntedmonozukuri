import { useEffect, useState } from 'react';
import { Users, UserPlus, Search, ToggleLeft, ToggleRight, Edit2, X, ChevronDown, Plus, Trash2, Layers } from 'lucide-react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';

const EMPTY_FORM = { name: '', email: '', password: '', area: '', position: '', roleId: '', skills: [] };

const roleBadge = (roleName) => {
    const map = {
        admin_global: { label: 'Admin Global', cls: 'bg-purple-100 text-purple-700' },
        admin_empresa: { label: 'Admin Planta', cls: 'bg-blue-100 text-blue-700' },
        supervisor_produccion: { label: 'Supervisor', cls: 'bg-orange-100 text-orange-700' },
        calidad: { label: 'Calidad', cls: 'bg-cyan-100 text-cyan-700' },
        mantenimiento: { label: 'Mantenimiento', cls: 'bg-amber-100 text-amber-700' },
        operario: { label: 'Operario', cls: 'bg-green-100 text-green-700' },
        viewer: { label: 'Viewer', cls: 'bg-gray-100 text-gray-600' },
    };
    const cfg = map[roleName] || { label: roleName, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>;
};

export default function LaborPage() {
    const [workers, setWorkers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    
    const [areasModalOpen, setAreasModalOpen] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [addingArea, setAddingArea] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { _t: Date.now() };
            if (search) params.search = search;
            if (filterArea) params.area = filterArea;

            const [wRes, aRes, rRes, sRes] = await Promise.all([
                apiClient.get('/labor', { params }),
                apiClient.get('/labor/areas'),
                apiClient.get('/admin/roles'),
                apiClient.get('/competencies/skills'),
            ]);
            setWorkers(wRes.data || []);
            setAreas(aRes.data || []);
            setRoles(rRes.data || []);
            setAllSkills(sRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar la nómina de operarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [search, filterArea]);

    const openNew = () => { setEditTarget(null); setForm(EMPTY_FORM); setModalOpen(true); };
    const openEdit = (w) => {
        setEditTarget(w);
        setForm({ 
            name: w.name, 
            email: w.email, 
            password: '', 
            area: w.area || '', 
            position: w.position || '', 
            roleId: w.role?.id || '',
            skills: w.userSkills?.map(us => ({ skillId: us.skillId, level: us.level, certified: us.certified })) || []
        });
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditTarget(null); setForm(EMPTY_FORM); };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        const cleanSkills = [];
        const seen = new Set();
        form.skills.forEach(s => {
            if (s.skillId && !seen.has(s.skillId)) {
                cleanSkills.push({
                    skillId: s.skillId,
                    level: Number(s.level),
                    certified: !!s.certified
                });
                seen.add(s.skillId);
            }
        });

        console.log('Enviando skills para operario:', editTarget?.id, cleanSkills);

        try {
            if (editTarget) {
                const response = await apiClient.patch(`/labor/${editTarget.id}`, { 
                    name: form.name, 
                    area: form.area, 
                    position: form.position,
                    isActive: form.isActive !== undefined ? form.isActive : true,
                    skills: cleanSkills 
                });
                console.log('Respuesta PATCH servidor:', JSON.stringify(response.data, null, 2));
                setWorkers(prev => prev.map(w => w.id === editTarget.id ? response.data : w));
                setSuccess('Operario actualizado. Verifica la consola para detalles.');
            } else {
                const response = await apiClient.post('/labor', { ...form, skills: cleanSkills });
                console.log('Respuesta POST servidor:', JSON.stringify(response.data, null, 2));
                setWorkers(prev => [response.data, ...prev]);
                setSuccess('Operario creado.');
            }
            closeModal();
            await loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (worker) => {
        try {
            await apiClient.patch(`/labor/${worker.id}`, { isActive: !worker.isActive });
            await loadData();
        } catch (err) {
            setError('No se pudo cambiar el estado del operario.');
        }
    };

    const handleAddArea = async () => {
        if (!newAreaName.trim()) return;
        setAddingArea(true);
        try {
            await apiClient.post('/labor/areas', { name: newAreaName });
            setNewAreaName('');
            loadData();
            setSuccess('Área creada correctamente.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear el área.');
        } finally {
            setAddingArea(false);
        }
    };

    const handleDeleteArea = async (id) => {
        if (!window.confirm('¿Eliminar esta área? Esto no afectará a los operarios ya asignados, pero dejará de estar disponible en las listas.')) return;
        try {
            await apiClient.delete(`/labor/areas/${id}`);
            loadData();
            setSuccess('Área eliminada correctamente.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo eliminar el área.');
        }
    };

    // Stats
    const total = workers.length;
    const active = workers.filter(w => w.isActive).length;
    const byArea = workers.reduce((acc, w) => { if (w.area) acc[w.area] = (acc[w.area] || 0) + 1; return acc; }, {});

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto pb-10">
            <PageHeader
                title="Mano de Obra"
                subtitle="Control de operarios: creación, áreas, cargos y acceso al sistema"
            >
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setAreasModalOpen(true)} className="font-bold px-4 flex items-center gap-2">
                        <Layers size={16} /> Gestionar Áreas
                    </Button>
                    <Button variant="primary" onClick={openNew} className="font-bold px-6 flex items-center gap-2">
                        <UserPlus size={16} /> Nuevo Operario
                    </Button>
                </div>
            </PageHeader>

            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-semibold">{success}</div>}
            {error && <div className="alert alert-danger mb-6">{error}</div>}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="flex flex-col gap-1 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Nómina</p>
                    <p className="text-3xl font-black text-gray-900">{total}</p>
                    <p className="text-xs text-gray-500">operarios registrados</p>
                </Card>
                <Card className="flex flex-col gap-1 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activos</p>
                    <p className="text-3xl font-black text-green-600">{active}</p>
                    <p className="text-xs text-gray-500">{total - active} inactivos</p>
                </Card>
                <Card className="flex flex-col gap-1 p-5 col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distribución por Área</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(byArea).map(([area, count]) => (
                            <span key={area} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                                {area}: {count}
                            </span>
                        ))}
                        {!Object.keys(byArea).length && <span className="text-xs text-gray-400">Sin áreas asignadas</span>}
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="form-input pl-9 w-full"
                        placeholder="Buscar por nombre, email o cargo..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select
                        className="form-input pr-8 appearance-none"
                        value={filterArea}
                        onChange={e => setFilterArea(e.target.value)}
                    >
                        <option value="">Todas las áreas</option>
                        {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <Card noPadding>
                {loading ? (
                    <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando nómina...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-left">Operario</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-left">Área</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-left">Cargo</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-left">Rol Sistema</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-left">Habilidades</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Estado</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Editar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {workers.map(worker => (
                                    <tr key={worker.id} className={`transition-all group hover:bg-indigo-50/30 ${!worker.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                                    {worker.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{worker.name}</p>
                                                    <p className="text-[11px] text-gray-400">{worker.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-700">{worker.area || <span className="text-gray-300 italic text-xs">Sin área</span>}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{worker.position || <span className="text-gray-300 italic text-xs">Sin cargo</span>}</span>
                                        </td>
                                        <td className="px-6 py-4">{roleBadge(worker.role?.name)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {worker.userSkills?.map(us => (
                                                    <span key={us.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">
                                                        {us.skill?.name} Nv.{us.level}
                                                    </span>
                                                ))}
                                                {!worker.userSkills?.length && <span className="text-[11px] text-gray-300">Sin habilidades</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleActive(worker)}
                                                className="inline-flex items-center gap-1.5 transition-colors"
                                                title={worker.isActive ? 'Desactivar' : 'Activar'}
                                            >
                                                {worker.isActive
                                                    ? <><ToggleRight size={20} className="text-green-500" /><span className="text-[10px] font-bold text-green-600">Activo</span></>
                                                    : <><ToggleLeft size={20} className="text-gray-300" /><span className="text-[10px] font-bold text-gray-400">Inactivo</span></>
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEdit(worker)}
                                                className="p-2 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-700 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Editar"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!workers.length && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-20">
                                            <Users size={40} className="mx-auto text-gray-200 mb-3" />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay operarios registrados.</p>
                                            <p className="text-gray-300 text-xs mt-1">Usa el botón "Nuevo Operario" para comenzar.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editTarget ? `Editar: ${editTarget.name}` : 'Registrar Nuevo Operario'}
                actions={
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : editTarget ? 'Actualizar' : 'Crear Operario'}
                        </Button>
                    </div>
                }
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo *</label>
                            <input className="form-input" placeholder="Ej: Juan Pérez" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico *</label>
                            <input className="form-input" type="email" placeholder="juan@empresa.com" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                disabled={!!editTarget}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Área de Trabajo *</label>
                            <input className="form-input" placeholder="Ej: Soldadura, Pintura, Ensamble" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} list="areas-list" />
                            <datalist id="areas-list">{areas.map(a => <option key={a.id} value={a.name} />)}</datalist>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Cargo *</label>
                            <input className="form-input" placeholder="Ej: Operario Senior, Líder de Celda" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
                        </div>
                        {!editTarget && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Contraseña Inicial</label>
                                    <input className="form-input" type="password" placeholder="Por defecto: Monozukuri2024!" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                                    <p className="text-[10px] text-gray-400">Si se deja vacío, se asigna la contraseña por defecto.</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Rol en el Sistema</label>
                                    <select className="form-input" value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}>
                                        <option value="">Por defecto: Operario</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Skill Assignment Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Habilidades y Competencias</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setForm(p => ({ ...p, skills: [...p.skills, { skillId: '', level: 1, certified: false }] }))}
                                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 h-7"
                            >
                                <Plus size={14} /> AGREGAR SKILL
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {form.skills.map((s, idx) => (
                                <div key={idx} className="flex gap-3 items-end bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Skill / Habilidad</label>
                                        <select 
                                            className="form-input text-sm" 
                                            value={s.skillId} 
                                            onChange={e => {
                                                const newSkills = [...form.skills];
                                                newSkills[idx].skillId = e.target.value;
                                                setForm(p => ({ ...p, skills: newSkills }));
                                            }}
                                        >
                                            <option value="">Selecciona una habilidad</option>
                                            {allSkills.map(sk => {
                                                const isSelected = form.skills.some((os, i) => os.skillId === sk.id && i !== idx);
                                                return (
                                                    <option key={sk.id} value={sk.id} disabled={isSelected}>
                                                        {sk.name} ({sk.category}) {isSelected ? '— Ya seleccionada' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="w-24 flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Nivel (1-4)</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="4" 
                                            className="form-input text-sm text-center" 
                                            value={s.level} 
                                            onChange={e => {
                                                const newSkills = [...form.skills];
                                                newSkills[idx].level = Number(e.target.value);
                                                setForm(p => ({ ...p, skills: newSkills }));
                                            }} 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 items-center pb-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cert.</label>
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-indigo-600 border-gray-300"
                                            checked={s.certified}
                                            onChange={e => {
                                                const newSkills = [...form.skills];
                                                newSkills[idx].certified = e.target.checked;
                                                setForm(p => ({ ...p, skills: newSkills }));
                                            }}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newSkills = form.skills.filter((_, i) => i !== idx);
                                            setForm(p => ({ ...p, skills: newSkills }));
                                        }}
                                        className="mb-1.5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {!form.skills.length && (
                                <p className="text-center py-4 text-xs text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    No hay habilidades asignadas aún.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Manage Areas Modal */}
            <Modal
                isOpen={areasModalOpen}
                onClose={() => setAreasModalOpen(false)}
                title="Gestionar Áreas (UETs)"
                actions={<Button variant="primary" onClick={() => setAreasModalOpen(false)}>Cerrar</Button>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <input 
                            className="form-input flex-1" 
                            placeholder="Nombre de la nueva área..." 
                            value={newAreaName} 
                            onChange={e => setNewAreaName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                        />
                        <Button variant="primary" onClick={handleAddArea} disabled={addingArea || !newAreaName.trim()}>
                            {addingArea ? 'Agregando...' : 'Agregar'}
                        </Button>
                    </div>

                    <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="table w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase">Nombre del Área</th>
                                    <th className="px-4 py-2 text-center text-[11px] font-bold text-gray-500 uppercase w-20">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {areas.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{a.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => handleDeleteArea(a.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!areas.length && (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-8 text-center text-gray-400 text-sm">
                                            No hay áreas registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
