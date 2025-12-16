import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Heart } from 'lucide-react';
import Card from './ui/Card';
import api from '../services/api';

const MusicPlayer = ({ song }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFavorite, setIsFavorite] = useState(song.is_favorite);

    useEffect(() => {
        if (audioRef.current) { if (isPlaying) audioRef.current.play(); else audioRef.current.pause(); }
    }, [isPlaying]);

    const handleTimeUpdate = () => { if (audioRef.current) setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100); };

    const toggleFavorite = async () => {
        try {
            if (isFavorite) await api.delete(`/music/favorites/${song.id}`); else await api.post('/music/favorites', { song_id: song.id });
            setIsFavorite(!isFavorite);
        } catch (error) { console.error("Error toggling favorite", error); }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(song.audio_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${song.title}.mp3`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (error) { console.error("Error downloading", error); }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-indigo-900 rounded-3xl p-8 mb-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-xl shadow-indigo-500/20">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-indigo-900 to-indigo-950"></div>
                <div className={`audio-wave ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>{[...Array(10)].map((_, i) => (<div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>))}</div>
                <div className="mt-8 text-center relative z-10"><h2 className="text-white text-2xl font-bold mb-2">{song.title}</h2><div className="flex flex-wrap justify-center gap-2">{song.tags && Object.values(song.tags).map((tag, idx) => (<span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-xs backdrop-blur-sm">{tag}</span>))}</div></div>
            </div>
            <div className="mb-8">
                <audio ref={audioRef} src={song.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
                <div className="w-full bg-slate-200 rounded-full h-2 mb-6 cursor-pointer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration; }}>
                    <div className="bg-primary h-2 rounded-full transition-all duration-100 relative" style={{ width: `${progress}%` }}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md transform scale-0 hover:scale-100 transition-transform"></div></div>
                </div>
                <div className="flex items-center justify-between px-4">
                    <button onClick={toggleFavorite} className={`p-3 rounded-full transition-colors ${isFavorite ? 'text-secondary bg-pink-50' : 'text-slate-400 hover:bg-slate-100'}`}><Heart size={24} fill={isFavorite ? "currentColor" : "none"} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 transition-transform">{isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}</button>
                    <button onClick={handleDownload} className="p-3 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors"><Download size={24} /></button>
                </div>
            </div>
            {song.lyrics && <Card className="flex-1 overflow-y-auto mb-6 bg-slate-50 border-none"><h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Letra</h3><p className="text-slate-700 whitespace-pre-line leading-relaxed text-lg font-medium">{song.lyrics}</p></Card>}
        </div>
    );
};
export default MusicPlayer;
