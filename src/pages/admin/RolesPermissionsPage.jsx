import { useState, useEffect, Fragment } from 'react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import apiClient from '../../api/client';
import { Shield, Lock, Settings, Users, Save, RefreshCw, AlertCircle } from 'lucide-react';

const RolesPermissionsPage = () => {
    const [roles, setRoles] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Recursos y acciones definidos en el backend (según seed.js)
    const resources = [
        'fos', 'production_order', 'quality', 'maintenance',
        'inventory', 'competencies', 'safety', 'kaizen', 'costs', 'dashboard', 'admin', 'plants', 'users'
    ];
    const actions = ['create', 'read', 'update', 'delete'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [rolesRes, matrixRes] = await Promise.all([
                apiClient.get('/admin/roles'),
                apiClient.get('/admin/permissions-matrix')
            ]);

            setRoles(rolesRes.data);
            setMatrix(matrixRes.data);
        } catch (err) {
            console.error("Error al cargar datos de roles:", err);
            setError("No se pudo conectar con el servidor para obtener la matriz de permisos.");

            // Fallback para evitar pantalla en blanco en desarrollo si falla la API
            setRoles([
                { id: '1', name: 'admin_global' },
                { id: '2', name: 'admin_empresa' },
                { id: '3', name: 'supervisor_produccion' },
                { id: '4', name: 'operario' }
            ]);
            setMatrix([
                { role: 'admin_global', permissions: resources.map(r => ({ resource: r, actions: ['read'] })) }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (roleName, resource, action) => {
        const roleMatrix = matrix.find(m => m.role === roleName);
        if (!roleMatrix) return false;
        const resPerms = roleMatrix.permissions.find(p => p.resource === resource);
        return resPerms ? resPerms.actions.includes(action) : false;
    };

    const togglePermission = (roleName, resource, action) => {
        setMatrix(prev => {
            const newMatrix = [...prev];
            let roleIdx = newMatrix.findIndex(m => m.role === roleName);

            if (roleIdx === -1) {
                newMatrix.push({ role: roleName, permissions: [] });
                roleIdx = newMatrix.length - 1;
            }

            const roleMatrix = { ...newMatrix[roleIdx] };
            const perms = [...roleMatrix.permissions];
            const resIdx = perms.findIndex(p => p.resource === resource);

            if (resIdx === -1) {
                perms.push({ resource, actions: [action] });
            } else {
                const resPerm = { ...perms[resIdx] };
                if (resPerm.actions.includes(action)) {
                    resPerm.actions = resPerm.actions.filter(a => a !== action);
                } else {
                    resPerm.actions = [...resPerm.actions, action];
                }
                perms[resIdx] = resPerm;
            }

            roleMatrix.permissions = perms;
            newMatrix[roleIdx] = roleMatrix;
            return newMatrix;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // El backend guarda por rol. Iteramos y guardamos los que existen en roles.
            const savePromises = roles.map(role => {
                const roleMatrix = matrix.find(m => m.role === role.name);
                if (!roleMatrix) return Promise.resolve();
                return apiClient.put(`/admin/permissions-matrix/${role.name}`, {
                    permissions: roleMatrix.permissions
                });
            });

            await Promise.all(savePromises);
            alert("✅ Matriz de permisos sincronizada correctamente.");
        } catch (err) {
            console.error("Error al guardar permisos:", err);
            alert("❌ Error al guardar los cambios: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={48} className="text-blue-500 animate-spin" />
                <span className="text-[12px] font-black text-gray-500 uppercase tracking-[0.5em]">Sincronizando Gemba...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader
                title="Administración de Roles y Atribuciones"
                subtitle="Configuración de seguridad RBAC basada en el modelo de recursos y acciones Gemba."
            />

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <div className="flex justify-between items-center bg-[#1e293b]/40 p-6 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="flex gap-4">
                    <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-400 px-5 py-2 rounded-xl">
                        <Lock size={14} className="mr-2" /> {roles.length} Niveles de Acceso
                    </Badge>
                    <Badge variant="outline" className="border-gray-700 bg-gray-800 text-gray-400 px-5 py-2 rounded-xl">
                        <Shield size={14} className="mr-2" /> Protocolo AES-RBAC
                    </Badge>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={fetchData} className="rounded-2xl border-gray-700 hover:bg-gray-800 transition-all">
                        <RefreshCw size={18} className="mr-2" /> Actualizar
                    </Button>
                    <Button onClick={handleSave} loading={saving} className="rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 px-8">
                        <Save size={18} className="mr-2" /> Confirmar Cambios
                    </Button>
                </div>
            </div>

            <Card noPadding className="border-gray-800 bg-[#0f172a]/40 shadow-inner">
                <div className="overflow-x-auto rounded-3xl">
                    {/* Header del Grid */}
                    <div
                        className="grid bg-[#111827] border-b border-gray-800 sticky top-0 z-20 group"
                        style={{ gridTemplateColumns: `minmax(300px, 1.2fr) repeat(${roles.length}, 180px)` }}
                    >
                        <div className="px-10 py-12 flex items-end">
                            <span className="text-[12px] font-black uppercase tracking-[0.6em] text-gray-600 group-hover:text-gray-400 transition-colors">
                                Matriz de Capacidades
                            </span>
                        </div>
                        {roles.map(role => (
                            <div key={role.id} className="px-4 py-10 flex flex-col items-center justify-end border-l border-gray-800/80 bg-gray-900/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Shield size={60} />
                                </div>
                                <div className="p-4 bg-blue-500/10 rounded-2xl mb-6 text-blue-400 shadow-glow transition-transform hover:scale-110 cursor-default">
                                    <Users size={24} />
                                </div>
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] text-center leading-snug px-2">
                                    {role.name.replace('_', ' ')}
                                </span>
                                <span className="text-[9px] font-bold text-gray-600 mt-2 uppercase tracking-tighter">ROLE_ID: {role.id.substring(0, 8)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Cuerpo del Grid */}
                    <div className="flex flex-col">
                        {resources.map(resource => (
                            <Fragment key={resource}>
                                {/* Separador de Módulo */}
                                <div
                                    className="bg-[#1e293b] border-y border-gray-800 py-6 px-10 flex items-center gap-6"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                        <Settings size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-white uppercase tracking-[0.5em]">
                                            {resource}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Recurso de Sistema</span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-gray-700 via-gray-800 to-transparent ml-4"></div>
                                </div>

                                {actions.map((action, aIdx) => (
                                    <div
                                        key={`${resource}-${action}`}
                                        className={`grid hover:bg-white/[0.03] transition-all duration-300 border-b border-gray-800/80 group items-center`}
                                        style={{ gridTemplateColumns: `minmax(300px, 1.2fr) repeat(${roles.length}, 180px)` }}
                                    >
                                        {/* Detalle de Atribución */}
                                        <div className="px-10 py-8 flex flex-col justify-center border-r border-gray-800/30">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${action === 'delete' ? 'bg-red-500' :
                                                        action === 'create' ? 'bg-green-500' :
                                                            action === 'update' ? 'bg-yellow-500' : 'bg-blue-500'
                                                    } opacity-40 shadow-glow`}></div>
                                                <span className="text-base font-bold text-gray-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                                    {action === 'create' ? 'Crear' : action === 'read' ? 'Consultar' : action === 'update' ? 'Modificar' : 'Eliminar'} {resource}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 ml-5">
                                                {action.toUpperCase()}_{resource.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Switches por Rol */}
                                        {roles.map(role => {
                                            const isActive = hasPermission(role.name, resource, action);
                                            return (
                                                <div key={role.id} className="px-4 py-8 flex items-center justify-center border-l border-gray-800/20 group-hover:bg-blue-600/[0.01]">
                                                    <button
                                                        onClick={() => togglePermission(role.name, resource, action)}
                                                        className={`relative w-[60px] h-8 rounded-full transition-all duration-300 transform active:scale-90 border-2 ${isActive
                                                                ? 'bg-blue-600/90 border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                                : 'bg-[#1f2937] border-gray-700/50 hover:border-gray-500 shadow-inner'
                                                            }`}
                                                    >
                                                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center shadow-xl ${isActive
                                                                ? 'translate-x-[28px] bg-white'
                                                                : 'translate-x-0 bg-gray-400 opacity-60'
                                                            }`}>
                                                            {isActive && (
                                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
                                                            )}
                                                        </div>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="mt-12 p-8 bg-[#1e293b]/30 border border-gray-800 rounded-[2.5rem] flex gap-8 items-center">
                <div className="p-5 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-glow">
                    <Shield size={32} />
                </div>
                <div className="flex-1 space-y-2">
                    <h4 className="text-xl font-black text-white uppercase tracking-wider">Protocolo de Integridad Corporativa</h4>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-4xl font-medium">
                        Esta configuración define el núcleo reactivo de los permisos del sistema. Cada modificación es auditada
                        y sincronizada con la base de datos central en tiempo real tras la confirmación.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RolesPermissionsPage;
