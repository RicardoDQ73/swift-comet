import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Upload, ChevronDown } from 'lucide-react';
import Button from '../components/ui/Button';

import api from '../services/api';

const CreateMusic = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const [selectedTags, setSelectedTags] = useState([]);

    // Upload form state (for admin)
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        lyrics: '',
        tags: '',
        audioFile: null
    });
    const [uploading, setUploading] = useState(false);

    // Collapsible sections state
    const [showQuickIdeas, setShowQuickIdeas] = useState(false);

    // Check if user is admin
    const userRole = localStorage.getItem('role');

    const quickIdeas = {
        instruments: [
            { label: 'Piano', icon: '🎹' },
            { label: 'Guitarra', icon: '🎸' },
            { label: 'Tambor', icon: '🥁' },
            { label: 'Flauta', icon: '🎺' },
            { label: 'Violín', icon: '🎻' },
        ],
        activities: [
            { label: 'Matemática', icon: '➕' },
            { label: 'Comunicación', icon: '💬' },
            { label: 'Ciencia', icon: '🔬' },
            { label: 'Arte', icon: '🎨' },
            { label: 'Educación Física', icon: '⚽' },
        ],
        rhythm: [
            { label: 'Rápido', icon: '⚡' },
            { label: 'Lento', icon: '🐌' },
            { label: 'Moderado', icon: '🎵' },
            { label: 'Alegre', icon: '😊' },
            { label: 'Tranquilo', icon: '😌' },
        ],
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        try {
            const response = await api.post('/music/generate', { prompt });
            window.location.href = `/player/${response.data.song.id}`;
        } catch (error) {
            console.error("Error generando:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.msg || error.message || "Error desconocido";
            alert(`Hubo un error al generar la música: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            // Deseleccionar: quitar del array y del prompt
            const newTags = selectedTags.filter(t => t !== tag);
            setSelectedTags(newTags);
            setPrompt(newTags.join(' '));
        } else {
            // Seleccionar: agregar al array y al prompt
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            setPrompt(newTags.join(' '));
        }
    };

    const isSelected = (tag) => selectedTags.includes(tag);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.audioFile) {
            alert('Por favor selecciona un archivo de audio');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('audio_file', uploadForm.audioFile);
            formData.append('title', uploadForm.title);
            formData.append('lyrics', uploadForm.lyrics);
            formData.append('tags', uploadForm.tags);

            const res = await api.post('/admin/upload-song', formData, {
                headers: { 'Content-Type': undefined }
            });

            alert('¡Canción subida exitosamente!');
            setUploadForm({ title: '', lyrics: '', tags: '', audioFile: null });
            setShowUploadForm(false);
            // Navegar al reproductor
            window.location.href = `/player/${res.data.song.id}`;
        } catch (error) {
            console.error("Upload error details:", error);
            let msg = 'Error al subir: ';
            if (error.response) {
                // Server responded with a status code outside 2xx
                msg += `Server Error (${error.response.status}): ` +
                    (typeof error.response.data === 'string' ? error.response.data :
                        (error.response.data?.error || JSON.stringify(error.response.data)));
            } else if (error.request) {
                // Request made but no response received
                msg += 'No hubo respuesta del servidor. Verifica tu conexión o si el servidor está activo.';
            } else {
                // Error mostly in setting up the request
                msg += error.message;
            }
            alert(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="pb-20">
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Estudio Mágico ✨</h1><p className="text-slate-500">Describe la música que imaginas</p></div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center gap-6">
                <div className="w-full"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Escribe aquí tu idea (ej: Piano alegre...)" className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary resize-none text-slate-700" rows="3" /></div>
            </div>

            {/* Collapsible Quick Ideas */}
            <div className="mb-4">
                <button
                    onClick={() => setShowQuickIdeas(!showQuickIdeas)}
                    className="w-full py-4 px-5 bg-white border-2 border-indigo-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                            <span className="text-xl">💡</span>
                        </div>
                        <span className="font-semibold text-slate-800">Ideas Rápidas</span>
                    </div>
                    <ChevronDown size={22} className={`transition-transform text-indigo-600 ${showQuickIdeas ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Categorías de Ideas Rápidas */}
            {showQuickIdeas && (
                <div className="mb-8 space-y-6 animate-in fade-in duration-200">
                    {/* Instrumentos */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span>🎼</span> Instrumentos
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {quickIdeas.instruments.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => toggleTag(item.label)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected(item.label)
                                        ? 'bg-blue-600 text-white shadow-md scale-105'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actividades */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span>📚</span> Actividad a Realizar
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {quickIdeas.activities.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => toggleTag(item.label)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected(item.label)
                                        ? 'bg-green-600 text-white shadow-md scale-105'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ritmo */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span>🎶</span> Ritmo y Estilo
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {quickIdeas.rhythm.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => toggleTag(item.label)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected(item.label)
                                        ? 'bg-purple-600 text-white shadow-md scale-105'
                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        }`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Upload Button */}
            {userRole === 'admin' && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="w-full py-4 px-5 bg-white border-2 border-amber-200 hover:border-amber-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                <Upload size={20} className="text-amber-700" />
                            </div>
                            <span className="font-semibold text-slate-800">Subir Canción (Admin)</span>
                        </div>
                        <ChevronDown size={22} className={`transition-transform text-amber-600 ${showUploadForm ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            )}

            {/* Upload Form (Admin only) */}
            {showUploadForm && userRole === 'admin' && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-6 shadow-sm">
                    <h3 className="font-bold mb-4 text-amber-900">Subir Archivo MP3</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
                            <input
                                type="text"
                                value={uploadForm.title}
                                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500"
                                placeholder="Ej: Canción de los Números"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Archivo MP3/WAV</label>
                            <input
                                type="file"
                                accept=".mp3,.wav"
                                onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Letra (opcional)</label>
                            <textarea
                                value={uploadForm.lyrics}
                                onChange={(e) => setUploadForm({ ...uploadForm, lyrics: e.target.value })}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 resize-none"
                                rows="3"
                                placeholder="Letra..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tags (opcional)</label>
                            <input
                                type="text"
                                value={uploadForm.tags}
                                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500"
                                placeholder="Piano, Matemática, Alegre"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {uploading ? 'Subiendo...' : 'Subir Canción'}
                        </button>
                    </form>
                </div>
            )}

            <Button fullWidth onClick={handleGenerate} isLoading={loading} disabled={!prompt} className="shadow-xl shadow-primary/20">Generar Música 🎵</Button>
        </div>
    );
};
export default CreateMusic;
