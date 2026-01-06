import axios from 'axios';

// Detectar si estamos en localhost o en la red
const getBaseURL = () => {
    // En producción o móvil, usar la IP del host actual
    if (window.location.hostname !== 'localhost') {
        return `http://${window.location.hostname}:5000/api`;
    }
    // En desarrollo local
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar errores de sesión (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado o inválido
            console.warn('Sesión expirada. Redirigiendo a login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir al login
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
