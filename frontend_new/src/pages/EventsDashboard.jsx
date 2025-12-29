import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';

const EventsDashboard = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');

    // Deletion State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/');
            setEvents(res.data);
        } catch (error) {
            console.error("Error fetching events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/events/', { title: newEventTitle });
            setEvents([{ ...res.data, id: res.data.event_id, title: newEventTitle, song_count: 0, created_by: user.name, created_at: new Date().toISOString() }, ...events]);
            setShowCreateModal(false);
            setNewEventTitle('');
        } catch (error) {
            console.error(error);
            alert("Error al crear evento");
        }
    };

    const confirmDelete = (e, event) => {
        e.stopPropagation(); // Prevent card click navigation
        setEventToDelete(event);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!eventToDelete) return;
        try {
            await api.delete(`/events/${eventToDelete.id}`);
            setEvents(events.filter(e => e.id !== eventToDelete.id));
            setShowDeleteModal(false);
            setEventToDelete(null);
        } catch (error) {
            console.error("Error deleting event", error);
            alert("Error al eliminar evento");
        }
    };

    return (
        <div className="pb-20">
            {/* Custom Warning Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="¿Eliminar Evento?"
                message={`Estás a punto de borrar permanentemente la lista "${eventToDelete?.title}". Esta acción afectará a todos los docentes que la usan. ¿Estás seguro?`}
                confirmText="Sí, borrar evento"
                cancelText="Cancelar"
                variant="danger"
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Eventos 📅</h1>
                    <p className="text-slate-500 text-sm">Listas compartidas</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200"
                    >
                        <Plus size={24} />
                    </button>
                )}
            </div>

            {/* Create Modal (Simple inline for now) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">Nuevo Evento</h3>
                        <form onSubmit={handleCreateEvent}>
                            <Input
                                placeholder="Nombre del evento (Ej: Día de la Madre)"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="mb-4"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-medium text-slate-600">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-xl font-medium text-white">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {events.map(event => (
                    <Card key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors relative group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                                    <p className="text-xs text-slate-500">{event.song_count} canciones • Por {event.created_by}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <button
                                        onClick={(e) => confirmDelete(e, event)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                                        title="Eliminar evento"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <ChevronRight className="text-slate-300" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EventsDashboard;
