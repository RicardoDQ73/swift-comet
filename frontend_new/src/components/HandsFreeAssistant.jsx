import React, { useState, useEffect, useRef } from 'react';
import { Bot, Volume2, X } from 'lucide-react';
import api from '../services/api';

const HandsFreeAssistant = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({ activity: '', instrument: '' });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-PE';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => { if (mounted.current) setIsListening(true); };
            recognition.onend = () => { if (mounted.current) setIsListening(false); };
            recognition.onerror = (event) => {
                console.error("Speech Error:", event.error);
                if (mounted.current) setErrorMsg(`Error escuchando: ${event.error}`);
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setErrorMsg('');
                handleAnswerRef.current(text);
            };

            recognitionRef.current = recognition;
        } else {
            setErrorMsg("Tu navegador no soporta reconocimiento de voz.");
        }

        return () => {
            mounted.current = false;
            if (recognitionRef.current) recognitionRef.current.abort();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleAnswerRef = useRef(null);
    useEffect(() => {
        handleAnswerRef.current = handleAnswer;
    });

    useEffect(() => { startConversation(); }, []);

    const speak = async (text, callback) => {
        if (!mounted.current) return;
        setIsSpeaking(true);
        setErrorMsg('');

        try {
            const res = await api.post('/tts/speak', { text });

            if (!mounted.current) return;

            const audioUrl = `http://localhost:5000${res.data.audio_url}`;
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                if (!mounted.current) return;
                setIsSpeaking(false);
                if (callback) callback();
            };

            audio.onerror = (e) => {
                console.error("Audio playback error", e);
                if (!mounted.current) return;
                setErrorMsg("Error reproduciendo audio.");
                setIsSpeaking(false);
                if (callback) callback();
            }

            await audio.play();

        } catch (error) {
            console.error("Error TTS:", error);
            if (!mounted.current) return;
            setErrorMsg("Error de conexión con el servicio de voz.");
            setIsSpeaking(false);
            if (callback) callback();
        }
    };

    const listen = () => {
        if (recognitionRef.current && mounted.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Recognition start error:", e);
            }
        }
    };

    const startConversation = () => {
        setStep(1);
        speak("Hola, soy tu asistente musical. ¿Para qué curso o actividad necesitas la canción?", () => listen());
    };

    const handleAnswer = (text) => {
        if (!mounted.current) return;
        console.log("Respuesta recibida:", text);

        if (step === 1) {
            const newActivity = text;
            setAnswers(prev => ({ ...prev, activity: newActivity }));
            setStep(2);
            speak(`Entendido, para ${newActivity}. ¿Qué instrumento prefieres?`, () => listen());
        } else if (step === 2) {
            const newInstrument = text;
            setAnswers(prev => ({ ...prev, instrument: newInstrument }));
            setStep(3);

            const finalPrompt = `Una canción para ${answers.activity} con sonido de ${newInstrument}`;
            speak(`Perfecto. Crearé ${finalPrompt}. ¿Está bien?`, () => {
                if (mounted.current) onComplete(finalPrompt);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-white text-center backdrop-blur-sm">
            <button onClick={onCancel} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"><X size={24} /></button>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isSpeaking ? 'bg-primary scale-110 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : 'bg-slate-800'} ${isListening ? 'border-4 border-green-400 animate-pulse' : ''} ${errorMsg ? 'border-4 border-red-500' : ''}`}>
                {isSpeaking ? <Volume2 size={48} /> : <Bot size={48} />}
            </div>

            {errorMsg ? (
                <p className="text-red-400 font-bold mb-4">{errorMsg}</p>
            ) : (
                <h2 className="text-2xl font-bold mb-4">{step === 1 && "¿Para qué actividad?"}{step === 2 && "¿Qué instrumento?"}{step === 3 && "Confirmando..."}</h2>
            )}

            <p className="text-slate-300 text-lg">{isSpeaking ? "Hablando..." : isListening ? "Escuchando..." : "Procesando..."}</p>

            <div className="mt-8 flex gap-4">
                {answers.activity && <span className="px-4 py-2 bg-white/10 rounded-full text-sm">{answers.activity}</span>}
                {answers.instrument && <span className="px-4 py-2 bg-white/10 rounded-full text-sm">{answers.instrument}</span>}
            </div>
        </div>
    );
};
export default HandsFreeAssistant;
