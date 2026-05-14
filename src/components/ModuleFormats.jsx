import { useEffect, useState } from 'react';
import { Card, Button, Badge, Modal } from './ui';
import apiClient from '../api/client';
import { FileSpreadsheet, Edit3, Download, Save, X, History, Eye, BadgeCheck, ImageUp, FileImage, FileText } from 'lucide-react';

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function ModuleFormats({ module, context }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeForm, setActiveForm] = useState(null);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [payload, setPayload] = useState({});
    const [extraNotes, setExtraNotes] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);

    const loadForms = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/templates/forms');
            const filtered = res.data
                .filter(f => f.module === module)
                // En FOS, "Continuación" se descarga junto con el análisis principal (Excel). El flujo se unifica.
                .filter(f => !(module === 'fos' && f.id === 'fos-continuacion'));
            setForms(filtered);
            if (module === 'fos' && !activeForm && filtered.length) {
                selectActiveForm(filtered[0]);
            }
        } catch (err) {
            setError('Error al cargar formatos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadForms(); }, [module]);
    useEffect(() => {
        if (module === 'fos' && activeForm) selectActiveForm(activeForm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context?.fosId]);

    const loadPreview = async (formId) => {
        setPreviewLoading(true);
        try {
            const res = await apiClient.get(`/templates/forms/${formId}/preview`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            setPreviewUrl((prev) => {
                if (prev) window.URL.revokeObjectURL(prev);
                return url;
            });
        } catch (err) {
            setPreviewUrl((prev) => {
                if (prev) window.URL.revokeObjectURL(prev);
                return '';
            });
        } finally {
            setPreviewLoading(false);
        }
    };

    const uploadPreview = async (formId, file) => {
        try {
            const contentBase64 = await toBase64(file);
            await apiClient.post(`/templates/forms/${formId}/preview`, { filename: file.name, contentBase64 });
            await loadPreview(formId);
            alert('Vista previa cargada.');
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo cargar la vista previa.');
        }
    };

    const loadSubmissions = async (formId) => {
        setSubmissionsLoading(true);
        setSelectedSubmission(null);
        setSaveStatus('');
        try {
            const params = {};
            if (module === 'fos' && context?.fosId) params.fosId = context.fosId;
            const res = await apiClient.get(`/templates/forms/${formId}/submissions`, { params });
            setSubmissions(Array.isArray(res.data) ? res.data : []);
            return Array.isArray(res.data) ? res.data : [];
        } catch (err) {
            setSubmissions([]);
            return [];
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const download = async (id, title) => {
        try {
            const res = await apiClient.get(`/templates/forms/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Error al descargar'); }
    };

    // Descarga PDF: si hay payload (registro diligenciado), incluye los datos.
    // Si no, descarga el formato vacío como PDF.
    const downloadPDF = async (formId, title, dataPayload = {}) => {
        try {
            const res = await apiClient.post(
                `/templates/forms/${formId}/download-filled-pdf`,
                { payload: dataPayload },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            const filename = title ? `${title}-${Date.now()}.pdf` : `FORMATO-${formId}.pdf`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Error al descargar PDF'); }
    };

    // Descarga registro diligenciado en Excel (con datos)
    const downloadFilledExcel = async (formId, title, dataPayload = {}) => {
        try {
            const res = await apiClient.post(
                `/templates/forms/${formId}/download-filled`,
                { payload: dataPayload },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title || 'REGISTRO'}-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Error al descargar Excel diligenciado'); }
    };

    const openForm = async (form) => {
        setSelectedForm(form);
        const init = {};
        form.onlineFields.forEach(f => init[f] = '');
        setPayload(init);
        setExtraNotes('');
        setIsModalOpen(true);
        const rows = await loadSubmissions(form.id);
        const latest = rows[0];
        if (latest?.payload && typeof latest.payload === 'object') {
            setPayload((prev) => ({ ...prev, ...latest.payload }));
            setExtraNotes(latest.payload.observaciones || latest.payload.observations || '');
            setSelectedSubmission(latest);
        }
    };

    const selectActiveForm = async (form) => {
        setActiveForm(form);
        await loadPreview(form.id);
        if (module === 'fos' && !context?.fosId) {
            setSubmissions([]);
            setSelectedSubmission(null);
            return;
        }
        const rows = await loadSubmissions(form.id);
        if (rows[0]) setSelectedSubmission(rows[0]);
    };

    const save = async () => {
        try {
            if (!selectedForm) return;
            if (module === 'fos' && !context?.fosId) {
                alert('Selecciona un FOS (estándar) para guardar el registro y consultar su historial.');
                return;
            }
            setSaveStatus('Guardando...');
            const observationsKey = selectedForm.onlineFields?.includes('observaciones') ? 'observaciones' : 'observations';
            await apiClient.post(`/templates/forms/${selectedForm.id}/submit`, {
                payload: { ...payload, [observationsKey]: extraNotes },
                context: module === 'fos' ? { fosId: context?.fosId, fosCode: context?.fosCode } : undefined,
            });
            setSaveStatus('Guardado correctamente.');
            const rows = await loadSubmissions(selectedForm.id);
            setSubmissions(rows);
            if (rows[0]) setSelectedSubmission(rows[0]);
            setIsModalOpen(false);
            if (activeForm?.id === selectedForm.id) await selectActiveForm(activeForm);
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

            {module === 'fos' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {forms.map(form => (
                            <Card
                                key={form.id}
                                className={`border-2 transition-all group cursor-pointer ${activeForm?.id === form.id ? 'border-blue-600/40' : 'border-blue-900/5 hover:border-blue-900/20'}`}
                                onClick={() => selectActiveForm(form)}
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <FileSpreadsheet className="text-blue-600" size={20} />
                                        </div>
                                        <Badge variant="neutral" className="text-[9px] font-black tracking-widest">{form.sheetName.toUpperCase()}</Badge>
                                    </div>
                                    <h4 className="font-black text-blue-900 text-sm leading-tight mb-6 h-10 overflow-hidden uppercase">{form.title}</h4>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 border border-gray-200 font-bold text-[10px]"
                                            onClick={(e) => { e.stopPropagation(); download(form.id, form.title); }}
                                            title="Plantilla Excel vacía"
                                        >
                                            <Download size={12} className="mr-1" /> EXCEL
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 border border-red-200 text-red-700 font-bold text-[10px]"
                                            onClick={(e) => { e.stopPropagation(); downloadPDF(form.id, form.title); }}
                                            title="Formato en PDF"
                                        >
                                            <FileText size={12} className="mr-1" /> PDF
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 font-bold text-[10px] bg-blue-900"
                                            onClick={(e) => { e.stopPropagation(); openForm(form); }}
                                        >
                                            <Edit3 size={12} className="mr-1" /> DILIGENCIAR
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-black text-blue-900 text-sm uppercase tracking-tight">Vista / Historial</div>
                            {activeForm?.id && (
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold" onClick={() => selectActiveForm(activeForm)}>
                                    Actualizar
                                </Button>
                            )}
                        </div>

                        <div className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-2 text-[11px] font-black text-gray-700">
                                <BadgeCheck size={14} className="text-blue-600" /> FOS seleccionado
                            </div>
                            <div className="text-xs font-bold text-gray-600 mt-1">
                                {context?.fosCode ? context.fosCode : 'No seleccionado'}
                            </div>
                            {!context?.fosId && (
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Selecciona un FOS arriba para ver/guardar registros.
                                </div>
                            )}
                        </div>

                        {!activeForm ? (
                            <div className="text-sm text-gray-500">
                                Selecciona un formato de la izquierda para ver su vista previa o su historial.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-black text-gray-700">{activeForm.title}</div>
                                        <div className="text-[11px] text-gray-500 mt-1">{activeForm.sheetName}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="border border-gray-200 text-[10px] font-bold" onClick={() => download(activeForm.id, activeForm.title)}>
                                            <Download size={12} className="mr-1" /> EXCEL
                                        </Button>
                                        <Button variant="ghost" size="sm" className="border border-red-200 text-red-700 text-[10px] font-bold" onClick={() => downloadPDF(activeForm.id, activeForm.title)}>
                                            <FileText size={12} className="mr-1" /> PDF
                                        </Button>
                                        <Button variant="primary" size="sm" className="bg-blue-900 text-[10px] font-bold" onClick={() => openForm(activeForm)}>
                                            <Edit3 size={12} className="mr-1" /> ABRIR
                                        </Button>
                                    </div>
                                </div>

                                {context?.fosId ? (
                                    submissionsLoading ? (
                                        <p className="text-xs text-muted">Cargando registros...</p>
                                    ) : submissions.length ? (
                                        <div>
                                            <div className="text-[11px] font-black text-gray-700 mb-2">Últimos registros</div>
                                            <div className="flex flex-col gap-2" style={{ maxHeight: 260, overflow: 'auto' }}>
                                                {submissions.slice(0, 12).map((s, idx) => (
                                                    <button
                                                        key={`${s.submittedAt}-${idx}`}
                                                        className={`text-left p-3 rounded-xl border transition-all ${selectedSubmission?.submittedAt === s.submittedAt ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                                        onClick={() => setSelectedSubmission(s)}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs font-black text-gray-700">{new Date(s.submittedAt).toLocaleString()}</span>
                                                            <Eye size={14} className="text-gray-400" />
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                                            {(s.payload?.codigo && `Doc: ${s.payload.codigo}`) || 'Registro'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedSubmission?.payload && (
                                                <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className="px-3 py-2 bg-gray-50 text-[11px] font-black text-gray-700 flex items-center justify-between">
                                                        <span>Resumen del registro</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => downloadFilledExcel(activeForm.id, activeForm.title, selectedSubmission.payload)}
                                                                className="text-[10px] font-black text-blue-700 hover:text-blue-900"
                                                                title="Descargar registro diligenciado en Excel"
                                                            >
                                                                <Download size={11} className="inline mr-1" /> XLSX
                                                            </button>
                                                            <button
                                                                onClick={() => downloadPDF(activeForm.id, activeForm.title, selectedSubmission.payload)}
                                                                className="text-[10px] font-black text-red-700 hover:text-red-900 ml-2"
                                                                title="Descargar registro diligenciado en PDF"
                                                            >
                                                                <FileText size={11} className="inline mr-1" /> PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 grid grid-cols-1 gap-2" style={{ maxHeight: 200, overflow: 'auto' }}>
                                                        {Object.entries(selectedSubmission.payload)
                                                            .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                                                            .filter(([k]) => !['observaciones', 'observations'].includes(k))
                                                            .slice(0, 12)
                                                            .map(([k, v]) => (
                                                                <div key={k} className="flex items-start justify-between gap-3">
                                                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{k.replace(/_/g, ' ')}</div>
                                                                    <div className="text-[11px] font-bold text-gray-700 text-right break-words">{String(v)}</div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-[11px] font-black text-gray-700 mb-2">Sin diligenciar</div>
                                            {previewLoading ? (
                                                <p className="text-xs text-muted">Cargando vista previa...</p>
                                            ) : previewUrl ? (
                                                <img src={previewUrl} alt="Vista previa" className="w-full rounded-xl border border-gray-200" />
                                            ) : (
                                                <div className="p-4 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 flex items-center gap-2">
                                                    <FileImage size={18} className="text-gray-400" />
                                                    Sube una foto del formato para guiar el diligenciamiento.
                                                </div>
                                            )}
                                            <div className="mt-3">
                                                <label className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 cursor-pointer">
                                                    <ImageUp size={16} />
                                                    Cargar foto del formato
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) uploadPreview(activeForm.id, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Selecciona un FOS arriba para ver el historial y guardar nuevos registros.
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
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
                                    <Button variant="ghost" size="sm" className="flex-1 border border-gray-200 font-bold text-[10px]" onClick={() => download(form.id, form.title)} title="Plantilla Excel vacía">
                                        <Download size={12} className="mr-1" /> EXCEL
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 border border-red-200 text-red-700 font-bold text-[10px]" onClick={() => downloadPDF(form.id, form.title)} title="Formato en PDF">
                                        <FileText size={12} className="mr-1" /> PDF
                                    </Button>
                                    <Button variant="primary" size="sm" className="flex-1 font-bold text-[10px] bg-blue-900" onClick={() => openForm(form)}>
                                        <Edit3 size={12} className="mr-1" /> DILIGENCIAR
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${selectedForm?.title} - Gemba Form N1`}
                maxWidth="1100px"
            >
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="paper-form shadow-2xl flex-1">
                        {/* Encabezado Estilo Industrial Premium */}
                        <div className="paper-header">
                            <div className="paper-logo-box">
                                <span className="paper-logo-text">MONOZUKURI</span>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Industrial MES</span>
                            </div>
                            <div className="paper-title-box">
                                {selectedForm?.title || 'Formato de Registro'}
                            </div>
                            <div className="paper-meta-box">
                                {selectedForm?.onlineFields?.includes('codigo') && (
                                    <div className="paper-meta-row">
                                        <span className="text-gray-400">Documento:</span>
                                        <input value={payload.codigo || ''} onChange={e => setPayload({ ...payload, codigo: e.target.value })} placeholder="MZ-PR-001" />
                                    </div>
                                )}
                                {selectedForm?.onlineFields?.includes('version') && (
                                    <div className="paper-meta-row">
                                        <span className="text-gray-400">Versión:</span>
                                        <input value={payload.version || '01'} onChange={e => setPayload({ ...payload, version: e.target.value })} />
                                    </div>
                                )}
                                {selectedForm?.onlineFields?.includes('fecha') && (
                                    <div className="paper-meta-row">
                                        <span className="text-gray-400">Fecha:</span>
                                        <input type="date" value={payload.fecha || ''} onChange={e => setPayload({ ...payload, fecha: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grilla de Datos Optimizada */}
                        <div className="paper-grid">
                            {selectedForm?.onlineFields
                                .filter(f => !['codigo', 'version', 'fecha', 'observaciones', 'observations'].includes(f))
                                .map((field) => {
                                    const isLongText = ['etapas', 'etapas_adicionales', 'operaciones', 'conocimientos'].includes(field);
                                    const isFullWidth = ['proceso', 'operacion', 'estacion', 'etapas', 'etapas_adicionales', 'operaciones', 'conocimientos'].includes(field);
                                    return (
                                        <div key={field} className={`paper-input-box ${isFullWidth ? 'full-width' : ''}`}>
                                            <label>{field.replace(/_/g, ' ')}</label>
                                            {isLongText ? (
                                                <textarea
                                                    value={payload[field] || ''}
                                                    onChange={e => setPayload({ ...payload, [field]: e.target.value })}
                                                    placeholder={`Ingrese ${field.replace(/_/g, ' ')}...`}
                                                ></textarea>
                                            ) : (
                                                <input
                                                    value={payload[field] || ''}
                                                    onChange={e => setPayload({ ...payload, [field]: e.target.value })}
                                                    placeholder={`Ingrese ${field.replace(/_/g, ' ')}...`}
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            }

                            {/* Observaciones a ancho completo */}
                            <div className="paper-input-box full-width">
                                <label>Notas / Observaciones</label>
                                <textarea
                                    value={extraNotes}
                                    onChange={e => setExtraNotes(e.target.value)}
                                    placeholder="Describa hallazgos, desviaciones o comentarios relevantes..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Firmas */}
                        <div className="paper-footer">
                            <div className="paper-signature-card">
                                <div className="paper-signature-space">Espacio para Firma Digital</div>
                                <span className="paper-signature-label">ELABORÓ (OPERARIO)</span>
                            </div>
                            <div className="paper-signature-card">
                                <div className="paper-signature-space">Espacio para Firma Digital</div>
                                <span className="paper-signature-label">REVISÓ (SUPERVISOR)</span>
                            </div>
                            <div className="paper-signature-card">
                                <div className="paper-signature-space">Espacio para Firma Digital</div>
                                <span className="paper-signature-label">APROBÓ (GERENCIA)</span>
                            </div>
                        </div>
                    </div>

                    {/* Historial / Resultados */}
                    <div className="w-full lg:w-[360px]">
                        <Card className="border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 font-black text-blue-900">
                                    <History size={16} className="text-blue-600" /> Historial
                                </div>
                                {selectedForm?.id && (
                                    <Button variant="ghost" size="sm" onClick={() => loadSubmissions(selectedForm.id)} className="text-[10px] font-bold">
                                        Actualizar
                                    </Button>
                                )}
                            </div>

                            {module === 'fos' && (
                                <div className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <div className="flex items-center gap-2 text-[11px] font-black text-gray-700">
                                        <BadgeCheck size={14} className="text-blue-600" /> Contexto FOS
                                    </div>
                                    <div className="text-xs font-bold text-gray-600 mt-1">
                                        {context?.fosCode ? context.fosCode : 'No seleccionado'}
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-1">
                                        Aquí se muestran los registros guardados para el FOS seleccionado. Después de `GUARDAR REGISTRO`, revisa esta lista.
                                    </div>
                                    {!context?.fosId && (
                                        <div className="text-[11px] text-gray-500 mt-1">
                                            Selecciona un FOS arriba para habilitar guardado e historial.
                                        </div>
                                    )}
                                </div>
                            )}

                            {submissionsLoading ? (
                                <p className="text-xs text-muted">Cargando registros...</p>
                            ) : submissions.length === 0 ? (
                                <p className="text-xs text-muted">Aún no hay registros guardados para este formato.</p>
                            ) : (
                                <div className="flex flex-col gap-2" style={{ maxHeight: 420, overflow: 'auto' }}>
                                    {submissions.slice(0, 20).map((s, idx) => (
                                        <button
                                            key={`${s.submittedAt}-${idx}`}
                                            className={`text-left p-3 rounded-xl border transition-all ${selectedSubmission?.submittedAt === s.submittedAt ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-white/5'}`}
                                            onClick={() => {
                                                setSelectedSubmission(s);
                                                if (s?.payload && typeof s.payload === 'object') {
                                                    setPayload((prev) => ({ ...prev, ...s.payload }));
                                                    setExtraNotes(s.payload.observaciones || s.payload.observations || '');
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-black text-gray-700">{new Date(s.submittedAt).toLocaleString()}</span>
                                                <Eye size={14} className="text-gray-400" />
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                                {(s.payload?.codigo && `Doc: ${s.payload.codigo}`) || (s.payload?.fos_id && `FOS: ${s.payload.fos_id}`) || 'Registro'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedSubmission?.payload && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[11px] font-black text-gray-700">Detalle del registro</div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] font-bold border border-gray-200"
                                                onClick={() => downloadFilledExcel(selectedForm.id, selectedForm.title, selectedSubmission.payload)}
                                            >
                                                <Download size={11} className="mr-1" /> XLSX
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] font-bold border border-red-200 text-red-700"
                                                onClick={() => downloadPDF(selectedForm.id, selectedForm.title, selectedSubmission.payload)}
                                            >
                                                <FileText size={11} className="mr-1" /> PDF
                                            </Button>
                                        </div>
                                    </div>
                                    <pre className="text-[10px] bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto" style={{ maxHeight: 180 }}>
                                        {JSON.stringify(selectedSubmission.payload, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {saveStatus && (
                                <div className="mt-3 text-xs font-bold text-gray-600">
                                    {saveStatus}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                <div className="modal-actions mt-6">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                        <X size={18} className="mr-2" /> Cancelar
                    </Button>
                    <Button variant="primary" className="bg-blue-900 px-12 py-4 font-bold text-lg" onClick={save}>
                        <Save size={20} className="mr-2" /> GUARDAR REGISTRO
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
