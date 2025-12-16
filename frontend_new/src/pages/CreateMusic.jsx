import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Mic } from 'lucide-react';
import Button from '../components/ui/Button';
import VoiceInput from '../components/VoiceInput';
import HandsFreeAssistant from '../components/HandsFreeAssistant';
import api from '../services/api';

const CreateMusic = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);

    const tags = [
        { label: 'Alegre', type: 'mood' },
        { label: 'Triste', type: 'mood' },
        { label: 'Piano', type: 'instrument' },
        { label: 'Guitarra', type: 'instrument' },
        { label: 'Matemática', type: 'course' },
        { label: 'Lento', type: 'rhythm' },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        try {
            const response = await api.post('/music/generate', { prompt });
            // navigate(`/player/${response.data.song.id}`);
            window.location.href = `/player/${response.data.song.id}`;
        } catch (error) {
            console.error("Error generando:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.msg || error.message || "Error desconocido";
            alert(`Hubo un error al generar la música: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const addTag = (tag) => setPrompt(prev => prev ? `${prev} ${tag}` : tag);

    return (
        <div className="pb-20">
            {showAssistant && <HandsFreeAssistant onComplete={(finalPrompt) => { setPrompt(finalPrompt); setShowAssistant(false); }} onCancel={() => setShowAssistant(false)} />}
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Estudio Mágico ✨</h1><p className="text-slate-500">Describe la música que imaginas</p></div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col items-center gap-6">
                <VoiceInput onResult={(text) => setPrompt(text)} placeholder="Presiona y di: 'Una canción alegre de piano...'" />
                <div className="w-full"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="O escribe aquí tu idea..." className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary resize-none text-slate-700" rows="3" /></div>
            </div>
            <div className="mb-8 text-center"><button onClick={() => setShowAssistant(true)} className="text-primary font-medium text-sm flex items-center justify-center gap-2 mx-auto hover:underline"><Wand2 size={16} /> Usar Asistente de Voz Interactivo</button></div>
            <div className="mb-8"><p className="text-sm font-bold text-slate-700 mb-3">Ideas rápidas:</p><div className="flex flex-wrap gap-2">{tags.map((tag) => (<button key={tag.label} onClick={() => addTag(tag.label)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tag.type === 'mood' ? 'bg-yellow-100 text-yellow-700' : ''} ${tag.type === 'instrument' ? 'bg-blue-100 text-blue-700' : ''} ${tag.type === 'course' ? 'bg-green-100 text-green-700' : ''} ${tag.type === 'rhythm' ? 'bg-purple-100 text-purple-700' : ''}`}>{tag.label}</button>))}</div></div>
            <Button fullWidth onClick={handleGenerate} isLoading={loading} disabled={!prompt} className="shadow-xl shadow-primary/20">Generar Música 🎵</Button>
        </div>
    );
};
export default CreateMusic;
