import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Clock, 
    Info, 
    Layers, 
    History, 
    Download, 
    Edit3,
    CheckCircle2,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '../../components/ui';
import apiClient from '../../api/client';

export default function FOSDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fos, setFos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFos = async () => {
            try {
                const res = await apiClient.get(`/fos/${id}`);
                setFos(res.data);
            } catch (err) {
                setError('No se pudo cargar la información del estándar.');
            } finally {
                setLoading(false);
            }
        };
        fetchFos();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Ingeniería...</p>
        </div>
    );

    if (error || !fos) return (
        <Card className="max-w-2xl mx-auto mt-10 p-10 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Error de Sincronización</h3>
            <p className="text-gray-500 mt-2">{error || 'El estándar solicitado no existe.'}</p>
            <Button variant="primary" className="mt-6" onClick={() => navigate('/fos')}>Volver a la Lista</Button>
        </Card>
    );

    return (
        <div className="animate-fade-in w-full max-w-[1400px] mx-auto pb-20">
            <div className="mb-6">
                <button 
                    onClick={() => navigate('/fos')}
                    className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft size={16} className="mr-1" /> Volver al Gemba
                </button>
            </div>

            <PageHeader 
                title={fos.nombreProceso} 
                subtitle={`Código de Ingeniería: ${fos.code} | Estación: ${fos.workstation?.name || 'N/A'}`}
            >
                <div className="flex gap-3">
                    <Button variant="ghost" className="border border-gray-200 font-bold">
                        <Download size={16} className="mr-2" /> Exportar PDF
                    </Button>
                    <Button variant="primary" className="bg-blue-600 font-bold px-8">
                        <Edit3 size={16} className="mr-2" /> EDITAR INGENIERÍA
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Steps */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card title="Secuencia de Operación Estándar (SOE)" icon={<Layers size={18} className="text-blue-600" />}>
                        <div className="divide-y divide-gray-100">
                            {fos.foeData?.etapas?.length > 0 ? (
                                fos.foeData.etapas.map((step, idx) => (
                                    <div key={idx} className="py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{step.etapa_principal || 'Paso sin nombre'}</p>
                                            <p className="text-xs text-gray-500 mt-1">{step.puntos_clave || 'Sin puntos clave definidos para esta etapa.'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center text-blue-600 font-black text-sm">
                                                <Clock size={12} className="mr-1" /> {step.tiempo || '0s'}
                                            </div>
                                            <Badge variant="neutral" className="mt-1 text-[9px]">MANUAL</Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <Layers size={40} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Sin pasos definidos</p>
                                    <p className="text-gray-300 text-xs mt-1">El estándar aún no tiene una secuencia de pasos definida.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Puntos de Calidad y Seguridad" icon={<CheckCircle2 size={18} className="text-green-600" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center">
                                    <AlertTriangle size={12} className="mr-2" /> Seguridad (EPI)
                                </h4>
                                <p className="text-xs text-red-800 leading-relaxed">
                                    {fos.foeData?.pie?.seguridad || 'Uso obligatorio de guantes de nitrilo y protección ocular durante toda la operación.'}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center">
                                    <CheckCircle2 size={12} className="mr-2" /> Calidad (Punto de Control)
                                </h4>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    {fos.foeData?.pie?.calidad || 'Verificar el torque de los tornillos T1 y T2 antes de proceder al sellado.'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="flex flex-col gap-6">
                    <Card title="Metadatos del Estándar" icon={<Info size={18} className="text-indigo-600" />}>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">Estado Actual</span>
                                <Badge variant={fos.estado === 'active' ? 'success' : 'neutral'}>
                                    {fos.estado?.toUpperCase() || 'BORRADOR'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">Versión</span>
                                <span className="text-sm font-black text-gray-800">v{fos.versionActual}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">Tiempo Total (TAKT)</span>
                                <span className="text-sm font-black text-blue-600">
                                    {fos.foeData?.etapas?.reduce((acc, s) => acc + (parseInt(s.tiempo) || 0), 0)}s
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">UET</span>
                                <span className="text-sm font-semibold text-gray-700">{fos.workstation?.uet?.name || 'Planta Principal'}</span>
                            </div>
                        </div>
                    </Card>

                    <Card title="Historial de Cambios" icon={<History size={18} className="text-amber-600" />}>
                        <div className="flex flex-col gap-4">
                            <div className="relative pl-6 pb-4 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                                <p className="text-xs font-black text-gray-800">v{fos.versionActual} - Actual</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Hoy</p>
                                <p className="text-xs text-gray-600 mt-2 italic">"{fos.changelog || 'Creación inicial del estándar operativo.'}"</p>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase text-blue-600 tracking-tighter">
                                Ver todo el historial <ArrowRight size={12} className="ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
