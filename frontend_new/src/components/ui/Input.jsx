import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, error, icon: Icon, name, required = false, className = '' }) => {
    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
            <div className="relative">
                {Icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icon size={20} /></div>}
                <input
                    type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
                    className={`w-full rounded-xl border-slate-200 bg-white py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>}
        </div>
    );
};
export default Input;
