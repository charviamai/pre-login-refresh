import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PublicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
    href?: string;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 border-0',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
    outline: 'bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 hover:border-white/30 dark:border-white/20',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-11 px-8 text-base',
};

/**
 * PublicButton - Gradient button component for pre-login pages
 * Matches Charvium design system with gradient backgrounds and shadows
 * DO NOT use this for post-login pages (use VoltageButton instead)
 */
export const PublicButton: React.FC<PublicButtonProps> = ({
    variant = 'primary',
    size = 'md',
    asChild = false,
    href,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    // If href is provided, render as Link
    if (href && !disabled) {
        return (
            <Link to={href} className={combinedStyles}>
                {children}
            </Link>
        );
    }

    return (
        <button className={combinedStyles} disabled={disabled} {...props}>
            {children}
        </button>
    );
};

// Arrow icon for use in CTA buttons
export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg className={`${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);
