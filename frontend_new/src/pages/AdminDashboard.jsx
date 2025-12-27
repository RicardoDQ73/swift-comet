import React, { useState, useEffect } from 'react';
import { Users, Trash2, Edit2, Activity, Save, X, Archive, RefreshCw } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import api from '../services/api';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [archived, setArchived] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    // Unified Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'ARCHIVE' | 'RESTORE' | 'HARD_DELETE' | 'DELETE_USER', item: obj }

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsers(res.data);
            } else if (activeTab === 'monitor') {
                const res = await api.get('/admin/monitor');
                setActivity(res.data);
            } else if (activeTab === 'archive') {
                const res = await api.get('/admin/archive');
                setArchived(res.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Error al cargar datos. Asegúrate de ser administrador.");
        } finally {
            setLoading(false);
        }
    };

    // --- Action Triggers ---

    const askDeleteUser = (user) => {
        setPendingAction({ type: 'DELETE_USER', item: user });
        setModalOpen(true);
    };

    const askArchiveSong = (song) => {
        setPendingAction({ type: 'ARCHIVE', item: song });
        setModalOpen(true);
    };

    const askHardDeleteSong = (song) => {
        setPendingAction({ type: 'HARD_DELETE', item: song });
        setModalOpen(true);
    };

    const askRestoreSong = (song) => {
        setPendingAction({ type: 'RESTORE', item: song });
        setModalOpen(true);
    };

    // --- Execution ---

    const handleConfirmAction = async () => {
        if (!pendingAction) return;

        const { type, item } = pendingAction;
        try {
            if (type === 'DELETE_USER') {
                await api.delete(`/admin/users/${item.id}`);
                setUsers(users.filter(u => u.id !== item.id));
                // alert("Usuario eliminado correctamente");
            }
            else if (type === 'ARCHIVE') {
                await api.delete(`/admin/songs/${item.id}`); // Soft delete default
                setActivity(activity.map(s => s.id === item.id ? { ...s, is_archived: true } : s));
                // alert("Canción archivada");
            }
            else if (type === 'HARD_DELETE') {
                await api.delete(`/admin/songs/${item.id}?force=true`);
                setArchived(archived.filter(s => s.id !== item.id));
                // alert("Canción eliminada definitivamente");
            }
            else if (type === 'RESTORE') {
                await api.post(`/admin/archive/restore/${item.id}`);
                setArchived(archived.filter(s => s.id !== item.id));
                // alert("Canción restaurada");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar la acción.");
        } finally {
            setModalOpen(false);
            setPendingAction(null);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editingUser.id}`, {
                name: editingUser.name,
                role: editingUser.role,
                grade_level: editingUser.grade_level
            });
            setUsers(users.map(u => (u.id === editingUser.id ? editingUser : u)));
            setEditingUser(null);
            alert("Usuario actualizado correctamente");
        } catch (error) {
            alert('Error al actualizar usuario');
        }
    };

    // --- Modal Content Helper ---

    const getModalContent = () => {
        if (!pendingAction) return {};

        switch (pendingAction.type) {
            case 'ARCHIVE':
                return {
                    title: "📂 ¿Mover al Archivo?",
                    message: `Vas a archivar "${pendingAction.item.title}".\n\nNo se borrará, pero dejará de ser visible en el historial del docente. Siempre podrás recuperarla después.`,
                    confirmText: "Sí, Archivar",
                    variant: "primary" // Blue/Primary is friendly
                };
            case 'RESTORE':
                return {
                    title: "♻️ ¿Restaurar Canción?",
                    message: `Vamos a traer de vuelta "${pendingAction.item.title}".\n\nAparecerá nuevamente en el historial del docente por 24 horas más.`,
                    confirmText: "¡Restaurar!",
                    variant: "success" // Green for positive action
                };
            case 'HARD_DELETE':
                return {
                    title: "⚠️ ¿Eliminar Definitivamente?",
                    message: `¡Cuidado! Estás a punto de borrar "${pendingAction.item.title}" para siempre.\n\nEsta acción es irreversible y se eliminará el archivo de audio. ¿Seguro?`,
                    confirmText: "Borrar Para Siempre",
                    variant: "danger" // Red for destructive
                };
            case 'DELETE_USER':
                return {
                    title: "¿Eliminar Usuario?",
                    message: `Se eliminará al usuario ${pendingAction.item.name} y todos sus datos asociados.`,
                    confirmText: "Eliminar Usuario",
                    variant: "danger"
                };
            default:
                return {};
        }
    };

    const modalProps = getModalContent();

    return (
        <div className="pb-20">
            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={modalProps.title}
                message={modalProps.message}
                confirmText={modalProps.confirmText}
                cancelText="Cancelar"
                variant={modalProps.variant || 'danger'}
            />

            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Panel de Administración 🛡️</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`p-2 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        title="Usuarios"
                    >
                        <Users size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`p-2 rounded-xl transition-colors ${activeTab === 'monitor' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        title="Actividad Reciente"
                    >
                        <Activity size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`p-2 rounded-xl transition-colors ${activeTab === 'archive' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        title="Papelera / Archivo"
                    >
                        <Archive size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500 animate-pulse">Cargando datos...</div>
            ) : (
                <>
                    {activeTab === 'users' && (
                        <div className="grid gap-4">
                            {users.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                                    {editingUser?.id === user.id ? (
                                        <form onSubmit={handleUpdateUser} className="flex-1 grid gap-2">
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
                                                <button onClick={() => askDeleteUser(user)} className="p-2 hover:bg-slate-100 rounded-full text-red-500"><Trash2 size={18} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'monitor' && (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold mb-4 text-slate-700 flex items-center gap-2">
                                <Activity size={18} /> Actividad Reciente
                            </h3>
                            {activity.length === 0 ? <p className="text-slate-500 italic">No hay actividad reciente.</p> : (
                                <ul className="space-y-3">
                                    {activity.map(item => (
                                        <li key={item.id} className={`border-b pb-2 flex justify-between items-center last:border-0 ${item.is_archived ? 'opacity-60 bg-slate-50 p-2 rounded' : ''} ${item.is_favorite ? 'bg-pink-50 p-2 rounded border-pink-100' : ''}`}>
                                            <div>
                                                <div className="font-medium text-primary flex items-center gap-2">
                                                    {item.title}
                                                    {item.is_archived && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">ARCHIVADA</span>}
                                                    {item.is_favorite && <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">❤️ FAVORITO</span>}
                                                </div>
                                                <div className="text-sm text-slate-500">Por: {item.author} | {new Date(item.created_at).toLocaleString()}</div>
                                            </div>

                                            <div className="flex gap-2">
                                                {!item.is_archived && !item.is_favorite && (
                                                    <button
                                                        onClick={() => askArchiveSong(item)}
                                                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
                                                        title="Archivar canción"
                                                    >
                                                        <Archive size={18} />
                                                    </button>
                                                )}
                                                {item.is_favorite && (
                                                    <div className="p-2 text-pink-300" title="No se puede archivar una canción favorita">
                                                        <Save size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100">
                            <h3 className="font-bold mb-2 text-amber-800 flex items-center gap-2">
                                <Archive size={18} /> Archivo / Papelera
                            </h3>
                            <p className="text-xs text-amber-700 mb-4 bg-amber-100 p-2 rounded">
                                Aquí están las canciones que expiraron (más de 24h) y no fueron guardadas en favoritos.
                                Puedes <b>Restaurarlas</b> para darles otras 24h de vida en el historial del docente.
                            </p>

                            {archived.length === 0 ? <p className="text-slate-500 italic text-center py-4">El archivo está vacío.</p> : (
                                <ul className="space-y-3">
                                    {archived.map(item => (
                                        <li key={item.id} className="bg-white p-3 rounded-lg border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="font-medium text-slate-700">{item.title}</div>
                                                <div className="text-sm text-slate-500">
                                                    Autor: {item.author} <br />
                                                    Creado: {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-center">
                                                <button
                                                    onClick={() => askRestoreSong(item)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors text-sm font-medium"
                                                    title="Reactivar por 24h"
                                                >
                                                    <RefreshCw size={16} /> Restaurar
                                                </button>
                                                <button
                                                    onClick={() => askHardDeleteSong(item)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Eliminar DEFINITIVAMENTE"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
