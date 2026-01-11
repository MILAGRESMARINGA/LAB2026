import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    icon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
            block w-full rounded-lg border border-slate-300 bg-white dark:bg-dark-card dark:border-dark-border
            text-slate-900 dark:text-slate-100 placeholder-slate-400
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            disabled:bg-slate-50 disabled:text-slate-500
            ${icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            py-2 sm:text-sm
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {!error && helperText && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
