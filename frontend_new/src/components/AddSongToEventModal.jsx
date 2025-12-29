import React, { useState, useEffect } from 'react';
import { X, Heart, Upload, Music, Search, Check } from 'lucide-react';
import api from '../services/api';
import Input from './ui/Input';

const AddSongToEventModal = ({ isOpen, onClose, eventId }) => {
    const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'upload'
    const [favorites, setFavorites] = useState([]);
    const [searchFav, setSearchFav] = useState('');
    const [selectedFav, setSelectedFav] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === 'favorites') {
            fetchFavorites();
        }
    }, [isOpen, activeTab]);

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/music/favorites');
            setFavorites(res.data);
        } catch (error) {
            console.error("Error fetching favorites", error);
        }
    };

    const handleAddFavorite = async () => {
        if (!selectedFav) return;
        setLoading(true);
        try {
            await api.post(`/events/${eventId}/add_favorite`, { song_id: selectedFav });
            alert("Canción agregada al evento");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al agregar canción");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle || uploadFile.name);

        try {
            await api.post(`/events/${eventId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Canción subida y agregada al evento");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al subir canción");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredFavorites = favorites.filter(f => f.title.toLowerCase().includes(searchFav.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Agregar al Evento</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-slate-50 border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Heart size={16} /> Mis Favoritos
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Upload size={16} /> Subir Archivo
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {activeTab === 'favorites' ? (
                        <div className="space-y-4">
                            <Input
                                placeholder="Buscar en mis favoritos..."
                                icon={Search}
                                value={searchFav}
                                onChange={(e) => setSearchFav(e.target.value)}
                            />
                            <div className="space-y-2">
                                {filteredFavorites.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4 text-sm">No se encontraron canciones</p>
                                ) : (
                                    filteredFavorites.map(fav => (
                                        <div
                                            key={fav.id}
                                            onClick={() => setSelectedFav(fav.id)}
                                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedFav === fav.id ? 'border-pink-500 bg-pink-50' : 'border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-full ${selectedFav === fav.id ? 'bg-pink-200 text-pink-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Music size={16} />
                                                </div>
                                                <span className={`font-medium truncate ${selectedFav === fav.id ? 'text-pink-900' : 'text-slate-700'}`}>{fav.title}</span>
                                            </div>
                                            {selectedFav === fav.id && <Check size={16} className="text-pink-600" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                                        <Upload size={32} />
                                    </div>
                                    <span className="font-bold text-slate-700 block mb-1">
                                        {uploadFile ? uploadFile.name : "Toca para elegir archivo"}
                                    </span>
                                    <span className="text-xs text-slate-400">MP3, WAV, M4A (Max 10MB)</span>
                                </label>
                            </div>

                            {uploadFile && (
                                <Input
                                    label="Nombre de la canción (Opcional)"
                                    placeholder={uploadFile.name}
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={activeTab === 'favorites' ? handleAddFavorite : handleUpload}
                        disabled={loading || (activeTab === 'favorites' && !selectedFav) || (activeTab === 'upload' && !uploadFile)}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'Procesando...' : (activeTab === 'favorites' ? 'Agregar Favorito' : 'Subir y Agregar')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSongToEventModal;
