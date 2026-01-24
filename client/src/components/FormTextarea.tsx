import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={`
              w-full px-4 py-3 rounded-2xl border-2 transition-all outline-none resize-vertical min-h-[120px]
              ${error 
                ? 'border-rose-500 focus:ring-rose-500/10' 
                : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/10'
              }
              dark:bg-slate-900 dark:text-white
              disabled:opacity-50 disabled:cursor-not-allowed
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

FormTextarea.displayName = 'FormTextarea';
