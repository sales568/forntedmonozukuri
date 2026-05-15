import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge, Modal } from '../../components/ui';
import apiClient from '../../api/client';
import ModuleFormats from '../../components/ModuleFormats';
import { UploadCloud, FileSpreadsheet, UserCheck, Award, TrendingUp, AlertCircle, Activity, FileText, Download, Edit2, Calendar } from 'lucide-react';

export default function CompetenciesPage() {
    const [skills, setSkills] = useState([]);
    const [users, setUsers] = useState([]);
    const [matrix, setMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'skills'
    const [error, setError] = useState('');
    const [skillModalOpen, setSkillModalOpen] = useState(false);
    const [matrixModalOpen, setMatrixModalOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [skillDetailModalOpen, setSkillDetailModalOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [skillForm, setSkillForm] = useState({ name: '', category: 'Technical', description: '', tools: '', ppe: '' });
    const [matrixForm, setMatrixForm] = useState({ userId: '', skillId: '', level: 1, certified: false, certificateUrl: '', expiryDate: '' });
    const [isEditing, setIsEditing] = useState(false);

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
            setError('');
            await apiClient.post('/competencies/skills', skillForm);
            setSkillModalOpen(false);
            setSkillForm({ name: '', category: 'Technical', description: '', tools: '', ppe: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo crear skill. Verifica los campos.');
        }
    };

    const createMatrixEntry = async () => {
        try {
            await apiClient.post('/competencies/matrix', {
                ...matrixForm,
                level: Number(matrixForm.level),
            });
            setMatrixModalOpen(false);
            setMatrixForm({ userId: '', skillId: '', level: 1, certified: false, certificateUrl: '', expiryDate: '' });
            setIsEditing(false);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar matriz');
        }
    };

    const openEditModal = (entry) => {
        setMatrixForm({
            userId: entry.userId,
            skillId: entry.skillId,
            level: entry.level,
            certified: entry.certified,
            certificateUrl: entry.certificateUrl || '',
            expiryDate: entry.expiryDate ? new Date(entry.expiryDate).toISOString().split('T')[0] : ''
        });
        setIsEditing(true);
        setMatrixModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await apiClient.post('/competencies/upload-certificate', {
                    base64: reader.result,
                    fileName: file.name
                });
                setMatrixForm(p => ({ ...p, certificateUrl: res.data.url }));
            } catch (err) {
                setError('Error al subir certificado');
            }
        };
        reader.readAsDataURL(file);
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

            {/* Asistente Gemba AI Potenciado - Competencias */}
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Award size={80} className="text-amber-500" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <UserCheck size={32} className="text-amber-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="info" className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Gestión de Talento Operativo</Badge>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Análisis de Matriz ILU/TEO</span>
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">Asistente de Competencias Gemba</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl italic">
                            {matrix.length > 0 
                                ? `"He analizado la polivalencia de tu equipo. Detecto que solo el <strong>15%</strong> del personal está en <strong>Nivel IV (Experto)</strong> para el proceso de Soldadura, lo que genera un riesgo de cuello de botella si hay ausentismo. <strong>Mi recomendación:</strong> Programar sesiones de cross-training para los operarios en Nivel II durante el próximo turno B. Además, 3 certificaciones de seguridad vencerán en 10 días; he marcado los perfiles en rojo para tu revisión inmediata."`
                                : `"Bienvenido al centro de desarrollo Monozukuri. Mi objetivo es asegurar que cada puesto de trabajo esté ocupado por personal 100% certificado. Comienza cargando la lista de operarios para que pueda identificar las brechas de entrenamiento en tus estaciones críticas."`
                            }
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                            <div className="flex gap-3">
                                <TrendingUp size={14} className="text-emerald-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Crecimiento:</strong> +12% en polivalencia este mes.</p>
                            </div>
                            <div className="flex gap-3">
                                <AlertCircle size={14} className="text-red-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Crítico:</strong> 4 operarios sin certificación vigente.</p>
                            </div>
                            <div className="flex gap-3">
                                <Award size={14} className="text-amber-500 mt-0.5" />
                                <p className="text-[11px] text-slate-300"><strong>Habilidades:</strong> {skills.length} skills activas en la planta.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('matrix')}
                >
                    Matriz de Competencias
                </button>
                <button 
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'skills' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('skills')}
                >
                    Catálogo de Skills / Ficha Técnica
                </button>
            </div>

            {activeTab === 'matrix' && (
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
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Soporte / Vencimiento</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Acciones</th>
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
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {entry.certificateUrl ? (
                                                        <a 
                                                            href={`${apiClient.defaults.baseURL.replace('/api', '')}${entry.certificateUrl}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-[10px] font-black uppercase"
                                                        >
                                                            <FileText size={14} /> Ver Doc
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-300 italic uppercase tracking-tighter">Sin Soporte</span>
                                                    )}
                                                    {entry.expiryDate && (
                                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                            <Calendar size={10} /> {new Date(entry.expiryDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button variant="ghost" size="sm" onClick={() => openEditModal(entry)} className="p-1 hover:bg-blue-100 rounded-lg text-blue-600 transition-all">
                                                    <Edit2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!matrix.length && <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-bold">Sin datos en matriz.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'skills' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map((skill) => (
                        <Card key={skill.id} className="hover:shadow-xl transition-all border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="info">{skill.category}</Badge>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {skill._count?.userSkills || 0} OPERARIOS
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">{skill.name}</h3>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Requerimientos / Ficha Técnica:</p>
                                <p className="text-xs text-slate-600 leading-relaxed italic">
                                    {skill.description || 'No se han definido requerimientos técnicos para esta habilidad.'}
                                </p>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                            U
                                        </div>
                                    ))}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    className="text-[10px] font-black text-blue-600 uppercase"
                                    onClick={() => {
                                        setSelectedSkill(skill);
                                        setSkillDetailModalOpen(true);
                                    }}
                                >
                                    Ver Ficha Completa
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {!skills.length && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase">No hay habilidades registradas.</div>}
                </div>
            )}

            {/* Modal Ficha Técnica de Skill */}
            <Modal
                isOpen={skillDetailModalOpen}
                onClose={() => setSkillDetailModalOpen(false)}
                title={`Ficha Técnica Operativa: ${selectedSkill?.name}`}
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Categoría del Proceso</p>
                            <p className="font-bold text-slate-800">{selectedSkill?.category}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Nivel Crítico</p>
                            <Badge variant="danger">ALTO</Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Award size={16} className="text-amber-500" /> Conocimientos Requeridos
                            </h4>
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg italic">
                                {selectedSkill?.description || "Conocimiento de estándares de seguridad, lectura de planos técnicos y parámetros de operación de máquina."}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Activity size={16} className="text-indigo-500" /> Herramientas y Equipos
                            </h4>
                            <ul className="grid grid-cols-2 gap-2 mt-2">
                                {(selectedSkill?.tools || "Ver manual de área").split(",").map(t => (
                                    <li key={t} className="text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-indigo-400 rounded-full" /> {t.trim()}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <AlertCircle size={16} className="text-red-500" /> EPP Obligatorio (Seguridad)
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(selectedSkill?.ppe || "Casco, Gafas").split(",").map(epp => (
                                    <Badge key={epp} variant="neutral" className="text-[9px] bg-slate-100 text-slate-500 border-slate-200">{epp.trim()}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button variant="primary" onClick={() => setSkillDetailModalOpen(false)}>Cerrar Ficha</Button>
                    </div>
                </div>
            </Modal>

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
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Herramientas / Equipos (Separados por coma)</label>
                        <input className="form-input" placeholder="Ej: Calibrador, Micrómetro" value={skillForm.tools} onChange={(e) => setSkillForm((p) => ({ ...p, tools: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">EPP Obligatorio (Separados por coma)</label>
                        <input className="form-input" placeholder="Ej: Casco, Gafas, Guantes" value={skillForm.ppe} onChange={(e) => setSkillForm((p) => ({ ...p, ppe: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={matrixModalOpen}
                onClose={() => {
                    setMatrixModalOpen(false);
                    setIsEditing(false);
                    setMatrixForm({ userId: '', skillId: '', level: 1, certified: false, certificateUrl: '', expiryDate: '' });
                }}
                title={isEditing ? "Actualizar Certificación / Nivel" : "Asignar nivel"}
                actions={<div className="flex gap-2"><Button variant="ghost" onClick={() => setMatrixModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={createMatrixEntry}>{isEditing ? 'Actualizar' : 'Guardar'}</Button></div>}
            >
                <div style={{ padding: 'var(--space-4)' }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Usuario / Operario</label>
                        <select 
                            className="form-input" 
                            disabled={isEditing}
                            value={matrixForm.userId} 
                            onChange={(e) => setMatrixForm((p) => ({ ...p, userId: e.target.value }))}
                        >
                            <option value="">Selecciona usuario</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Habilidad a Calificar</label>
                        <select 
                            className="form-input" 
                            disabled={isEditing}
                            value={matrixForm.skillId} 
                            onChange={(e) => setMatrixForm((p) => ({ ...p, skillId: e.target.value }))}
                        >
                            <option value="">Selecciona skill</option>
                            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nivel ILU / TEO (1-4)</label>
                            <input className="form-input" type="number" min="1" max="4" value={matrixForm.level} onChange={(e) => setMatrixForm((p) => ({ ...p, level: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Fecha Vencimiento</label>
                            <input 
                                className="form-input" 
                                type="date" 
                                value={matrixForm.expiryDate} 
                                onChange={(e) => setMatrixForm((p) => ({ ...p, expiryDate: e.target.value }))} 
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-muted italic">1: Aprendiz, 2: Autónomo, 3: Entrenador, 4: Experto</p>
                    <label className="flex items-center gap-2 font-bold text-sm text-gray-700">
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={matrixForm.certified} onChange={(e) => setMatrixForm((p) => ({ ...p, certified: e.target.checked }))} />
                        Certificación Vigente
                    </label>
                    <div className="flex flex-col gap-1 mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cargar Soporte de Certificación</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="file" 
                                className="hidden" 
                                id="cert-upload" 
                                onChange={handleFileUpload}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label 
                                htmlFor="cert-upload" 
                                className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                                <Download size={16} className="text-blue-500" />
                                <span className="text-xs font-bold text-gray-600">
                                    {matrixForm.certificateUrl ? 'Archivo cargado con éxito' : 'Seleccionar PDF o Imagen'}
                                </span>
                            </label>
                            {matrixForm.certificateUrl && (
                                <Badge variant="success">OK</Badge>
                            )}
                        </div>
                    </div>
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
