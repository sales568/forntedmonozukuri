import { Card, StatCard } from '../../components/ui';
import { Wrench, Clock, AlertOctagon, CheckCircle2, TrendingDown, Activity } from 'lucide-react';

export default function MaintenanceDashboard({ breakdowns = [] }) {
    // Calculamos KPIs reales basados en los datos
    const totalBreakdowns = breakdowns.length;
    const resolvedBreakdowns = breakdowns.filter(b => b.status === 'resolved').length;
    const openBreakdowns = totalBreakdowns - resolvedBreakdowns;
    const totalDowntime = breakdowns.reduce((acc, b) => acc + (b.downtimeMin || 0), 0);
    
    // Simulación de MTTR (Mean Time To Repair)
    const mttr = totalBreakdowns > 0 ? (totalDowntime / totalBreakdowns).toFixed(1) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
            {/* KPIs de Mantenimiento */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    icon={AlertOctagon} 
                    label="Averías Totales" 
                    value={totalBreakdowns} 
                    color="red" 
                />
                <StatCard 
                    icon={Clock} 
                    label="MTTR (Tiempo Medio)" 
                    value={`${mttr} min`} 
                    color="blue" 
                />
                <StatCard 
                    icon={CheckCircle2} 
                    label="Eficiencia Cierre" 
                    value={totalBreakdowns > 0 ? `${Math.round((resolvedBreakdowns / totalBreakdowns) * 100)}%` : '100%'} 
                    color="green" 
                />
            </div>

            {/* Disponibilidad y Tendencia */}
            <div className="md:col-span-4">
                <Card noPadding>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disponibilidad Línea</p>
                            <p className="text-3xl font-black text-gray-800">94.8%</p>
                            <div className="flex items-center gap-1 mt-2 text-green-600 font-bold text-xs">
                                <TrendingDown size={12} className="rotate-180" /> +1.2% vs ayer
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl">
                            <Activity size={32} className="text-blue-600 animate-pulse" />
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Mensaje de IA sobre Mantenimiento */}
            <div className="md:col-span-12">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-4">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                        <Wrench size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-tight">Análisis Predictivo Monozukuri</p>
                        <p className="text-xs text-slate-400">
                            Detectada recurrencia en <strong>Prensa Hidráulica L1</strong>. Se recomienda revisión de filtros y niveles de aceite antes del próximo turno para evitar paros no programados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
