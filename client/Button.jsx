import React from 'react';

const variantClasses = {
    primary: 'bg-primary text-card hover:opacity-90',
    secondary: 'bg-secondary text-card hover:opacity-90',
    outline: 'bg-card text-primary border-2 border-primary hover:bg-primary hover:text-card',
    danger: 'bg-danger text-card hover:opacity-90',
    ghost: 'bg-transparent text-textColor hover:bg-background',
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    disabled = false,
    onClick,
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`
                inline-flex items-center justify-center gap-2
                rounded-lg font-semibold
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
