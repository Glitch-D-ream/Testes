import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean | string;
}

export interface ValidationError {
  [key: string]: string;
}

export interface UseFormValidationReturn {
  values: { [key: string]: string };
  errors: ValidationError;
  touched: { [key: string]: boolean };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: string, value: string) => void;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  resetForm: () => void;
  isValid: boolean;
}

/**
 * Custom hook for form validation with real-time feedback
 * 
 * @param initialValues - Initial form values
 * @param rules - Validation rules for each field
 * @param onSubmit - Callback when form is valid
 * @returns Form state and handlers
 */
export function useFormValidation(
  initialValues: { [key: string]: string },
  rules: { [key: string]: ValidationRule },
  onSubmit?: (values: { [key: string]: string }) => void
): UseFormValidationReturn {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback(
    (field: string, value: string): string => {
      const rule = rules[field];
      if (!rule) return '';

      // Required validation
      if (rule.required && !value.trim()) {
        return 'Este campo é obrigatório';
      }

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return `Mínimo de ${rule.minLength} caracteres`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Máximo de ${rule.maxLength} caracteres`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Formato inválido';
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value);
        if (typeof result === 'string') {
          return result;
        }
        if (!result) {
          return 'Valor inválido';
        }
      }

      return '';
    },
    [rules]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues(prev => ({ ...prev, [name]: value }));

      // Real-time validation if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors(prev => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched(prev => ({ ...prev, [name]: true }));

      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField]
  );

  const setFieldValue = useCallback((field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error,
      }));
    }
  }, [touched, validateField]);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const setFieldTouched = useCallback((field: string, isTouched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(rules).every(field => {
    const error = validateField(field, values[field] || '');
    return !error;
  });

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    isValid,
  };
}
