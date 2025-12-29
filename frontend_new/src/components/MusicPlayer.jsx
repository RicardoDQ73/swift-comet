
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Heart, SkipBack, SkipForward } from 'lucide-react';
import Card from './ui/Card';
import ConfirmModal from './ui/ConfirmModal';
import AudioRecorder from './AudioRecorder';
import api from '../services/api';

const MusicPlayer = ({ song, playlist = [], currentIndex = 0, onNavigate, isShuffle = false, autoRecord = false, showStudio = false, allowFavorites = true }) => {
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFavorite, setIsFavorite] = useState(song.is_favorite);
    const [isDragging, setIsDragging] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Construct full audio URL with backend base URL
    const getAudioUrl = () => {
        if (!song || !song.audio_url) return '';
        if (song.audio_url.startsWith('http')) {
            return song.audio_url; // Already absolute
        }
        // Get backend base URL from api service
        const hostname = window.location.hostname;
        const backendUrl = hostname !== 'localhost'
            ? `http://${hostname}:5000`
            : 'http://localhost:5000';
        return `${backendUrl}${song.audio_url}`;
    };

    const audioUrl = getAudioUrl();

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback error", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Reset playing state when song changes
    useEffect(() => {
        // Check explicit autoPlay prop first (passed from navigation mainly for "Next" logic)
        // If autoPlay is specifically FALSE, respect it.
        // Otherwise, default to !showStudio (original logic)
        if (typeof song.autoPlay === 'boolean') {
            setIsPlaying(song.autoPlay);
        } else {
            setIsPlaying(!showStudio);
        }
        setIsFavorite(song.is_favorite);
    }, [song, showStudio]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && !isDragging) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration || 0;
            setCurrentTime(current);
            setDuration(dur);
            setProgress((current / (dur || 1)) * 100);
        }
    };

    const handleProgressClick = (e) => {
        if (!audioRef.current || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress(percentage * 100);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleProgressClick(e);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            handleProgressClick(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const handleFavoriteClick = () => {
        if (isFavorite) {
            // If removing from favorites, show confirmation
            setShowConfirmModal(true);
        } else {
            // If adding to favorites, do it directly
            toggleFavorite();
        }
    };

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                await api.delete(`/music/favorites/${song.id}`);
            } else {
                await api.post('/music/favorites', { song_id: song.id });
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error("Error toggling favorite", error);
            // alert("Error al actualizar favoritos");
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${song.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) { console.error("Error downloading", error); }
    };

    const handlePrevious = () => {
        if (onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1);
        }
    };

    const handleNext = () => {
        // Allow next if shuffle is on OR if we are not at end
        if (onNavigate && (isShuffle || currentIndex < playlist.length - 1)) {
            onNavigate(currentIndex + 1);
        }
    };

    const hasPrevious = currentIndex > 0;
    const hasNext = isShuffle || currentIndex < playlist.length - 1;

    const handleAudioError = (e) => {
        console.error("Audio playback error:", e);
        const error = e.target.error;
        let message = "Error desconocido de reproducción";
        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED: message = "Reproducción abortada"; break;
                case error.MEDIA_ERR_NETWORK: message = "Error de red al cargar audio"; break;
                case error.MEDIA_ERR_DECODE: message = "Audio corrupto o no soportado"; break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED: message = "Formato de audio no soportado o archivo no encontrado (404)"; break;
            }
        }
        // Only alert if it's not a transient loading issue
        console.warn(`Playback Error Code ${error?.code}: ${message}`);
        // alert(`No se pudo reproducir: ${message}`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* ... Modal ... */}
            {/* ... Visualizer ... */}
            <div className="bg-indigo-900 rounded-3xl p-8 mb-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-xl shadow-indigo-500/20">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-indigo-900 to-indigo-950"></div>
                <div className={`audio-wave ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>{[...Array(10)].map((_, i) => (<div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>))}</div>
                <div className="mt-8 text-center relative z-10">
                    <h2 className="text-white text-2xl font-bold mb-2">{song.title}</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                        {song.tags && typeof song.tags === 'object' && Object.values(song.tags).map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-xs backdrop-blur-sm">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mb-8">
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    crossOrigin="anonymous"
                    onTimeUpdate={handleTimeUpdate}
                    onError={handleAudioError}
                    onEnded={() => {
                        setIsPlaying(false);
                        if (hasNext) {
                            // Pass "false" to indicate we DO NOT want auto-play next
                            onNavigate(currentIndex + 1, false);
                        }
                    }}
                    onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                />

                {/* Time labels */}
                <div className="flex justify-between text-sm text-slate-500 mb-2 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Progress bar */}
                <div
                    ref={progressBarRef}
                    className="w-full bg-slate-200 rounded-full h-2 mb-6 cursor-pointer relative group"
                    onMouseDown={handleMouseDown}
                    onClick={handleProgressClick}
                >
                    <div
                        className="bg-gradient-to-r from-primary to-indigo-600 h-2 rounded-full transition-all duration-100 relative"
                        style={{ width: `${progress}%` }}
                    >
                        {/* Handle/Thumb */}
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg transition-transform ${isDragging ? 'scale-125' : 'scale-0 group-hover:scale-100'} cursor-grab active:cursor-grabbing`}></div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4">
                    {allowFavorites ? (
                        <button onClick={handleFavoriteClick} className={`p-3 rounded-full transition-colors ${isFavorite ? 'text-secondary bg-pink-50' : 'text-slate-400 hover:bg-slate-100'}`}><Heart size={24} fill={isFavorite ? "currentColor" : "none"} /></button>
                    ) : (
                        <div className="w-12 h-12" /> // Spacer to keep alignment
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={!hasPrevious}
                            className={`p-2 rounded-full transition-colors ${hasPrevious ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                            <SkipBack size={28} />
                        </button>

                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 transition-transform">
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!hasNext}
                            className={`p-2 rounded-full transition-colors ${hasNext ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                            <SkipForward size={28} />
                        </button>
                    </div>

                    <button onClick={handleDownload} className="p-3 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors"><Download size={24} /></button>
                </div>
            </div>

            {showStudio && (
                <div className="mb-6">
                    <AudioRecorder audioRef={audioRef} autoStart={autoRecord} song={song} />
                </div>
            )}

            {song.lyrics && <Card className="flex-1 overflow-y-auto mb-6 bg-slate-50 border-none"><h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Letra</h3><p className="text-slate-700 whitespace-pre-line leading-relaxed text-lg font-medium">{song.lyrics}</p></Card>}
        </div >
    );
};
export default MusicPlayer;
