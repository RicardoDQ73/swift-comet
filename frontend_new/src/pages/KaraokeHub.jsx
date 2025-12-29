import React, { useEffect, useState } from 'react';
import { Mic, Play, ArrowRight, Music2 } from 'lucide-react';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const KaraokeHub = () => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            // Reusamos endpoint de history pues contiene todas las canciones creadas por IA
            // Integramos filtro para solo ver GENERATED (ignorar covers)
            const res = await api.get('/music/history?song_type=GENERATED');
            setSongs(res.data);
        } catch (error) {
            console.error("Error fetching songs for karaoke", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSing = (song) => {
        // Navegar al reproductor con flag 'autoRecord'
        navigate(`/player/${song.id}`, { state: { autoRecord: false, from: 'karaoke' } });
    };

    return (
        <div className="pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Mic className="text-primary" /> Estudio Karaoke
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Selecciona una pista base y graba tu voz profesionalmente.
                </p>
            </header>

            {loading ? (
                <div className="grid gap-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>)}
                </div>
            ) : songs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Music2 className="mx-auto text-slate-300 mb-2" size={40} />
                    <p className="text-slate-500 font-medium">No tienes pistas disponibles.</p>
                    <button
                        onClick={() => navigate('/create')}
                        className="mt-4 text-primary font-bold hover:underline"
                    >
                        Generar Música Ahora
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {songs.map((song) => (
                        <div
                            key={song.id}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-indigo-100 group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Music2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate pr-2">{song.title}</h3>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            IA Generated
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handleSing(song)}
                                    className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-indigo-700"
                                >
                                    <Mic size={18} />
                                    GRABAR VOZ
                                </button>
                                <button
                                    onClick={() => navigate(`/player/${song.id}`, { state: { from: 'karaoke' } })}
                                    className="w-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                                    title="Solo escuchar"
                                >
                                    <Play size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KaraokeHub;
