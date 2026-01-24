import React, { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-xl border-2 transition-all outline-none
              ${icon ? 'pl-10' : ''}
              ${error 
                ? 'border-rose-500 focus:ring-rose-500/10' 
                : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/10'
              }
              dark:bg-slate-900 dark:text-white
              disabled:bg-slate-100 disabled:cursor-not-allowed
              focus:ring-4
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs font-bold text-rose-500 ml-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
