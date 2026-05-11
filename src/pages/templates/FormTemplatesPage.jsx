import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '../../components/ui';
import apiClient from '../../api/client';

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

export default function FormTemplatesPage() {
    const [forms, setForms] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [onlinePayload, setOnlinePayload] = useState({});

    const loadForms = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/templates/forms');
            setForms(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudieron cargar los formatos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForms();
    }, []);

    const downloadForm = async (formId) => {
        try {
            // In a real production environment, this would call an endpoint that returns a specific XLSX
            // For this version, we provide the master file but with a clear reference to the requested form
            const response = await apiClient.get(`/templates/forms/${formId}/download`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const form = forms.find(f => f.id === formId);
            a.download = `${form?.title || 'Formato'}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo descargar el formato.');
        }
    };

    const uploadForm = async (form, file) => {
        try {
            const contentBase64 = await toBase64(file);
            await apiClient.post(`/templates/forms/${form.id}/upload`, {
                filename: file.name,
                contentBase64,
            });
            await loadForms();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar el archivo.');
        }
    };

    const openOnlineForm = (form) => {
        setSelectedForm(form);
        const init = {};
        for (const field of form.onlineFields || []) init[field] = '';
        setOnlinePayload(init);
        setIsOnlineModalOpen(true);
    };

    const submitOnline = async () => {
        if (!selectedForm) return;
        try {
            await apiClient.post(`/templates/forms/${selectedForm.id}/submit`, {
                payload: onlinePayload,
            });
            setIsOnlineModalOpen(false);
            setSelectedForm(null);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar el formato en línea.');
        }
    };

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <PageHeader
                title="Formatos N1"
                subtitle="Descarga, carga de archivo y diligenciamiento en línea por módulo"
            />

            {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

            <Card>
                {loading ? (
                    <p className="text-muted">Cargando formatos...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Formato</th>
                                    <th>Hoja Excel</th>
                                    <th>Módulo</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forms.map((form) => (
                                    <tr key={form.id}>
                                        <td><strong>{form.title}</strong></td>
                                        <td>{form.sheetName}</td>
                                        <td>
                                            <Badge variant="blue">{form.module.toUpperCase()}</Badge>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => downloadForm(form.id)}>
                                                    Descargar Excel
                                                </Button>
                                                <Button variant="primary" size="sm" onClick={() => openOnlineForm(form)}>
                                                    Diligenciar Pantalla
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!forms.length && (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted">No hay formatos visibles para tu rol.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isOnlineModalOpen}
                onClose={() => setIsOnlineModalOpen(false)}
                title={`Diligenciar ${selectedForm?.title || ''}`}
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsOnlineModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={submitOnline}>Guardar</Button>
                    </div>
                )}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-3">
                    {(selectedForm?.onlineFields || []).map((field) => (
                        <div key={field}>
                            <label className="form-label">{field}</label>
                            <input
                                className="form-input"
                                value={onlinePayload[field] || ''}
                                onChange={(e) => setOnlinePayload((prev) => ({ ...prev, [field]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
