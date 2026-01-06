import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Upload, ChevronDown, Mic, Music, Brain, School, Activity } from 'lucide-react';
import Button from '../components/ui/Button';
import GenerationLoader from '../components/ui/GenerationLoader';

import api from '../services/api';

const CreateMusic = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('instrumental'); // 'instrumental' or 'vocal'
    const [lyrics, setLyrics] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedModeId, setSelectedModeId] = useState(null);
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

    const CREATION_MODES = [
        {
            id: 'calm',
            label: 'Concentración',
            icon: Brain,
            color: 'bg-indigo-100 text-indigo-700',
            description: 'Música calmada para dibujar y relajarse.',
            prompt: "Genera una pista de música de fondo instrumental estilo 'Lo-fi suave para preescolar'. La atmósfera debe ser calmada, cálida, segura y muy relajante, diseñada para que niños de 3 a 5 años se concentren en tareas tranquilas como dibujar. Usa un tempo lento (alrededor de 60-70 BPM). Instrumentación sugerida: piano eléctrico Rhodes muy suave, una guitarra acústica punteada con delicadeza, y una percusión minimalista y apagada (sin ruidos fuertes de platillos). Puedes añadir sonidos de fondo casi imperceptibles de naturaleza tranquila (como pajaritos muy lejanos o brisa suave). La melodía debe ser simple, repetitiva y ondulante, sin cambios bruscos de volumen. Sin voces."
        },
        {
            id: 'teach',
            label: 'Enseñar',
            icon: School,
            color: 'bg-green-100 text-green-700',
            description: 'Ritmos claros para rutinas y atención.',
            prompt: "Crea una canción instrumental alegre, brillante y acogedora para un aula de niños de 3 a 5 años. El estilo debe ser de 'canción de ronda infantil' o 'música de programa educativo preescolar'. El ritmo debe ser muy claro, sencillo y marcado (compás de 4/4, tempo medio-alegre alrededor de 100 BPM), ideal para que los niños puedan aplaudir o marchar sentados al ritmo. Usa instrumentos acústicos amigables: un piano saltarín (bouncy piano), una flauta dulce o xilófono llevando la melodía principal, y percusión ligera como panderetas y palmas rítmicas. La melodía debe ser pegajosa, juguetona y fácil de tararear, con una estructura clara que invite a prestar atención al maestro. Sin letra."
        },
        {
            id: 'active',
            label: 'Actividad Física',
            icon: Activity,
            color: 'bg-orange-100 text-orange-700',
            description: 'Alta energía para baile y movimiento.',
            prompt: "Genera una pista de baile instrumental de alta energía y muy divertida para niños pequeños (3-5 años). El tempo debe ser rápido y motivador (alrededor de 120-130 BPM), diseñado específicamente para saltar, correr y hacer movimientos grandes. El estilo debe ser 'pop infantil electrónico' o 'música de circo moderna y acelerada'. Usa sintetizadores brillantes y juguetones (no agresivos), un bajo muy rítmico que invite a rebotar, y una batería con mucha energía. Incluye efectos de sonido divertidos y tontos de forma esporádica (como sonidos de 'boing', silbatos de juguete, o risas de bebé sampleadas) para mantener el interés y la sorpresa. La sensación general debe ser de pura alegría, movimiento tonto y celebración. Sin letra."
        }
    ];

    const handleModeSelect = (modeId) => {
        if (selectedModeId === modeId) {
            // Deselect if already active
            setSelectedModeId(null);
        } else {
            setSelectedModeId(modeId);
            // Don't clear prompt, allow user to add details
        }
    };

    const handleGenerate = async () => {
        // Determine effective prompt
        let finalPrompt = prompt;
        if (selectedModeId) {
            const mode = CREATION_MODES.find(m => m.id === selectedModeId);
            // Combine User Input (Topic/Details) + Mode Prompt (Style)
            // User input first ensures it's the primary subject
            if (mode) finalPrompt = `${prompt} ${mode.prompt}`;
        }

        if (!finalPrompt.trim()) return;
        setLoading(true);
        try {
            // New Payload structure
            const payload = {
                prompt: finalPrompt,
                model_type: activeTab, // Pass the active mode
                lyrics: activeTab === 'vocal' ? lyrics : null
            };

            const response = await api.post('/music/generate', payload, { timeout: 300000 }); // 5 minutes timeout
            navigate(`/player/${response.data.song.id}`);
        } catch (error) {
            console.error("Error generando:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.msg || error.message || "Error desconocido";
            alert(`Hubo un error al generar la música: ${errorMsg} `);
        } finally {
            setLoading(false);
        }
    };

    // ... existing toggleTag ...

    return (
        <div className="pb-20">
            {loading && <GenerationLoader />}
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Estudio Mágico ✨</h1><p className="text-slate-500">Crea música con IA</p></div>

            {/* Mode Selection Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('instrumental')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'instrumental' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Wand2 size={18} /> Melodía (Fondo)
                </button>
                <button
                    onClick={() => setActiveTab('vocal')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'vocal' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Mic size={18} /> Canción con Voz
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center gap-6 animate-in fade-in duration-300">
                <div className="w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {activeTab === 'vocal' ? 'Estilo Musical / Vibe' : (selectedModeId ? 'Detalles adicionales (Opcional)' : 'Describe tu idea')}
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={selectedModeId ? "Ej: Sobre dinosaurios, números del 1 al 10..." : (activeTab === 'vocal' ? "Ej: Pop alegre tipo Disney, voz femenina dulce..." : "Ej: Piano alegre para clase de matemáticas...")}
                        className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary resize-none text-slate-700"
                        rows="3"
                    />
                </div>

                {selectedModeId && (
                    <div className="w-full bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Wand2 size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900">Modo Activado: {CREATION_MODES.find(m => m.id === selectedModeId)?.label}</h4>
                            <p className="text-sm text-indigo-700">Prompt optimizado listo para usar. Haz clic en "Generar" para empezar.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'vocal' && (
                    <div className="w-full animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Letra de la Canción</label>
                        <textarea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            placeholder="Escribe la letra aquí... (La IA la cantará)"
                            className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-pink-500 resize-none text-slate-700"
                            rows="4"
                        />
                        <p className="text-xs text-slate-400 mt-2">✨ Tip: Escribe párrafos cortos para mejores resultados.</p>
                    </div>
                )}
            </div>

            {/* Creative Modes Selection */}
            <div className="mb-8">
                <h3 className="block text-sm font-bold text-slate-700 mb-3">Selecciona un Modo (Plantilla)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CREATION_MODES.map((mode) => {
                        const isActive = selectedModeId === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => handleModeSelect(mode.id)}
                                className={`p-4 rounded-xl border transition-all text-left group relative ${isActive
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-200'
                                    : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'
                                    }`}
                            >
                                {isActive && <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${mode.color}`}>
                                    <mode.icon size={20} />
                                </div>
                                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{mode.label}</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mode.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

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

            <Button fullWidth onClick={handleGenerate} isLoading={loading} disabled={!prompt && !selectedModeId} className={`shadow-xl ${activeTab === 'vocal' ? 'shadow-pink-500/20 bg-pink-600 hover:bg-pink-700' : 'shadow-primary/20'}`}>
                {activeTab === 'vocal' ? 'Generar Canción Completa 🎤' : (selectedModeId ? 'Generar con este Modo 🎵' : 'Generar Melodía 🎵')}
            </Button>
        </div>
    );
};
export default CreateMusic;
