import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { Button } from './Button';
import { useFormValidation } from '../hooks/useFormValidation';

interface AnalysisFormProps {
  onSubmit: (data: {
    text: string;
    author?: string;
    category?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const CATEGORIES = [
  { value: 'INFRASTRUCTURE', label: 'Infraestrutura' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'HEALTH', label: 'Saúde' },
  { value: 'EMPLOYMENT', label: 'Emprego' },
  { value: 'SECURITY', label: 'Segurança' },
  { value: 'ENVIRONMENT', label: 'Meio Ambiente' },
  { value: 'SOCIAL', label: 'Assistência Social' },
  { value: 'ECONOMY', label: 'Economia' },
  { value: 'AGRICULTURE', label: 'Agricultura' },
  { value: 'CULTURE', label: 'Cultura' },
];

export default function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [textError, setTextError] = useState('');
  const [authorError, setAuthorError] = useState('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    
    if (value.length < 10 && value.length > 0) {
      setTextError('Mínimo de 10 caracteres');
    } else if (value.length > 5000) {
      setTextError('Máximo de 5000 caracteres');
    } else {
      setTextError('');
    }
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthor(value);
    
    if (value.length > 100) {
      setAuthorError('Máximo de 100 caracteres');
    } else {
      setAuthorError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validar campos
    if (text.trim().length < 10) {
      setTextError('Por favor, insira pelo menos 10 caracteres');
      return;
    }

    if (text.trim().length > 5000) {
      setTextError('Texto muito longo (máximo 5000 caracteres)');
      return;
    }

    try {
      await onSubmit({
        text: text.trim(),
        author: author.trim() || undefined,
        category: category || undefined,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Erro ao enviar análise'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
      {/* Erro geral */}
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{submitError}</p>
        </div>
      )}

      {/* Texto para Análise */}
      <FormTextarea
        label="Texto para Análise"
        placeholder="Cole aqui o discurso, post ou texto político para análise..."
        value={text}
        onChange={handleTextChange}
        error={textError}
        maxLength={5000}
        required
      />

      {/* Autor (opcional) */}
      <FormInput
        label="Autor/Político (opcional)"
        placeholder="Nome do autor ou político"
        value={author}
        onChange={handleAuthorChange}
        error={authorError}
        maxLength={100}
      />

      {/* Categoria (opcional) */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Categoria (opcional)
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 dark:bg-gray-800 dark:text-white transition-colors"
        >
          <option value="">Selecione uma categoria...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          fullWidth
        >
          {isLoading ? 'Analisando...' : 'Analisar Promessa'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setText('');
            setAuthor('');
            setCategory('');
            setSubmitError('');
          }}
          disabled={isLoading}
        >
          Limpar
        </Button>
      </div>

      {/* Dica */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Dica:</strong> Quanto mais específico o texto, melhor será a análise. Inclua contexto e detalhes sobre a promessa.
        </p>
      </div>
    </form>
  );
}
