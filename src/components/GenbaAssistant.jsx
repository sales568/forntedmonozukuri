import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, X, HelpCircle, Lightbulb, ShieldAlert, Zap, Wallet } from 'lucide-react';
import { Badge } from './ui';

const CONTEXT_MAP = {
    '/dashboard': {
        title: 'Tablero de Control',
        message: 'Bienvenido al centro de mando. Aquí puedes ver el OEE global y las alertas críticas de todas las líneas en tiempo real.',
        tips: [
            'Los indicadores rojos requieren intervención inmediata.',
            'Haz clic en una gráfica para profundizar en los datos.'
        ],
        icon: Activity
    },
    '/fos': {
        title: 'Estandarización (FOS)',
        message: 'Estás en el corazón de la ingeniería. La FOS garantiza que todos trabajemos con el mejor método conocido.',
        tips: [
            'Asegúrate de que las fotos sean claras y muestren el punto de control.',
            'Los tiempos deben medirse en condiciones normales de operación.'
        ],
        icon: Zap
    },
    '/production': {
        title: 'Gestión de Producción',
        message: 'Aquí controlamos el flujo de valor. Registra tus avances para que el sistema calcule el cumplimiento del plan.',
        tips: [
            'No olvides registrar el scrap; es vital para el análisis de costos.',
            'Usa los eventos de tiempo para justificar paros de línea.'
        ],
        icon: Zap
    },
    '/labor': {
        title: 'Mano de Obra',
        message: 'Gestiona el talento de la planta. Un equipo bien asignado es un equipo productivo.',
        tips: [
            'Verifica la matriz de habilidades antes de asignar a un operario.',
            'Mantén actualizados los perfiles para auditorías de calidad.'
        ],
        icon: Lightbulb
    },
    '/quality': {
        title: 'Control de Calidad',
        message: 'Cero defectos es la meta. Cada inspección previene que un error llegue al cliente.',
        tips: [
            'Reporta cualquier anomalía aunque no esté en el checklist.',
            'Adjunta fotos de los defectos para el análisis de causa raíz.'
        ],
        icon: ShieldAlert
    },
    '/kaizen': {
        title: 'Mejora Continua (Kaizen)',
        message: 'Pequeños cambios, grandes impactos. Aquí es donde transformamos los problemas en oportunidades de ahorro.',
        tips: [
            'Observa los cuellos de botella; ahí suele haber una idea Kaizen.',
            'Usa el botón de IA para ver qué mejoras sugiere el sistema según tus datos.'
        ],
        icon: Lightbulb
    },
    '/phva': {
        title: 'Tablero PHVA (PDCA)',
        message: 'Este es el motor de tu planta. El ciclo Planear-Hacer-Verificar-Actuar asegura que ninguna mejora se quede a medias.',
        tips: [
            'Planear: Define objetivos claros antes de actuar.',
            'Hacer: Ejecuta las tareas y registra las evidencias.',
            'Verificar: Compara los resultados con lo planeado. ¿Funcionó?',
            'Actuar: Si funcionó, estandariza. Si no, ajusta el plan.',
            'Ojo: Si tienes mucho en "Hacer" y nada en "Verificar", tienes un cuello de botella en el seguimiento.'
        ],
        icon: Activity
    },
    '/costs': {
        title: 'Analítica de Costos Industriales',
        message: 'Aquí es donde la eficiencia se convierte en rentabilidad. Este módulo rastrea cada centavo invertido en tus órdenes de producción.',
        tips: [
            'Organización: Arriba verás el resumen global; a la izquierda, los rubros dominantes; y a la derecha, qué órdenes son las más costosas.',
            'Estrategia: Los rubros como "Scrap" y "Retrabajos" son costos de no-calidad. Si suben, tu eficiencia real baja.',
            'Toma de decisiones: Usa el historial inferior para auditar registros inusuales y ajustar tus precios o procesos.',
            'Rubros Estratégicos: No olvides registrar los costos de "Mejora" y "Formación"; son inversiones para reducir costos futuros.'
        ],
        icon: Wallet
    }
};

const DEFAULT_CONTEXT = {
    title: 'Asistente Monozukuri',
    message: 'Estoy aquí para apoyarte en la excelencia operativa. Explora los módulos y optimiza tu proceso Gemba.',
    tips: [
        'Usa el buscador para encontrar órdenes rápidamente.',
        'Reporta cualquier duda a tu supervisor desde el centro de mensajes.'
    ],
    icon: HelpCircle
};

export default function GenbaAssistant() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState(DEFAULT_CONTEXT);
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
        const path = location.pathname;
        const newContext = CONTEXT_MAP[path] || DEFAULT_CONTEXT;
        setContext(newContext);
        
        // Mostrar burbuja de sugerencia brevemente al cambiar de página
        setShowBubble(true);
        const timer = setTimeout(() => setShowBubble(false), 5000);
        return () => clearTimeout(timer);
    }, [location]);

    return (
        <>
            {/* Botón Flotante */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4">
                {showBubble && !isOpen && (
                    <div className="bg-white dark:bg-slate-900 border border-blue-500/30 p-3 rounded-2xl shadow-2xl animate-bounce-subtle max-w-xs transition-all">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Tip de {context.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">¿Necesitas ayuda con esta función?</p>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 ${
                        isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:scale-110'
                    }`}
                >
                    {isOpen ? <X className="text-white" /> : <Activity className="text-white animate-pulse" />}
                </button>
            </div>

            {/* Panel del Asistente */}
            {isOpen && (
                <div className="fixed inset-0 z-[9998] flex justify-end items-end p-8 bg-slate-900/20 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
                    <div 
                        className="w-full max-w-sm bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <context.icon size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Asistente Genba AI</p>
                                <h3 className="text-lg font-black">{context.title}</h3>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                                <p className="text-xs leading-relaxed text-slate-300 italic">
                                    "{context.message}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recomendaciones de ingeniería</p>
                                {context.tips.map((tip, i) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="mt-0.5"><Badge variant="info" className="w-5 h-5 flex items-center justify-center p-0 rounded-full">{i + 1}</Badge></div>
                                        <p className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Powered by Monozukuri Intelligence</p>
                            <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors">ENTENDIDO</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}} />
        </>
    );
}
