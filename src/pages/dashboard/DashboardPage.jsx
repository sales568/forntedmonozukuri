import { useEffect, useState } from 'react';
import { StatCard, Card, Badge, Modal, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Target, TrendingUp, AlertTriangle, Wrench, Activity, Flame, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const ProgressBar = ({ label, percentage, colorClass }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <span className="text-sm font-black text-gray-900">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const [kpis, setKpis] = useState(null);
    const [error, setError] = useState('');
    const [drilldown, setDrilldown] = useState(null);

    const handleChartClick = (data, type) => {
        if (!data || !data.activePayload || data.activePayload.length === 0) return;
        const area = data.activePayload[0].payload.area;
        const details = generateDrilldownData(area, type);
        setDrilldown({ area, type, data: details });
    };

    const generateDrilldownData = (area, type) => {
        const data = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            if (type === 'Mantenimiento') {
                data.push({ fecha: dateStr, evento: i % 2 === 0 ? 'Paro Menor (Sensor)' : 'Mantenimiento PM', tiempo: `${15 + Math.floor(Math.random() * 45)} min`, responsable: 'Técnico L' + (1 + (i % 3)) });
            } else if (type === 'Seguridad') {
                data.push({ fecha: dateStr, evento: i === 2 ? 'Incidente: Corte leve' : 'Auditoría 5S OK', puntaje: i === 2 ? '-' : `${85 + Math.floor(Math.random() * 15)}%`, estado: i === 2 ? 'Investigado' : 'Aprobado' });
            } else {
                data.push({ fecha: dateStr, lote: `LOT-${10045 + i}`, ftq: `${80 + Math.floor(Math.random() * 20)}%`, scrap: `${Math.floor(Math.random() * 8)}%` });
            }
        }
        return data;
    };

    useEffect(() => {
        const loadKpis = async () => {
            setError('');
            try {
                const res = await apiClient.get('/dashboards/kpis');
                setKpis(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudieron cargar KPIs');
            }
        };
        loadKpis();
    }, []);

    const uetPerformance = [
        { uet: 'UET Soldadura', value: 92 },
        { uet: 'UET Pintura', value: 85 },
        { uet: 'UET Ensamble Final', value: 78 }
    ];

    const maintenanceData = [
        { area: 'Extrusión', paros: 12, mttr: 45 },
        { area: 'Soldadura', paros: 8, mttr: 30 },
        { area: 'Pintura', paros: 3, mttr: 15 },
        { area: 'Ensamble', paros: 5, mttr: 20 }
    ];

    const safetyData = [
        { area: 'Extrusión', auditoria5S: 82, incidentes: 2 },
        { area: 'Soldadura', auditoria5S: 75, incidentes: 1 },
        { area: 'Pintura', auditoria5S: 95, incidentes: 0 },
        { area: 'Ensamble', auditoria5S: 90, incidentes: 0 }
    ];

    const qualityData = [
        { area: 'Extrusión', ftq: 85, scrap: 15 },
        { area: 'Soldadura', ftq: 92, scrap: 8 },
        { area: 'Pintura', ftq: 98, scrap: 2 },
        { area: 'Ensamble', ftq: 95, scrap: 5 }
    ];

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto pb-10 px-4 md:px-0">
            {/* Header Section - Más aireado */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-white">Tablero de Mando Corporativo</h1>
                    <p className="text-base font-medium text-gray-500 mt-2">
                        Bienvenido, <span className="text-blue-600 font-bold">{user?.name}</span> • Operaciones en Tiempo Real
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                        <Activity size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">OEE Global</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">82.4%</p>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger mb-6">{error}</div>}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard icon={Target} label="Órdenes Activas" value={`${kpis?.activeOrders ?? '3'}`} color="blue" />
                <StatCard icon={TrendingUp} label="Cumplimiento Plan" value="94.2%" color="green" />
                <StatCard icon={ShieldAlert} label="Inspecciones Calidad" value={`${kpis?.inspectionsToday ?? '12'}`} color="yellow" />
                <StatCard icon={AlertTriangle} label="Paros de Línea" value={`${kpis?.openBreakdowns ?? '1'}`} color="red" />
            </div>

            {/* Charts Grid: Mantenimiento, Seguridad, Calidad */}
            <div className="stat-grid" style={{ marginBottom: '40px' }}>
                {/* Mantenimiento por Área */}
                <Card title="Mantenimiento por Área">
                    <div style={{ height: '240px', width: '100%', paddingTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={maintenanceData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }} onClick={(e) => handleChartClick(e, 'Mantenimiento')} style={{ cursor: 'pointer' }}>
                                <XAxis dataKey="area" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }} />
                                <Bar dataKey="paros" name="Cant. Paros" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="mttr" name="MTTR (min)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Seguridad y 5S por Área */}
                <Card title="Seguridad y 5S por Área">
                    <div style={{ height: '240px', width: '100%', paddingTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safetyData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }} onClick={(e) => handleChartClick(e, 'Seguridad')} style={{ cursor: 'pointer' }}>
                                <XAxis dataKey="area" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }} />
                                <Bar dataKey="auditoria5S" name="Nota 5S (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="incidentes" name="Incidentes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Calidad por Área */}
                <Card title="Calidad (FTQ vs Scrap)">
                    <div style={{ height: '240px', width: '100%', paddingTop: '16px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={qualityData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }} onClick={(e) => handleChartClick(e, 'Calidad')} style={{ cursor: 'pointer' }}>
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="area" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }} />
                                <Bar dataKey="ftq" name="FTQ (%)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} barSize={24} />
                                <Bar dataKey="scrap" name="Scrap (%)" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Layout Principal: 2 Columnas (8+4) - Activado desde MD */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">

                {/* Lado IZQUIERDO - OEE y Alertas Detalladas (8 Col) */}
                <div className="md:col-span-8 space-y-8 md:space-y-10">
                    <Card title="Eficiencia del Proceso (OEE)" noPadding>
                        <div className="p-6 md:p-10">
                            <div className="flex flex-row justify-between items-center max-w-[900px] mx-auto px-4">
                                {[
                                    { label: 'Disponibilidad', val: 88, color: '#3b82f6' },
                                    { label: 'Rendimiento', val: 94, color: '#f59e0b' },
                                    { label: 'Calidad', val: 98, color: '#10b981' }
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col items-center">
                                        <div className="relative w-28 h-28 md:w-40 md:h-40 mb-4 md:mb-6 drop-shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-transform hover:scale-110">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-100 dark:text-gray-800/40" />
                                                <circle
                                                    cx="18"
                                                    cy="18"
                                                    r="16"
                                                    fill="none"
                                                    stroke={item.color}
                                                    strokeWidth="2.5"
                                                    strokeDasharray={`${item.val}, 100`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xl md:text-3xl font-black text-gray-800 dark:text-white">{item.val}%</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center opacity-70">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card title="Alertas Gemba en Tiempo Real">
                        <div className="p-4 md:p-6">
                            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                                {[
                                    { type: 'danger', icon: AlertTriangle, title: 'Paro Robot KUKA A', desc: 'Fallo sensor inductivo en L1 - Urgente', time: '5 min', loc: 'Soldadura' },
                                    { type: 'warning', icon: ShieldAlert, title: 'Cota fuera de rango', desc: 'Fresadora CNC-01 (Lote 44) - Requiere ajuste', time: '12 min', loc: 'Mecanizado' },
                                    { type: 'info', icon: Wrench, title: 'Mantenimiento Aut.', desc: 'Limpieza filtro L5 requerida por estándar', time: '1 h', loc: 'Pintura' }
                                ].map((alert, i) => (
                                    <div key={i} className="p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex gap-3 md:gap-4 items-center">
                                            <div className={`p-2 md:p-3 rounded-xl h-fit ${alert.type === 'danger' ? 'bg-red-100 text-red-600' : alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <alert.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm md:text-base font-bold text-gray-800 dark:text-white">{alert.title}</p>
                                                <p className="text-xs md:text-sm text-gray-500">{alert.desc}</p>
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase mb-1">{alert.loc}</p>
                                            <p className="text-[10px] md:text-xs text-gray-400 font-medium">{alert.time} atrás</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Lado DERECHO - UETs y Actividad (4 Col) */}
                <div className="md:col-span-4 space-y-8 md:space-y-10">

                    <Card title="Estatus de UETs y Estándares">
                        <div className="p-6 md:p-8 space-y-6 md:space-y-8 flex flex-col">
                            {uetPerformance.map((item, idx) => (
                                <ProgressBar
                                    key={idx}
                                    label={item.uet}
                                    percentage={item.value}
                                    colorClass={item.value > 90 ? 'bg-green-500' : item.value > 80 ? 'bg-blue-500' : 'bg-red-500'}
                                />
                            ))}
                            <div className="mt-4 pt-6 md:pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                                <div className="p-3 md:p-4 bg-orange-50 dark:bg-orange-900/10 rounded-full mb-3 md:mb-4">
                                    <Flame size={28} className="text-orange-500" />
                                </div>
                                <p className="text-[10px] md:text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Cultura Monozukuri</p>
                                <p className="text-xs md:text-sm font-medium text-gray-500 mb-2">Adherencia FOS Global</p>
                                <p className="text-2xl md:text-4xl font-bold text-orange-500 tracking-tighter">87.4%</p>
                            </div>
                        </div>
                    </Card>

                    <Card title="Últimos Eventos" noPadding>
                        <div className="p-6 md:p-8 space-y-6 md:space-y-8 relative">
                            {/* Timeline line */}
                            <div className="absolute left-[38px] md:left-[45px] top-10 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-800" />

                            {[
                                { user: 'Juan P.', action: 'completó FOS-SOL-01', time: '10:45 AM' },
                                { user: 'Sist. Calidad', action: 'aprobó Lote 455', time: '10:30 AM' },
                                { user: 'Admin', action: 'subió plantilla Activos', time: '9:15 AM' }
                            ].map((evt, i) => (
                                <div key={i} className="flex gap-4 md:gap-6 relative z-10">
                                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 flex items-center justify-center shadow-sm">
                                        <span className="text-[9px] md:text-[10px] font-bold text-blue-600">{evt.user.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 pt-0.5 md:pt-1">
                                        <p className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-tighter">{evt.time}</p>
                                        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                            <span className="font-bold text-gray-900 dark:text-white">{evt.user}</span> {evt.action}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Drilldown Modal */}
            <Modal 
                isOpen={!!drilldown} 
                onClose={() => setDrilldown(null)} 
                title={`Detalle Histórico: ${drilldown?.type} - ${drilldown?.area}`}
                maxWidth="800px"
                actions={<Button onClick={() => setDrilldown(null)}>Cerrar</Button>}
            >
                {drilldown && (
                    <div style={{ padding: 'var(--space-4)' }}>
                        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            Mostrando el historial detallado fecha a fecha para el área seleccionada.
                        </p>
                        <div style={{ overflowX: 'auto', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
                                    <tr>
                                        {Object.keys(drilldown.data[0]).map(key => (
                                            <th key={key} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {drilldown.data.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            {Object.values(row).map((val, colIdx) => (
                                                <td key={colIdx} style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: colIdx === 0 ? 'bold' : 'normal' }}>
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
