import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MusicPlayer from '../components/MusicPlayer';
import api from '../services/api';

const PlayerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const res = await api.get('/music/history');
                const found = res.data.find(s => s.id === parseInt(id));
                if (found) setSong(found);
                else {
                    const favRes = await api.get('/music/favorites');
                    const favFound = favRes.data.find(s => s.id === parseInt(id));
                    if (favFound) setSong(favFound);
                }
            } catch (error) { console.error("Error loading song", error); } finally { setLoading(false); }
        };
        fetchSong();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    if (!song) return <div className="p-6 text-center"><p className="text-slate-500">Canción no encontrada</p><button onClick={() => navigate(-1)} className="text-primary mt-4">Volver</button></div>;

    return (
        <div className="pb-20 min-h-screen bg-white">
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24} className="text-slate-700" /></button>
                <h1 className="text-lg font-bold text-slate-900 truncate">Reproduciendo</h1>
            </div>
            <div className="px-6"><MusicPlayer song={song} /></div>
        </div>
    );
};
export default PlayerPage;
