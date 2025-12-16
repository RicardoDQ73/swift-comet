import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import Button from '../components/ui/Button';
import VoiceInput from '../components/VoiceInput';
import HandsFreeAssistant from '../components/HandsFreeAssistant';
import api from '../services/api';

const CreateMusic = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);

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

    return (
        <div className="pb-20">
            {showAssistant && <HandsFreeAssistant onComplete={(finalPrompt) => { setPrompt(finalPrompt); setShowAssistant(false); }} onCancel={() => setShowAssistant(false)} />}
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Estudio Mágico ✨</h1><p className="text-slate-500">Describe la música que imaginas</p></div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center gap-6">
                <VoiceInput onResult={(text) => setPrompt(text)} placeholder="Presiona y di: 'Una canción alegre de piano...'" />
                <div className="w-full"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="O escribe aquí tu idea..." className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary resize-none text-slate-700" rows="3" /></div>
            </div>
            <div className="mb-8 text-center">
                <button
                    onClick={() => setShowAssistant(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 mx-auto hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                    <Wand2 size={20} /> Usar Asistente de Voz Interactivo
                </button>
            </div>

            {/* Categorías de Ideas Rápidas */}
            <div className="mb-8 space-y-6">
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

            <Button fullWidth onClick={handleGenerate} isLoading={loading} disabled={!prompt} className="shadow-xl shadow-primary/20">Generar Música 🎵</Button>
        </div>
    );
};
export default CreateMusic;
