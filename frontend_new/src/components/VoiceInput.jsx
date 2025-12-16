import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceInput = ({ onResult, placeholder = "Presiona para hablar..." }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'es-PE';
            recognitionInstance.onstart = () => setIsListening(true);
            recognitionInstance.onend = () => setIsListening(false);
            recognitionInstance.onresult = (event) => onResult(event.results[0][0].transcript);
            recognitionInstance.onerror = () => { setError('No te escuché bien, intenta de nuevo.'); setIsListening(false); };
            setRecognition(recognitionInstance);
        } else { setError('Tu navegador no soporta reconocimiento de voz.'); }
    }, [onResult]);

    const toggleListening = () => {
        if (!recognition) return;
        setError('');
        if (isListening) recognition.stop(); else recognition.start();
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={toggleListening} className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-primary shadow-lg hover:bg-indigo-600'}`}>
                {isListening ? <MicOff className="text-white w-8 h-8" /> : <Mic className="text-white w-8 h-8" />}
            </button>
            <p className={`text-sm font-medium ${isListening ? 'text-red-500' : 'text-slate-500'}`}>{error || (isListening ? 'Escuchando...' : placeholder)}</p>
        </div>
    );
};
export default VoiceInput;
