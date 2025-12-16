import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}>
            {children}
        </div>
    );
};
export default Card;
