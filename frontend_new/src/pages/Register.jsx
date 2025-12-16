import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, GraduationCap } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', grade_level: '3 años' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        setLoading(true);
        try {
            await api.post('/auth/register', { name: formData.name, email: formData.email, password: formData.password, grade_level: formData.grade_level });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 bg-white py-10">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta Docente</h1>
                <p className="text-slate-500 text-sm">Únete para crear música mágica</p>
            </div>
            <form onSubmit={handleSubmit}>
                <Input label="Nombre Completo" name="name" placeholder="Ej: María Pérez" value={formData.name} onChange={handleChange} icon={User} required />
                <Input label="Correo Electrónico" name="email" type="email" placeholder="docente@ejemplo.com" value={formData.email} onChange={handleChange} icon={Mail} required />
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grado que Enseña <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><GraduationCap size={20} /></div>
                        <select name="grade_level" value={formData.grade_level} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm appearance-none">
                            <option value="3 años">Inicial - 3 Años</option>
                            <option value="4 años">Inicial - 4 Años</option>
                            <option value="5 años">Inicial - 5 Años</option>
                            <option value="1er Grado">Primaria - 1er Grado</option>
                            <option value="2do Grado">Primaria - 2do Grado</option>
                        </select>
                    </div>
                </div>
                <Input label="Contraseña" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} icon={Lock} required />
                <Input label="Confirmar Contraseña" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} icon={Lock} required />
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <Button type="submit" fullWidth isLoading={loading}>Registrarse</Button>
            </form>
            <div className="mt-6 text-center">
                <Link to="/login" className="text-slate-600 font-medium hover:text-primary">← Volver al Login</Link>
            </div>
        </div>
    );
};
export default Register;
