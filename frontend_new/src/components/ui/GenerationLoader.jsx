import React, { useEffect, useState } from 'react';
import { Loader2, Music, Sparkles } from 'lucide-react';

const MESSAGES = [
    "Escuchando a las musas... 👂",
    "Componiendo la melodía... 🎹",
    "Añadiendo ritmo... 🥁",
    "Mezclando instrumentos... 🎻",
    "¡Casi listo! Puliendo detalles... ✨"
];

const ESTIMATED_TIME = 20; // seconds

const GenerationLoader = () => {
    const [timeLeft, setTimeLeft] = useState(ESTIMATED_TIME);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Message rotator
        const msgTimer = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 4000);

        return () => {
            clearInterval(timer);
            clearInterval(msgTimer);
        };
    }, []);

    const progress = Math.min(100, ((ESTIMATED_TIME - timeLeft) / ESTIMATED_TIME) * 100);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>

                <div className="mb-6 relative inline-block">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center relative z-10 mx-auto">
                        <Sparkles size={40} className="text-indigo-600 animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                        <Music size={24} className="text-pink-500 animate-bounce" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {timeLeft === 0 ? "Finalizando..." : "Creando tu Canción"}
                </h3>

                <p className="text-slate-500 text-sm h-6 mb-8 transition-all duration-500">
                    {timeLeft === 0 ? "Esto está tomando un poco más de lo normal, pero valdrá la pena..." : MESSAGES[messageIndex]}
                </p>

                {/* Counter */}
                <div className="mb-6">
                    <span className={`text-4xl font-black tabular-nums ${timeLeft === 0 ? 'text-amber-500 animate-pulse' : 'text-slate-900'}`}>
                        {timeLeft}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">segundos estimados</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="text-xs text-slate-400 italic">
                    La IA está trabajando duro, por favor no cierres esta ventana.
                </p>
            </div>
        </div>
    );
};

export default GenerationLoader;
