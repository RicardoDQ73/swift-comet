import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, Heart, Clock, User, Shield, Mic } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navItems = [
        { icon: Home, label: 'Inicio', path: '/home' },
        { icon: Music, label: 'Crear', path: '/create' },
        { icon: Mic, label: 'Estudio', path: '/karaoke' }, // Nuevo item
        { icon: Heart, label: 'Favoritos', path: '/favorites' },
        { icon: Clock, label: 'Historial', path: '/history' },
    ];

    if (user.role === 'admin') {
        navItems.push({ icon: Shield, label: 'Admin', path: '/admin' });
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                <h1 className="text-lg font-bold text-primary">MusiCrea IA</h1>
                <button onClick={() => navigate('/profile')} className="p-2 bg-slate-100 rounded-full">
                    <User size={20} className="text-slate-600" />
                </button>
            </header>
            <main className="p-4 max-w-md mx-auto">
                <Outlet />
            </main>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center z-20 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-primary' : 'text-slate-400'}`}>
                            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
export default Layout;
