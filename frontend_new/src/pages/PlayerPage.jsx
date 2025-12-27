import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MusicPlayer from '../components/MusicPlayer';
import api from '../services/api';

const PlayerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [song, setSong] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const sourceContext = location.state?.from;
                let found = null;
                let sourcePlaylist = [];

                if (sourceContext === 'favorites') {
                    // Force load from favorites FIRST
                    const favRes = await api.get('/music/favorites');
                    found = favRes.data.find(s => s.id === parseInt(id));
                    sourcePlaylist = favRes.data;
                } else if (sourceContext === 'history') {
                    // Force load from history FIRST
                    const res = await api.get('/music/history');
                    found = res.data.find(s => s.id === parseInt(id));
                    sourcePlaylist = res.data;
                } else {
                    // Fallback to auto-detection (original logic)
                    // Try history first
                    const res = await api.get('/music/history');
                    found = res.data.find(s => s.id === parseInt(id));
                    sourcePlaylist = res.data;

                    if (!found) {
                        const favRes = await api.get('/music/favorites');
                        found = favRes.data.find(s => s.id === parseInt(id));
                        sourcePlaylist = favRes.data;
                    }
                }

                if (found) {
                    setSong(found);
                    setPlaylist(sourcePlaylist);
                    const index = sourcePlaylist.findIndex(s => s.id === parseInt(id));
                    setCurrentIndex(index);
                }
            } catch (error) { console.error("Error loading song", error); } finally { setLoading(false); }
        };
        fetchSong();
    }, [id, location.state]);

    const handleNavigate = (newIndex) => {
        const isShuffle = location.state?.shuffle;

        if (isShuffle) {
            // Infinite Shuffle Logic: Pick any random song from playlist
            if (playlist.length > 0) {
                let randomIndex = Math.floor(Math.random() * playlist.length);
                // Try to avoid repeating the same song immediately if playlist > 1
                if (playlist.length > 1 && playlist[randomIndex].id === song.id) {
                    randomIndex = (randomIndex + 1) % playlist.length;
                }
                const newSong = playlist[randomIndex];
                navigate(`/player/${newSong.id}`, { state: { ...location.state, shuffle: true } });
            }
        } else if (newIndex >= 0 && newIndex < playlist.length) {
            const newSong = playlist[newIndex];
            // Preserve the 'from' state during navigation
            navigate(`/player/${newSong.id}`, { state: location.state });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    if (!song) return <div className="p-6 text-center"><p className="text-slate-500">Canción no encontrada</p><button onClick={() => navigate(-1)} className="text-primary mt-4">Volver</button></div>;

    return (
        <div className="pb-20 min-h-screen bg-white">
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24} className="text-slate-700" /></button>
                <h1 className="text-lg font-bold text-slate-900 truncate">Reproduciendo</h1>
            </div>
            <div className="px-6">
                <MusicPlayer
                    song={song}
                    playlist={playlist}
                    currentIndex={currentIndex}
                    onNavigate={handleNavigate}
                    isShuffle={location.state?.shuffle}
                    autoRecord={location.state?.autoRecord} // Pass auto-record flag
                />
            </div>
        </div>
    );
};
export default PlayerPage;
