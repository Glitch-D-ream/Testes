import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * Accessible textarea component with real-time validation and character count
 * Supports WCAG 2.1 AA accessibility standards
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      touched,
      helperText,
      required,
      variant = 'default',
      size = 'md',
      disabled,
      loading,
      id,
      className,
      maxLength,
      showCharCount = true,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = touched && error;
    const charCount = (props.value as string)?.length || 0;

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm min-h-24',
      md: 'px-3 py-2 text-base min-h-32',
      lg: 'px-4 py-3 text-lg min-h-40',
    };

    const variantClasses = {
      default: 'border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800',
      filled: 'bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 rounded-t-md',
      outlined: 'border-2 border-gray-300 dark:border-gray-600 rounded-lg',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled || loading}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              hasError
                ? `${textareaId}-error`
                : helperText
                  ? `${textareaId}-helper`
                  : showCharCount
                    ? `${textareaId}-count`
                    : undefined
            }
            aria-required={required}
            maxLength={maxLength}
            className={`
              w-full transition-all duration-200 resize-vertical
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed dark:text-white
              ${sizeClasses[size]}
              ${variantClasses[variant]}
              ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
              ${loading ? 'opacity-50' : ''}
              ${className || ''}
            `}
            {...props}
          />

          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex-1">
            {hasError && (
              <motion.p
                id={`${textareaId}-error`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {error}
              </motion.p>
            )}

            {!hasError && helperText && (
              <p
                id={`${textareaId}-helper`}
                className="text-sm text-muted-foreground"
              >
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p
              id={`${textareaId}-count`}
              className={`text-xs ml-4 whitespace-nowrap ${
                charCount > maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'
              }`}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </motion.div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
