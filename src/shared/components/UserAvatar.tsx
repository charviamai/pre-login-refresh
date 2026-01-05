import React from 'react';

interface UserAvatarProps {
    firstName: string;
    lastName: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    firstName,
    lastName,
    size = 'md',
    className = ''
}) => {
    // Get initials (first letter of first name + first letter of last name)
    const firstInitial = (firstName || '').charAt(0).toUpperCase();
    const lastInitial = (lastName || '').charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}`;

    // Size variants (20% smaller than original)
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-9 h-9 text-base'
    };

    return (
        <div
            className={`
        ${sizeClasses[size]} 
        rounded-full 
        border border-black dark:border-indigo-500/50
        flex items-center justify-center
        text-black dark:text-white font-medium
        bg-white dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-700
        cursor-pointer
        hover:bg-gray-100 dark:hover:from-indigo-500 dark:hover:to-purple-600
        transition-all duration-200
        ${className}
      `}
            title={`${firstName} ${lastName}`}
        >
            {initials}
        </div>
    );
};
