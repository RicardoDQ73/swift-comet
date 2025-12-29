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
                } else if (sourceContext === 'event') {
                    // Load specific song via ID (Access Control handled by backend)
                    // Also try to load the event playlist if eventId is present
                    const res = await api.get(`/music/songs/${id}`);
                    found = res.data;

                    // If we have an eventId, try to fetch the full playlist for navigation
                    const eventId = location.state?.eventId;
                    if (eventId) {
                        const eventRes = await api.get(`/events/${eventId}`);
                        // Map event songs to standard song format
                        if (Array.isArray(eventRes.data.songs)) {
                            sourcePlaylist = eventRes.data.songs.map(es => ({
                                id: es.song_id,
                                title: es.title,
                                audio_url: es.audio_url,
                                tags: es.tags
                            }));
                        } else {
                            console.warn("Event songs format incorrect", eventRes.data);
                            sourcePlaylist = [found];
                        }
                    } else {
                        sourcePlaylist = [found];
                    }
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

                    // Last resort: Try direct fetch if still not found (e.g. direct link)
                    if (!found) {
                        try {
                            const directRes = await api.get(`/music/songs/${id}`);
                            found = directRes.data;
                            sourcePlaylist = [found];
                        } catch (e) {
                            // Silent fail, will show "Not found"
                        }
                    }
                }

                if (found) {
                    // Inject autoPlay preference from navigation state
                    const shouldAutoPlay = location.state?.autoPlay !== undefined ? location.state.autoPlay : true;
                    setSong({ ...found, autoPlay: shouldAutoPlay });

                    setPlaylist(sourcePlaylist);
                    const index = sourcePlaylist.findIndex(s => s.id === parseInt(id));
                    setCurrentIndex(index);
                }
            } catch (error) { console.error("Error loading song", error); } finally { setLoading(false); }
        };
        fetchSong();
    }, [id, location.state]);

    const handleNavigate = (newIndex, shouldAutoPlay = true) => {
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
                // Shuffle mode usually keeps playing? Let's say yes unless specified
                navigate(`/player/${newSong.id}`, { state: { ...location.state, shuffle: true, autoPlay: shouldAutoPlay } });
            }
        } else if (newIndex >= 0 && newIndex < playlist.length) {
            const newSong = playlist[newIndex];
            // Preserve the 'from' state during navigation
            navigate(`/player/${newSong.id}`, { state: { ...location.state, autoPlay: shouldAutoPlay } });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    if (!song) return <div className="p-6 text-center"><p className="text-slate-500">Canción no encontrada</p><button onClick={() => navigate(-1)} className="text-primary mt-4">Volver</button></div>;


    class SimpleErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
            console.error("Player Error:", error, errorInfo);
        }

        render() {
            if (this.state.hasError) {
                return (
                    <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">
                        <h3 className="font-bold mb-2">Algo salió mal en el reproductor</h3>
                        <p className="text-sm font-mono bg-white p-2 rounded border border-red-200">
                            {this.state.error && this.state.error.toString()}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Recargar Página
                        </button>
                    </div>
                );
            }

            return this.props.children;
        }
    }

    const handleBack = () => {
        if (location.state?.eventId) {
            navigate(`/events/${location.state.eventId}`);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="pb-20 min-h-screen bg-white">
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-10">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24} className="text-slate-700" /></button>
                <h1 className="text-lg font-bold text-slate-900 truncate">Reproduciendo</h1>
            </div>
            <div className="px-6">
                <SimpleErrorBoundary>
                    <MusicPlayer
                        song={song}
                        playlist={playlist}
                        currentIndex={currentIndex}
                        onNavigate={handleNavigate}
                        isShuffle={location.state?.shuffle}
                        autoRecord={location.state?.autoRecord}
                        showStudio={location.state?.from === 'karaoke'} // Only show studio if coming from KaraokeHub
                        allowFavorites={location.state?.from !== 'event'} // Disable favorites if coming from an event
                    />
                </SimpleErrorBoundary>
            </div>
        </div>
    );
};
export default PlayerPage;
