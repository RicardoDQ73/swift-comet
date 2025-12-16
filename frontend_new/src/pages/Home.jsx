import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Heart, Clock, Play, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import api from '../services/api';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [lastSong, setLastSong] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        const fetchHistory = async () => {
            try {
                const res = await api.get('/music/history');
                if (res.data && res.data.length > 0) setLastSong(res.data[0]);
            } catch (error) { console.error("Error cargando historial", error); }
        };
        fetchHistory();
    }, []);

    return (
        <div className="pb-20">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Hola, {user?.name?.split(' ')[0] || 'Docente'} 👋</h1>
                <p className="text-slate-500">¿Qué vamos a crear hoy?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Card onClick={() => navigate('/create')} className="col-span-2 bg-gradient-to-r from-primary to-indigo-600 text-white border-none shadow-lg shadow-indigo-500/30">
                    <div className="flex items-center justify-between">
                        <div><h2 className="text-xl font-bold mb-1">Crear Música</h2><p className="text-indigo-100 text-sm">Usar IA Mágica ✨</p></div>
                        <div className="bg-white/20 p-3 rounded-full"><Sparkles size={32} /></div>
                    </div>
                </Card>
                <Card onClick={() => navigate('/favorites')} className="flex flex-col items-center justify-center gap-2 text-center hover:border-secondary/50">
                    <div className="bg-pink-100 p-3 rounded-full text-secondary"><Heart size={24} /></div>
                    <span className="font-medium text-slate-700">Favoritos</span>
                </Card>
                <Card onClick={() => navigate('/history')} className="flex flex-col items-center justify-center gap-2 text-center hover:border-blue-500/50">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Clock size={24} /></div>
                    <span className="font-medium text-slate-700">Historial</span>
                </Card>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Tu última creación</h3>
            {lastSong ? (
                <Card className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-full text-primary"><Music size={24} /></div>
                    <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-900 truncate">{lastSong.title}</h4><p className="text-xs text-slate-500">Hace un momento</p></div>
                    <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Play size={20} className="text-slate-700" fill="currentColor" /></button>
                </Card>
            ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300"><p className="text-slate-400 text-sm">Aún no has creado música hoy</p></div>
            )}
        </div>
    );
};
export default Home;
