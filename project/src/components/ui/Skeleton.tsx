import React from 'react';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = ''
}) => {
    const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-700/50';

    const variants = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md'
    };

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${className}`}
            style={{ width, height }}
        />
    );
};
