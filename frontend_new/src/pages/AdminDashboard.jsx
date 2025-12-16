import React, { useState, useEffect } from 'react';
import { Users, Trash2, Edit2, Activity, Save, X, Upload, Music } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import api from '../services/api';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'monitor', or 'upload'

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        title: '',
        lyrics: '',
        tags: '',
        audioFile: null
    });
    const [uploading, setUploading] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsers(res.data);
            } else {
                const res = await api.get('/admin/monitor');
                setActivity(res.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Error al cargar datos. Asegúrate de ser administrador.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = (id) => {
        setUserToDelete(id);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/admin/users/${userToDelete}`);
            setUsers(users.filter(u => u.id !== userToDelete));
            setUserToDelete(null);
        } catch (error) {
            alert('Error al eliminar usuario');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editingUser.id}`, {
                name: editingUser.name,
                role: editingUser.role,
                grade_level: editingUser.grade_level
            });
            setUsers(users.map(u => (u.id === editingUser.id ? editingUser : u)));
            setEditingUser(null);
        } catch (error) {
            alert('Error al actualizar usuario');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.audioFile) {
            alert('Por favor selecciona un archivo de audio');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('audio_file', uploadForm.audioFile);
            formData.append('title', uploadForm.title);
            formData.append('lyrics', uploadForm.lyrics);
            formData.append('tags', uploadForm.tags);

            const res = await api.post('/admin/upload-song', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('¡Canción subida exitosamente!');
            setUploadForm({ title: '', lyrics: '', tags: '', audioFile: null });
            // Reset file input
            document.getElementById('audioFileInput').value = '';
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Error al subir la canción');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="pb-20">
            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleDelete}
                title="¿Eliminar usuario?"
                message="Este usuario será eliminado permanentemente del sistema."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />

            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Panel de Administración 🛡️</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`p-2 rounded-xl ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}
                    >
                        <Users size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`p-2 rounded-xl ${activeTab === 'monitor' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}
                    >
                        <Activity size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`p-2 rounded-xl ${activeTab === 'upload' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}
                    >
                        <Music size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Cargando...</div>
            ) : (
                <>
                    {activeTab === 'users' && (
                        <div className="grid gap-4">
                            {users.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                                    {editingUser?.id === user.id ? (
                                        <form onSubmit={handleUpdate} className="flex-1 grid gap-2">
                                            <input
                                                className="border p-2 rounded"
                                                value={editingUser.name}
                                                onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    className="border p-2 rounded"
                                                    value={editingUser.role}
                                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                                >
                                                    <option value="docente">Docente</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <select
                                                    className="border p-2 rounded"
                                                    value={editingUser.grade_level || ''}
                                                    onChange={e => setEditingUser({ ...editingUser, grade_level: e.target.value })}
                                                >
                                                    <option value="">Sin Grado</option>
                                                    <option value="3 años">3 años</option>
                                                    <option value="4 años">4 años</option>
                                                    <option value="5 años">5 años</option>
                                                </select>
                                                <button type="submit" className="bg-green-500 text-white p-2 rounded"><Save size={16} /></button>
                                                <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-300 p-2 rounded"><X size={16} /></button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{user.name}</h3>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingUser(user)} className="p-2 hover:bg-slate-100 rounded-full text-blue-500"><Edit2 size={18} /></button>
                                                <button onClick={() => confirmDeleteUser(user.id)} className="p-2 hover:bg-slate-100 rounded-full text-red-500"><Trash2 size={18} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'monitor' && (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold mb-4">Últimas Generaciones</h3>
                            {activity.length === 0 ? <p>No hay actividad reciente.</p> : (
                                <ul className="space-y-3">
                                    {activity.map(item => (
                                        <li key={item.id} className="border-b pb-2">
                                            <div className="font-medium text-primary">{item.title}</div>
                                            <div className="text-sm text-slate-500">Por: {item.author} | {new Date(item.created_at).toLocaleString()}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Upload size={20} /> Subir Canción Manualmente</h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Título de la canción</label>
                                    <input
                                        type="text"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: Canción de los Números"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Archivo de Audio (MP3/WAV)</label>
                                    <input
                                        type="file"
                                        id="audioFileInput"
                                        accept=".mp3,.wav"
                                        onChange={(e) => setUploadForm({ ...uploadForm, audioFile: e.target.files[0] })}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Letra (opcional)</label>
                                    <textarea
                                        value={uploadForm.lyrics}
                                        onChange={(e) => setUploadForm({ ...uploadForm, lyrics: e.target.value })}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary resize-none"
                                        rows="4"
                                        placeholder="Letra de la canción..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tags (opcional, separados por coma)</label>
                                    <input
                                        type="text"
                                        value={uploadForm.tags}
                                        onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: Piano, Matemática, Alegre"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploading ? 'Subiendo...' : 'Subir Canción'}
                                </button>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
