import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Shuffle, Trash2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import ConfirmModal from '../components/ui/ConfirmModal';
import api from '../services/api';

const Favorites = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [songToDelete, setSongToDelete] = useState(null);

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/music/favorites');
            setFavorites(res.data);
            setFiltered(res.data);
        } catch (error) { console.error("Error fetching favorites", error); }
    };

    useEffect(() => { fetchFavorites(); }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const results = favorites.filter(f => f.title.toLowerCase().includes(lowerSearch) || (f.tags && Object.values(f.tags).some(t => t.toLowerCase().includes(lowerSearch))));
        setFiltered(results);
    }, [search, favorites]);

    const handlePlaySong = (songId) => {
        navigate(`/player/${songId}`);
    };

    const confirmDelete = (songId) => {
        setSongToDelete(songId);
        setModalOpen(true);
    };

    const removeFavorite = async () => {
        if (!songToDelete) return;
        try {
            await api.delete(`/music/favorites/${songToDelete}`);
            setFavorites(favorites.filter(f => f.id !== songToDelete));
            setSongToDelete(null);
        } catch (error) {
            console.error("Error removing favorite", error);
            alert("Error al eliminar de favoritos");
        }
    };

    return (
        <div className="pb-20">
            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={removeFavorite}
                title="¿Eliminar de favoritos?"
                message="Esta canción se quitará de tu lista de favoritos."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />

            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Mis Favoritos ❤️</h1><p className="text-slate-500 text-sm">Tu colección personal</p></div>
            <div className="flex gap-2 mb-4"><div className="flex-1"><Input placeholder="Buscar..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} /></div><button className="bg-slate-100 p-3 rounded-xl text-slate-600 hover:bg-slate-200 h-[52px]"><Shuffle size={20} /></button></div>
            <div className="space-y-4">
                {filtered.length === 0 ? <p className="text-center text-slate-400 py-8">No tienes favoritos aún</p> : filtered.map((song) => (
                    <Card key={song.id} className="flex items-center justify-between gap-3">
                        <div
                            className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                            onClick={() => handlePlaySong(song.id)}
                        >
                            <div className="bg-pink-100 p-2 rounded-full text-secondary flex-shrink-0"><Play size={20} fill="currentColor" /></div>
                            <div className="min-w-0"><h3 className="font-bold text-slate-900 truncate">{song.title}</h3>{song.tags && <p className="text-xs text-slate-500 truncate">{Object.values(song.tags).join(', ')}</p>}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); confirmDelete(song.id); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </Card>
                ))}
            </div>
        </div>
    );
};
export default Favorites;
