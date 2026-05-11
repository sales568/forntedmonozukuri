import { useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from './ui';
import apiClient from '../api/client';
import { FileSpreadsheet, Edit3, Download, Save, X, Activity } from 'lucide-react';

export default function ModuleFormats({ module }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [payload, setPayload] = useState({});
    const [extraNotes, setExtraNotes] = useState('');

    const loadForms = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/templates/forms');
            const filtered = res.data.filter(f => f.module === module);
            setForms(filtered);
        } catch (err) {
            setError('Error al cargar formatos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadForms(); }, [module]);

    const downloadTemplate = async (id, title) => {
        try {
            const res = await apiClient.get(`/templates/forms/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Error al descargar plantilla'); }
    };

    const downloadFilledData = async (format = 'excel') => {
        if (!selectedForm) return;
        try {
            const endpoint = format === 'pdf' ? 'download-filled-pdf' : 'download-filled';
            const res = await apiClient.post(`/templates/forms/${selectedForm.id}/${endpoint}`, { payload }, { responseType: 'blob' });
            const extension = format === 'pdf' ? 'pdf' : 'xlsx';
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedForm.title}-Diligenciado.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert(`Error al descargar ${format.toUpperCase()}`); }
    };

    const openForm = (form) => {
        setSelectedForm(form);
        const init = {};
        form.onlineFields.forEach(f => init[f] = '');
        setPayload(init);
        setExtraNotes('');
        setIsModalOpen(true);
    };

    const save = async () => {
        try {
            await apiClient.post(`/templates/forms/${selectedForm.id}/submit`, { 
                payload: { ...payload, observations: extraNotes } 
            });
            setIsModalOpen(false);
            alert('Registro guardado exitosamente en el sistema Gemba.');
        } catch (err) { alert('Error al guardar el registro.'); }
    };

    if (loading) return null;
    if (forms.length === 0) return null;

    return (
        <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-blue-900 flex items-center uppercase tracking-tight">
                        <FileSpreadsheet className="mr-3 text-blue-600" size={24} /> Formatos N1 - Estándares de {module.toUpperCase()}
                    </h3>
                    <p className="text-xs text-muted font-bold mt-1 uppercase">Diligenciamiento de registros oficiales Monozukuri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map(form => (
                    <Card key={form.id} className="border-2 border-blue-900/5 hover:border-blue-900/20 transition-all group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <FileSpreadsheet className="text-blue-600" size={20} />
                                </div>
                                <Badge variant="neutral" className="text-[9px] font-black tracking-widest">{form.sheetName.toUpperCase()}</Badge>
                            </div>
                            <h4 className="font-black text-blue-900 text-sm leading-tight mb-6 h-10 overflow-hidden uppercase">{form.title}</h4>
                            
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="flex-1 border border-gray-200 font-bold text-[9px] px-1" onClick={() => downloadTemplate(form.id, form.title)}>
                                    <Download size={10} className="mr-1"/> EXCEL
                                </Button>
                                <Button variant="primary" size="sm" className="flex-1 font-bold text-[9px] bg-blue-900 px-1" onClick={() => openForm(form)}>
                                    <Edit3 size={10} className="mr-1"/> DILIGENCIAR
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedForm?.title}
                maxWidth="1200px"
            >
                <div className="flex flex-col lg:flex-row bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[700px]">
                    {/* Panel Lateral de IA Asistente */}
                    <div className="w-full lg:w-80 bg-slate-900 text-white p-8 flex flex-col border-r border-slate-800">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <Activity size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Monozukuri AI</p>
                                <p className="text-sm font-bold">Asistente Genba</p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <p className="text-xs font-bold text-blue-300 uppercase mb-2">Contexto del Formato</p>
                                <p className="text-xs leading-relaxed text-slate-300 italic">
                                    "Hola, soy tu asistente de estandarización. Este registro de <strong>{module.toUpperCase()}</strong> es vital para la trazabilidad del proceso. Asegúrate de que los valores sean precisos para evitar desviaciones en el tablero de mando."
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tips de Diligenciamiento</p>
                                <div className="flex gap-3">
                                    <div className="mt-1"><Badge variant="info">1</Badge></div>
                                    <p className="text-[11px] text-slate-400">Verifica que el <strong>Código</strong> coincida con el estándar físico en el puesto.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1"><Badge variant="info">2</Badge></div>
                                    <p className="text-[11px] text-slate-400">Usa las <strong>Notas de Campo</strong> para describir cualquier anomalía detectada en el turno.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-slate-800 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Powered by Monozukuri Intelligence</p>
                        </div>
                    </div>

                    {/* Contenido del Formulario */}
                    <div className="flex-1 flex flex-col">
                        {/* Encabezado */}
                        <div className="bg-blue-900 text-white p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <div>
                                <div className="text-blue-300 text-xs font-black tracking-widest uppercase mb-1">Registro Oficial Monozukuri</div>
                                <h2 className="text-2xl font-black">{selectedForm?.title}</h2>
                            </div>
                            <div className="flex flex-wrap gap-4 bg-blue-950/50 p-4 rounded-lg border border-blue-800/50 w-full xl:w-auto">
                                <div className="flex flex-col flex-1 min-w-[120px]">
                                    <label className="text-[10px] text-blue-300 font-bold uppercase mb-1">Código</label>
                                    <input className="bg-transparent border-b border-blue-400 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors pb-1 placeholder-blue-400/50" value={payload.codigo || ''} onChange={e => setPayload({...payload, codigo: e.target.value})} placeholder="MZ-PR-001" />
                                </div>
                                <div className="flex flex-col w-20">
                                    <label className="text-[10px] text-blue-300 font-bold uppercase mb-1">Versión</label>
                                    <input className="bg-transparent border-b border-blue-400 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors pb-1 text-center" value={payload.version || '01'} onChange={e => setPayload({...payload, version: e.target.value})} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-[130px]">
                                    <label className="text-[10px] text-blue-300 font-bold uppercase mb-1">Fecha</label>
                                    <input type="date" className="bg-transparent border-b border-blue-400 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors pb-1" style={{ colorScheme: 'dark' }} value={payload.fecha || ''} onChange={e => setPayload({...payload, fecha: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Grilla de Datos N1 */}
                        <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {selectedForm?.onlineFields.filter(f => !['codigo', 'version', 'fecha', 'fecha_creacion', 'fecha_modificaciones', 'observaciones', 'pagina', 'aprobacion', 'validada_por'].includes(f)).map((field) => (
                                    <div key={field} className="flex flex-col gap-2">
                                        <label className="text-xs font-black uppercase text-blue-900 tracking-tight">{field.replace(/_/g, ' ')}</label>
                                        <input 
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium shadow-sm"
                                            value={payload[field] || ''} 
                                            onChange={e => setPayload({...payload, [field]: e.target.value})}
                                            placeholder={`Ingresar ${field.replace(/_/g, ' ')}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            {/* Observaciones a ancho completo */}
                            <div className="flex flex-col gap-2 mb-10">
                                <label className="text-xs font-black uppercase text-blue-900 tracking-tight flex items-center gap-2">
                                    <Edit3 size={14} className="text-blue-500"/> Notas de Campo / Observaciones del Turno
                                </label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm resize-y shadow-sm leading-relaxed"
                                    style={{ minHeight: '120px' }}
                                    value={extraNotes}
                                    onChange={e => setExtraNotes(e.target.value)}
                                    placeholder="Describa de forma clara los hallazgos, desviaciones o comentarios relevantes ocurridos durante el proceso..."
                                ></textarea>
                            </div>

                            {/* Firmas Estilo Moderno */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-200 mt-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-full max-w-[250px] border-b-2 border-gray-300 h-10 mb-3"></div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Elaboró (Operario)</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-full max-w-[250px] border-b-2 border-gray-300 h-10 mb-3"></div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revisó (Supervisor)</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-full max-w-[250px] border-b-2 border-gray-300 h-10 mb-3"></div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aprobó (Gerencia)</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions p-6 bg-white border-t border-gray-100 mt-auto flex flex-col sm:flex-row justify-between gap-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1">
                                <X size={18} className="mr-2" /> Cancelar
                            </Button>
                            <div className="flex flex-wrap gap-2 order-1 sm:order-2">
                                <Button variant="ghost" className="border border-gray-200 font-bold text-[11px]" onClick={() => downloadFilledData('excel')}>
                                    <Download size={14} className="mr-2 text-green-600" /> EXCEL
                                </Button>
                                <Button variant="ghost" className="border border-gray-200 font-bold text-[11px]" onClick={() => downloadFilledData('pdf')}>
                                    <Download size={14} className="mr-2 text-red-600" /> PDF
                                </Button>
                                <Button variant="primary" className="bg-blue-900 px-8 py-3 font-bold text-sm shadow-lg shadow-blue-900/20" onClick={save}>
                                    <Save size={18} className="mr-2" /> GUARDAR
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
