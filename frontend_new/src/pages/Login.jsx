import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import api from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', formData);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('role', response.data.user.role); // Save role separately

            // Forzamos recarga para evitar pantalla blanca y asegurar token
            window.location.href = '/home';
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 bg-white">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-primary mb-2">MusiCrea IA</h1>
                <p className="text-slate-500">Tu asistente musical para el aula</p>
            </div>
            <form onSubmit={handleSubmit}>
                <Input label="Correo Electrónico" name="email" type="email" placeholder="docente@ejemplo.com" value={formData.email} onChange={handleChange} icon={Mail} required />
                <div className="relative">
                    <Input label="Contraseña" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} icon={Lock} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-400">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <div className="flex justify-end mb-6">
                    <button type="button" className="text-sm text-primary font-medium">¿Olvidé mi contraseña?</button>
                </div>
                <Button type="submit" fullWidth isLoading={loading}>Ingresar</Button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-slate-600">¿No tienes cuenta? <Link to="/register" className="text-primary font-bold">Regístrate aquí</Link></p>
            </div>
        </div>
    );
};

export default Login;
