import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar acción",
    message = "¿Estás seguro?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger" // "danger" or "success"
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
        },
        success: {
            icon: 'bg-green-100 text-green-600',
            confirmBtn: 'bg-green-600 hover:bg-green-700 text-white'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Cerrar"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${styles.icon}`}>
                        <AlertTriangle size={32} />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
                    <p className="text-slate-600">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 py-3 px-4 font-medium rounded-xl transition-colors ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
