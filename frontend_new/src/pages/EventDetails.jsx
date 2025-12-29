import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, User, Music, Trash2, GripVertical } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import AddSongToEventModal from '../components/AddSongToEventModal';

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableSongItem = ({ song, user, handlePlaySong, handleDeleteSong, isAdmin }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.event_song_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                    {/* Drag Handle (Only for Admin) */}
                    {isAdmin && (
                        <div {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 p-1">
                            <GripVertical size={20} />
                        </div>
                    )}

                    <div
                        className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                        onClick={() => handlePlaySong(song.song_id)}
                    >
                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 flex-shrink-0">
                            <Play size={16} fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 truncate text-sm">{song.title}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                <User size={10} />
                                <span>Subido por {song.added_by_id === user.id ? 'Ti' : song.added_by_name}</span>
                            </div>
                        </div>
                    </div>

                    {song.can_delete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.event_song_id); }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const res = await api.get(`/events/${id}`);
            setEvent(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySong = (songId) => {
        navigate(`/player/${songId}`, { state: { from: 'event', eventId: id } });
    };

    const handleDeleteSong = async (eventSongId) => {
        if (!window.confirm("¿Quitar esta canción del evento?")) return;
        try {
            await api.delete(`/events/${id}/songs/${eventSongId}`);
            setEvent({
                ...event,
                songs: event.songs.filter(s => s.event_song_id !== eventSongId)
            });
        } catch (error) {
            console.error(error);
            alert("Error al eliminar canción");
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setEvent((items) => {
                const oldIndex = items.songs.findIndex((item) => item.event_song_id === active.id);
                const newIndex = items.songs.findIndex((item) => item.event_song_id === over.id);

                const newSongs = arrayMove(items.songs, oldIndex, newIndex);

                // Call API to save order
                saveOrder(newSongs);

                return {
                    ...items,
                    songs: newSongs,
                };
            });
        }
    };

    const saveOrder = async (songs) => {
        const orderData = songs.map((s, index) => ({
            event_song_id: s.event_song_id,
            order: index
        }));

        try {
            await api.put(`/events/${id}/reorder`, { items: orderData });
        } catch (error) {
            console.error("Error saving order", error);
            // Optionally revert UI on error
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (!event) return <div>Evento no encontrado</div>;

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 sticky top-[60px] bg-slate-50 py-2 z-10">
                <button onClick={() => navigate('/events')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
                    <p className="text-xs text-slate-500">{event.songs.length} canciones</p>
                </div>
                {/* Botón Flotante para Añadir */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="ml-auto p-3 bg-pink-500 text-white rounded-full shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Song List with DnD */}
            <div className="space-y-3">
                {event.songs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Music size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Aún no hay canciones.</p>
                        <p className="text-sm">¡Sé el primero en agregar una!</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={event.songs.map(s => s.event_song_id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {event.songs.map(song => (
                                <SortableSongItem
                                    key={song.event_song_id}
                                    song={song}
                                    user={user}
                                    handlePlaySong={handlePlaySong}
                                    handleDeleteSong={handleDeleteSong}
                                    isAdmin={isAdmin} // Pass admin status to conditionally enable drag handle
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Add Song Modal */}
            <AddSongToEventModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    fetchEventDetails();
                }}
                eventId={id}
            />
        </div>
    );
};

export default EventDetails;
