import { useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from './ui';
import apiClient from '../api/client';
import { FileSpreadsheet, Edit3, Download, Save, X, Activity, FileText } from 'lucide-react';

export default function ModuleFormats({ module }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [payload, setPayload] = useState({});
    const [extraNotes, setExtraNotes] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [workstations, setWorkstations] = useState([]);

    const loadMetadata = async () => {
        try {
            const [uRes, wRes] = await Promise.all([
                apiClient.get('/admin/users'),
                apiClient.get('/fos/meta/workstations')
            ]);
            setUsers(uRes.data || []);
            setWorkstations(wRes.data || []);
        } catch (e) { console.error("Error metadata", e); }
    };

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

    const loadSubmissions = async () => {
        try {
            const allSubmissions = [];
            for (const form of forms) {
                try {
                    const res = await apiClient.get(`/templates/forms/${form.id}/submissions`);
                    if (res.data) allSubmissions.push(...res.data.map(s => ({ ...s, formId: form.id })));
                } catch (e) { /* ignore */ }
            }
            setSubmissions(allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
        } catch (err) { console.error("Error historial", err); }
    };

    useEffect(() => { loadForms(); loadMetadata(); }, [module]);
    useEffect(() => { if (forms.length > 0) loadSubmissions(); }, [forms]);

    const downloadTemplate = async (id) => {
        try {
            const res = await apiClient.get(`/templates/forms/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PLANTILLA-${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error("Error Excel", err); }
    };

    const downloadPDF = async (formId) => {
        try {
            const res = await apiClient.post(`/templates/forms/${formId}/download-filled-pdf`, { payload: {} }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `FORMATO-${formId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error("Error PDF", err); }
    };

    const downloadFilledData = async (format = 'excel', subPayload = null, fId = null) => {
        const targetFormId = fId || selectedForm?.id;
        const targetPayload = subPayload || payload;
        const targetTitle = selectedForm?.title || 'Registro';

        if (!targetFormId) return;
        try {
            const endpoint = format === 'pdf' ? 'download-filled-pdf' : 'download-filled';
            const res = await apiClient.post(`/templates/forms/${targetFormId}/${endpoint}`, { payload: targetPayload }, { responseType: 'blob' });
            const type = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const url = window.URL.createObjectURL(new Blob([res.data], { type }));
            
            const link = document.createElement('a');
            link.href = url;
            const ext = format === 'pdf' ? 'pdf' : 'xlsx';
            link.setAttribute('download', `${targetTitle}-Diligenciado.${ext}`);
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
            loadSubmissions();
            alert('Registro guardado exitosamente en el sistema Gemba.');
        } catch (err) { alert('Error al guardar el registro.'); }
    };

    if (loading) return null;
    if (forms.length === 0) return null;

    return (
        <div className="mt-8 border-t border-gray-100 pt-8 space-y-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-blue-900 flex items-center uppercase tracking-tight">
                        <FileSpreadsheet className="mr-3 text-blue-600" size={24} /> Formatos N1 - Estándares de {module.toUpperCase()}
                    </h3>
                    <p className="text-xs text-muted font-bold mt-1 uppercase">Creación de registros oficiales Monozukuri</p>
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
                                <Button variant="secondary" size="sm" className="flex-1 font-bold text-[9px] bg-slate-800 px-1" onClick={() => downloadTemplate(form.id)}>
                                    <Download size={10} className="mr-1"/> EXCEL
                                </Button>
                                <Button variant="secondary" size="sm" className="flex-1 font-bold text-[9px] bg-red-900/40 hover:bg-red-900 px-1" onClick={() => downloadPDF(form.id)}>
                                    <FileText size={10} className="mr-1"/> PDF
                                </Button>
                                <Button variant="primary" size="sm" className="flex-1 font-bold text-[9px] bg-blue-900 px-1" onClick={() => openForm(form)}>
                                    <Edit3 size={10} className="mr-1"/> CREAR
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {submissions.length > 0 && (
                <Card title="Historial de Registros Diligenciados" icon={<Activity size={18} className="text-blue-500" />} className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="py-4 px-6">Fecha / Hora</th>
                                    <th className="py-4 px-6">Formato Institucional</th>
                                    <th className="py-4 px-6">Diligenciado por</th>
                                    <th className="py-4 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {submissions.map((s, idx) => (
                                    <tr key={idx} className="text-xs text-slate-300 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">{new Date(s.submittedAt).toLocaleString()}</td>
                                        <td className="py-4 px-6 font-black text-blue-400 uppercase tracking-tighter">{s.title || s.formId}</td>
                                        <td className="py-4 px-6 font-bold">{s.submittedBy}</td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => downloadFilledData('pdf', s.payload, s.formId)} 
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all font-black uppercase text-[9px] flex items-center gap-2 ml-auto"
                                            >
                                                <FileText size={12} /> Descargar N1 PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedForm?.title}
                maxWidth="1200px"
            >
                <div className="flex flex-col lg:flex-row bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[700px]">
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
                                    "Hola, soy tu asistente de estandarización. Este registro de <strong>{module.toUpperCase()}</strong> es vital para la trazabilidad del proceso."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="bg-blue-900 text-white p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <div>
                                <div className="text-blue-300 text-xs font-black tracking-widest uppercase mb-1">Registro Oficial Monozukuri</div>
                                <h2 className="text-2xl font-black">{selectedForm?.title}</h2>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {selectedForm?.onlineFields.filter(f => !['observaciones', 'aprobacion', 'validada_por'].includes(f)).map((field) => {
                                    const isUserField = ['supervisor', 'jefe', 'lider', 'responsable'].some(k => field.toLowerCase().includes(k));
                                    const isProcessField = ['proceso', 'departamento', 'area', 'seccion'].some(k => field.toLowerCase().includes(k));

                                    return (
                                        <div key={field} className="flex flex-col gap-2">
                                            <label className="text-xs font-black uppercase text-blue-900 tracking-tight">{field.replace(/_/g, ' ')}</label>
                                            
                                            {isUserField ? (
                                                <select 
                                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium shadow-sm"
                                                    value={payload[field] || ''}
                                                    onChange={e => setPayload({...payload, [field]: e.target.value})}
                                                >
                                                    <option value="">Seleccionar {field.replace(/_/g, ' ')}...</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={typeof u.name === 'object' ? u.name.name : u.name}>
                                                            {typeof u.name === 'object' ? u.name.name : u.name} 
                                                            ({typeof u.role === 'object' ? u.role.name : u.role})
                                                        </option>
                                                    ))}
                                                    <option value="OTRO">OTRO (Manual)</option>
                                                </select>
                                            ) : isProcessField ? (
                                                <select 
                                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium shadow-sm"
                                                    value={payload[field] || ''}
                                                    onChange={e => setPayload({...payload, [field]: e.target.value})}
                                                >
                                                    <option value="">Seleccionar {field.replace(/_/g, ' ')}...</option>
                                                    {workstations.map(w => (
                                                        <option key={w.id} value={typeof w.name === 'object' ? w.name.name : w.name}>
                                                            {typeof w.name === 'object' ? w.name.name : w.name}
                                                        </option>
                                                    ))}
                                                    <option value="OTRO">OTRO (Manual)</option>
                                                </select>
                                            ) : (
                                                <input 
                                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium shadow-sm"
                                                    value={payload[field] || ''} 
                                                    onChange={e => setPayload({...payload, [field]: e.target.value})}
                                                    placeholder={`Ingresar ${field.replace(/_/g, ' ')}...`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex flex-col gap-2 mb-10">
                                <label className="text-xs font-black uppercase text-blue-900 tracking-tight flex items-center gap-2">
                                    <Edit3 size={14} className="text-blue-500"/> Notas de Campo / Observaciones
                                </label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm resize-y shadow-sm leading-relaxed"
                                    style={{ minHeight: '120px' }}
                                    value={extraNotes}
                                    onChange={e => setExtraNotes(e.target.value)}
                                    placeholder="Describa los hallazgos relevantes..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-actions p-6 bg-white border-t border-gray-100 mt-auto flex flex-col sm:flex-row justify-between gap-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={18} className="mr-2" /> Cancelar
                            </Button>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="primary" className="bg-blue-900 px-8 py-3 font-bold text-sm shadow-lg shadow-blue-900/20" onClick={save}>
                                    <Save size={18} className="mr-2" /> GUARDAR REGISTRO
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
