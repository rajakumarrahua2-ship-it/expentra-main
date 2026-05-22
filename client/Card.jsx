import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`bg-card shadow-md rounded-2xl p-5 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
