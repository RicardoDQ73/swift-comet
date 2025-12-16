import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children, variant = 'primary', fullWidth = false, isLoading = false, onClick, type = 'button', disabled = false, className = ''
}) => {
    const baseStyles = "flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]";
    const variants = {
        primary: "bg-primary text-white hover:bg-indigo-600 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30",
        secondary: "bg-secondary text-white hover:bg-pink-600 focus:ring-pink-500 shadow-lg shadow-pink-500/30",
        outline: "border-2 border-slate-200 text-slate-600 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100 shadow-none",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30"
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled || isLoading} className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {children}
        </button>
    );
};
export default Button;
