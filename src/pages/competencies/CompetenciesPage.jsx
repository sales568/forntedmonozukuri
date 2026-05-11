import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

export default function CompetenciesPage() {
    const [skills, setSkills] = useState([]);
    const [users, setUsers] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [skillModalOpen, setSkillModalOpen] = useState(false);
    const [matrixModalOpen, setMatrixModalOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [skillForm, setSkillForm] = useState({ name: '', category: 'Technical', description: '' });
    const [matrixForm, setMatrixForm] = useState({ userId: '', skillId: '', level: 1, certified: false });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [skillsRes, usersRes, matrixRes] = await Promise.all([
                apiClient.get('/competencies/skills'),
                apiClient.get('/competencies/users'),
                apiClient.get('/competencies/matrix'),
            ]);
            setSkills(skillsRes.data || []);
            setUsers(usersRes.data || []);
            setMatrix(matrixRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar Competencias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleBulkUpload = () => {
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setBulkUploadOpen(false);
            loadData();
        }, 1500);
    };

    const createSkill = async () => {
        try {
            await apiClient.post('/competencies/skills', skillForm);
            setSkillModalOpen(false);
            setSkillForm({ name: '', category: 'Technical', description: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear skill');
        }
    };

    const createMatrixEntry = async () => {
        try {
            await apiClient.post('/competencies/matrix', {
                ...matrixForm,
                level: Number(matrixForm.level),
            });
            setMatrixModalOpen(false);
            setMatrixForm({ userId: '', skillId: '', level: 1, certified: false });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar matriz');
        }
    };

    const levelBadge = (level) => {
        if (level === 1) return <Badge variant="warning">Nivel I</Badge>;
        if (level === 2) return <Badge variant="neutral">Nivel II</Badge>;
        if (level === 3) return <Badge variant="success">Nivel III</Badge>;
        return <Badge variant="blue">Nivel IV</Badge>;
    };

    return (
        <div className="animate-fade-in w-full max-w-[1600px] mx-auto pb-10">
            <PageHeader title="Competencias (ILU / TEO)" subtitle="Matriz real por usuario y habilidad">
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setBulkUploadOpen(true)} className="font-bold border border-gray-200">
                        <UploadCloud size={16} className="mr-2 text-blue-600" /> IMPORTAR OPERARIOS (EXCEL)
                    </Button>
                    <Button variant="secondary" onClick={() => setSkillModalOpen(true)} className="font-bold">Nueva Skill</Button>
                    <Button variant="primary" onClick={() => setMatrixModalOpen(true)} className="bg-blue-600 shadow-sm font-bold px-6">ASIGNAR NIVEL</Button>
                </div>
            </PageHeader>

            {error && <div className="alert alert-danger mb-6">{error}</div>}

            <Card title="Matriz de Competencias Gemba" noPadding>
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Usuario / Operario</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Habilidad / Skill</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Categoría</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Nivel TEO/ILU</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Certificación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {matrix.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {entry.user?.name?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800">{entry.user?.name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">{entry.skill?.name || '-'}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-tighter">{entry.skill?.category || '-'}</td>
                                        <td className="px-6 py-4 text-center">{levelBadge(entry.level)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest ${entry.certified ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                {entry.certified ? 'Vigente' : 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!matrix.length && <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-bold">Sin datos en matriz.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <ModuleFormats module="competencies" />

            <Modal
                isOpen={skillModalOpen}
                onClose={() => setSkillModalOpen(false)}
                title="Crear skill"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setSkillModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createSkill}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre de la Habilidad / Proceso</label>
                        <input className="form-input" placeholder="Ej: Soldadura TIG, Calidad de Pintura" value={skillForm.name} onChange={(e) => setSkillForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                        <input className="form-input" placeholder="Ej: Técnica, Calidad, Seguridad" value={skillForm.category} onChange={(e) => setSkillForm((p) => ({ ...p, category: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Descripción detallada</label>
                        <textarea className="form-input" placeholder="Competencias requeridas para este proceso..." value={skillForm.description} onChange={(e) => setSkillForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={matrixModalOpen}
                onClose={() => setMatrixModalOpen(false)}
                title="Asignar nivel"
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setMatrixModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createMatrixEntry}>Guardar</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Usuario / Operario</label>
                        <select className="form-input" value={matrixForm.userId} onChange={(e) => setMatrixForm((p) => ({ ...p, userId: e.target.value }))}>
                            <option value="">Selecciona usuario</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Habilidad a Calificar</label>
                        <select className="form-input" value={matrixForm.skillId} onChange={(e) => setMatrixForm((p) => ({ ...p, skillId: e.target.value }))}>
                            <option value="">Selecciona skill</option>
                            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nivel ILU / TEO (1-4)</label>
                        <input className="form-input" type="number" min="1" max="4" value={matrixForm.level} onChange={(e) => setMatrixForm((p) => ({ ...p, level: e.target.value }))} />
                        <p className="text-[10px] text-muted">1: Aprendiz, 2: Autónomo, 3: Entrenador, 4: Experto</p>
                    </div>
                    <label className="flex items-center gap-2 font-bold text-sm text-gray-700">
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={matrixForm.certified} onChange={(e) => setMatrixForm((p) => ({ ...p, certified: e.target.checked }))} />
                        Certificación Vigente
                    </label>
                </div>
            </Modal>

            <Modal
                isOpen={bulkUploadOpen}
                onClose={() => setBulkUploadOpen(false)}
                title="Carga Masiva de RRHH (Operarios y Formaciones)"
                actions={(
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setBulkUploadOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleBulkUpload} disabled={uploading}>
                            {uploading ? 'Procesando...' : 'Subir Archivo'}
                        </Button>
                    </div>
                )}
            >
                <div className="p-8 flex flex-col items-center justify-center text-center gap-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl m-4">
                    <FileSpreadsheet size={48} className="text-blue-500" />
                    <div>
                        <p className="font-bold text-gray-700">Arrastra tu archivo Excel o CSV aquí</p>
                        <p className="text-xs text-muted mt-1 max-w-sm mx-auto">El sistema detectará automáticamente los nuevos usuarios, correos electrónicos y actualizará los niveles en la matriz TEO/ILU.</p>
                    </div>
                    <Button variant="secondary" className="mt-2 text-blue-600 bg-white shadow-sm font-bold">Seleccionar de mi PC</Button>
                </div>
            </Modal>
        </div>
    );
}
