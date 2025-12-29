
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Download, Play, Pause, Trash2, Settings, Volume2, Mic as MicIcon, Loader, Heart } from 'lucide-react';
import { audioBufferToWav } from '../utils/audioUtils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ui/ConfirmModal';

const AudioRecorder = ({ audioRef, autoStart = false, song = null }) => {
    // States
    const [isRecording, setIsRecording] = useState(false);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [count, setCount] = useState(3);

    // Data States
    const [voiceBlob, setVoiceBlob] = useState(null); // Raw voice recording
    const [voiceUrl, setVoiceUrl] = useState(null);   // URL for the raw voice

    // UI States
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Mixing States
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [micVolume, setMicVolume] = useState(1.0);
    const [showSettings, setShowSettings] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigate = useNavigate();

    // Refs
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const timerRef = useRef(null);
    const autoStartedRef = useRef(false); // Fix double trigger in StrictMode

    // Preview Audio Refs
    const voiceSourceNodeRef = useRef(null);
    const voiceGainNodeRef = useRef(null);
    const musicGainNodeRef = useRef(null); // Optional if we routed music via WebAudio, but we use element volume

    useEffect(() => {
        if (autoStart && !isRecording && !isCountingDown && !voiceBlob && !autoStartedRef.current) {
            autoStartedRef.current = true;
            console.log("Auto-starting recording session...");
            // Scroll to view
            setTimeout(() => {
                document.getElementById('recorder-section')?.scrollIntoView({ behavior: 'smooth' });
                startCountdown();
            }, 800); // Small delay for UI transition
        }
    }, [autoStart]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
            if (voiceUrl) URL.revokeObjectURL(voiceUrl);
        };
    }, []);

    // -------------------------------------------------------------
    // 1. RECORDING PHASE (Capture Raw Voice Only)
    // -------------------------------------------------------------
    const startCountdown = () => {
        setIsCountingDown(true);
        setCount(3);
        let counter = 3;
        const interval = setInterval(() => {
            counter--;
            setCount(counter);
            if (counter === 0) {
                clearInterval(interval);
                setIsCountingDown(false);
                startRecordingSession();
            }
        }, 1000);
    };

    const startRecordingSession = async () => {
        if (!audioRef.current) return;
        try {
            // Clean previous
            setVoiceBlob(null);
            setVoiceUrl(null);

            // Get Mic Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Recorder for Clean Voice
            // We record mono/stereo raw input. No mixing with music here.
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus' : 'audio/webm';
            const recorder = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current = recorder;
            const chunks = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setVoiceBlob(blob);
                setVoiceUrl(url);
                stream.getTracks().forEach(t => t.stop());
            };

            // Start Sync
            recorder.start();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1.0; // Reset player volume for recording monitoring (user hears music full)
            // Wait: Usually user wants to hear music at comfortable level. 
            // We won't touch music volume during recording (it's "Monitor" volume).
            // But for the final mix, we use 'musicVolume' state.

            audioRef.current.play();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error", err);
            alert("Error al grabar: " + err.message);
            setIsCountingDown(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    // -------------------------------------------------------------
    // 2. PREVIEW PHASE (Real-time Mixing)
    // -------------------------------------------------------------

    // Update Music Volume on Player during Preview
    useEffect(() => {
        if (audioRef.current && isPlayingPreview) {
            audioRef.current.volume = musicVolume;
        } else if (audioRef.current && !isPlayingPreview && !isRecording) {
            // Reset to normal when not previewing/recording? 
            // Or keep it? Let's keep it to 1.0 when idle/recording so user hears it well.
            // Actually if we want to "preview" volume changes, we should apply them.
            // But if user sets musicVolume to 0.1, they might not hear backing track while recording next time.
            // Let's only apply 'musicVolume' to audioRef during PREVIEW mode.
            audioRef.current.volume = 1.0;
        }
    }, [musicVolume, isPlayingPreview, isRecording]);

    // Update Voice Gain during Preview
    useEffect(() => {
        if (voiceGainNodeRef.current) {
            voiceGainNodeRef.current.gain.value = micVolume;
        }
    }, [micVolume]);

    const togglePreview = async () => {
        if (isPlayingPreview) {
            // STOP
            if (voiceSourceNodeRef.current) {
                try { voiceSourceNodeRef.current.stop(); } catch (e) { }
            }
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlayingPreview(false);
        } else {
            // PLAY
            if (!voiceBlob || !audioRef.current) return;

            // Init AudioContext for Preview
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            // Decode Voice for WebAudio
            const arrayBuffer = await voiceBlob.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            // Create Graph
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            voiceSourceNodeRef.current = source;

            const gainNode = ctx.createGain();
            gainNode.gain.value = micVolume;
            voiceGainNodeRef.current = gainNode;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Sync Start
            audioRef.current.volume = musicVolume; // Apply mix volume
            audioRef.current.currentTime = 0;

            source.start(0);
            audioRef.current.play();

            setIsPlayingPreview(true);

            // Handle Stop automatically (when voice ends)
            source.onended = () => {
                setIsPlayingPreview(false);
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 1.0; // Reset
            };
        }
    };

    // -------------------------------------------------------------
    // 3. EXPORT PHASE (Offline Render)
    // -------------------------------------------------------------
    // 3. EXPORT PHASE (Offline Render)
    // -------------------------------------------------------------

    const generateMixBlob = async () => {
        if (!voiceBlob || !audioRef.current) return null;

        // 1. Fetch Music Data (CORS required)
        const musicResp = await fetch(audioRef.current.src);
        const musicArrayBuffer = await musicResp.arrayBuffer();

        // 2. Prepare Voice Data
        const voiceArrayBuffer = await voiceBlob.arrayBuffer();

        // 3. Decode Both (Use a temporary context)
        const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
        const musicBuffer = await tempCtx.decodeAudioData(musicArrayBuffer);
        const voiceBuffer = await tempCtx.decodeAudioData(voiceArrayBuffer);

        // 4. Create Offline Context
        const duration = Math.max(musicBuffer.duration, voiceBuffer.duration);
        const offlineCtx = new OfflineAudioContext(2, duration * 44100, 44100);

        // 5. Schedule Music
        const musicSource = offlineCtx.createBufferSource();
        musicSource.buffer = musicBuffer;
        const musicGain = offlineCtx.createGain();
        musicGain.gain.value = musicVolume;
        musicSource.connect(musicGain);
        musicGain.connect(offlineCtx.destination);
        musicSource.start(0);

        // 6. Schedule Voice
        const voiceSource = offlineCtx.createBufferSource();
        voiceSource.buffer = voiceBuffer;
        const voiceGain = offlineCtx.createGain();
        voiceGain.gain.value = micVolume;
        voiceSource.connect(voiceGain);
        voiceGain.connect(offlineCtx.destination);
        voiceSource.start(0);

        // 7. Render
        const renderedBuffer = await offlineCtx.startRendering();

        // 8. Convert to WAV/Blob
        const wavData = audioBufferToWav(renderedBuffer, { float32: true });
        return new Blob([wavData], { type: 'audio/wav' });
    };

    const handleDownload = async () => {
        setIsRendering(true);
        try {
            const finalBlob = await generateMixBlob();
            if (!finalBlob) return;

            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mi_estudio_mix.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("Rendering error:", err);
            alert("Error generando la mezcla: " + err.message);
        } finally {
            setIsRendering(false);
        }
    };

    const handleSaveToFavorites = async () => {
        if (!song) {
            alert("No se puede guardar: Canción base no identificada.");
            return;
        }
        setIsSaving(true);
        try {
            const finalBlob = await generateMixBlob();
            if (!finalBlob) return;

            const formData = new FormData();
            formData.append('file', finalBlob, 'mix.wav');
            formData.append('original_song_id', song.id);

            await api.post('/music/upload_mix', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setShowSuccessModal(true); // Trigger custom modal instead of alert

        } catch (err) {
            console.error(err);
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };


    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const deleteRecording = () => {
        setVoiceBlob(null);
        setVoiceUrl(null);
        setIsPlayingPreview(false);
    };

    return (
        <div id="recorder-section" className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 relative overflow-hidden transition-all">
            <ConfirmModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/favorites'); // Redirect on close/confirm
                }}
                onConfirm={() => {
                    setShowSuccessModal(false);
                    navigate('/favorites'); // Redirect on close/confirm
                }}
                title="¡Guardado Exitoso! 🌟"
                message="Tu mezcla se ha guardado correctamente en tus favoritos."
                confirmText="Ver Favoritos"
                cancelText={null} // Hide cancel button
                variant="success"
            />
            {isCountingDown && (
                <div className="absolute inset-0 bg-indigo-900/90 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-9xl font-black text-white animate-bounce">{count}</div>
                </div>
            )}

            {isRendering && (
                <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader className="animate-spin text-indigo-600 mb-2" size={48} />
                    <span className="font-bold text-slate-700">Procesando tu mezcla...</span>
                </div>
            )}

            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    🎤 Estudio Karaoke Pro
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {isRecording ? "🔴 GRABANDO " + formatTime(recordingTime) : "LISTO"}
                </span>
            </div>

            {/* Mixing Console - Only Visible when we have a recording to mix */}
            {voiceBlob && (
                <div className="bg-slate-200/50 rounded-lg p-3 mb-4 text-xs animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-indigo-900 flex items-center gap-1"><Settings size={12} /> Mesa de Mezclas (Post-Grabación)</span>
                        <span className="text-[10px] text-green-600 font-bold animate-pulse">● Edición en Vivo</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={14} className="text-slate-500" />
                        <label className="w-20 font-medium text-slate-600">Música ({Math.round(musicVolume * 100)}%)</label>
                        <input
                            type="range" min="0" max="1" step="0.05"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-600 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <MicIcon size={14} className="text-slate-500" />
                        <label className="w-20 font-medium text-slate-600">Voz ({Math.round(micVolume * 100)}%)</label>
                        <input
                            type="range" min="0" max="2" step="0.05"
                            value={micVolume}
                            onChange={(e) => setMicVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-pink-600 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            )}

            {!voiceBlob ? (
                <div className="flex flex-col items-center gap-3 py-4">
                    <button
                        onClick={isRecording ? stopRecording : startCountdown}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all bg-gradient-to-br ${isRecording
                            ? 'from-red-500 to-pink-600 shadow-[0_0_0_8px_rgba(239,68,68,0.3)] animate-pulse'
                            : 'from-indigo-500 to-purple-600 shadow-xl hover:scale-105'
                            }`}
                    >
                        {isRecording ? <Square className="text-white w-8 h-8" fill="currentColor" /> : <Mic className="text-white w-10 h-10" />}
                    </button>
                    <p className="text-xs text-slate-400 text-center max-w-[200px]">
                        {isRecording ? 'Capturando tu voz pura...' : 'Ajusta la música, presiona grabar y canta al terminar la cuenta atrás.'}
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                    <button onClick={togglePreview} className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 text-indigo-600 transition-colors shrink-0">
                        {isPlayingPreview ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 mb-1 truncate">Grabación Lista</div>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden w-full">
                            <div className={`absolute top-0 left-0 h-full bg-indigo-500 ${isPlayingPreview ? 'animate-[progress_linear_infinite]' : ''}`} style={{ width: '100%' }}></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">¡Mueve los sliders arriba para probar la mezcla!</div>
                    </div>

                    <button onClick={handleDownload} className="p-3 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-lg shadow-green-500/30 transition-colors shrink-0" title="Renderizar y Descargar">
                        <Download size={20} />
                    </button>

                    {song && (
                        <button
                            onClick={handleSaveToFavorites}
                            disabled={isSaving}
                            className={`p-3 text-white rounded-full shadow-lg transition-colors shrink-0 ${isSaving ? 'bg-slate-400' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-500/30'}`}
                            title="Guardar Mix en Favoritos"
                        >
                            {isSaving ? <Loader className="animate-spin" size={20} /> : <Heart size={20} fill="currentColor" />}
                        </button>
                    )}

                    <button onClick={deleteRecording} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0" title="Descartar">
                        <Trash2 size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
