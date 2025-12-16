import React, { useEffect, useState } from 'react';
import { Search, Play, Heart, Clock } from 'lucide-react';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const History = () => {
    const [songs, setSongs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const res = await api.get('/music/history', { params });
            setSongs(res.data);
        } catch (error) { console.error("Error fetching history", error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, [search]);

    const handleFavorite = async (e, songId) => {
        e.stopPropagation();
        try {
            await api.post('/music/favorites', { song_id: songId });
            setSongs(songs.map(s => s.id === songId ? { ...s, is_favorite: true } : s));
        } catch (error) { console.error("Error adding favorite", error); }
    };

    return (
        <div className="pb-20">
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Historial 🕒</h1><p className="text-slate-500 text-sm">Tus creaciones de las últimas 24h</p></div>
            <div className="mb-6"><Input placeholder="Buscar por título..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="space-y-4">
                {loading ? <p className="text-center text-slate-400">Cargando...</p> : songs.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><Clock className="mx-auto text-slate-300 mb-2" size={32} /><p className="text-slate-500">No hay canciones recientes</p></div>
                ) : (
                    songs.map((song) => (
                        <Card key={song.id} className="flex flex-col gap-3 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => navigate(`/player/${song.id}`)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-indigo-100 p-2 rounded-full text-primary flex-shrink-0"><Play size={20} fill="currentColor" /></div>
                                    <div className="min-w-0"><h3 className="font-bold text-slate-900 truncate">{song.title}</h3><p className="text-xs text-slate-500">{new Date(song.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                </div>
                                <button onClick={(e) => handleFavorite(e, song.id)} disabled={song.is_favorite} className={`p-2 rounded-full transition-colors ${song.is_favorite ? 'text-secondary bg-pink-50' : 'text-slate-400 hover:bg-slate-100'}`}><Heart size={20} fill={song.is_favorite ? "currentColor" : "none"} /></button>
                            </div>
                            {song.tags && <div className="flex flex-wrap gap-2">{Object.values(song.tags).map((tag, idx) => (<span key={idx} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{tag}</span>))}</div>}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
export default History;
