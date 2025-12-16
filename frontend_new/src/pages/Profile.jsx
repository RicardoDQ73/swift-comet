import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', grade_level: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setFormData(prev => ({ ...prev, name: user.name || '', email: user.email || '', grade_level: user.grade_level || '' }));
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const payload = { name: formData.name, grade_level: formData.grade_level };
            if (formData.password) payload.password = formData.password;
            await api.put('/auth/profile', payload);
            const currentUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...payload }));
            setMessage('Perfil actualizado correctamente');
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (error) { setMessage('Error al actualizar perfil'); } finally { setLoading(false); }
    };

    return (
        <div className="pb-20">
            <div className="mb-6 flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-900">Mi Perfil 👤</h1><button onClick={handleLogout} className="text-red-500 p-2 hover:bg-red-50 rounded-full" title="Cerrar Sesión"><LogOut size={24} /></button></div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-primary text-2xl font-bold">{formData.name.charAt(0)}</div></div>
                <form onSubmit={handleSubmit}>
                    <Input label="Nombre Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <Input label="Correo Electrónico" value={formData.email} disabled className="opacity-50" />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
                        <select value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} className="w-full rounded-xl border-slate-200 bg-white py-3 px-4 text-slate-900 focus:ring-2 focus:ring-primary">
                            <option value="3 años">3 años</option><option value="4 años">4 años</option><option value="5 años">5 años</option><option value="1er Grado">1er Grado</option><option value="2do Grado">2do Grado</option>
                        </select>
                    </div>
                    <Input label="Nueva Contraseña (Opcional)" type="password" placeholder="Dejar en blanco para mantener" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    {message && <p className={`text-center text-sm mb-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
                    <Button type="submit" fullWidth isLoading={loading}><Save size={18} className="mr-2" /> Guardar Cambios</Button>
                </form>
            </div>
        </div>
    );
};
export default Profile;
