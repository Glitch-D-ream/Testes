import React, { useState } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) {
      alert('Por favor, insira um texto para análise');
      return;
    }
    await onSubmit({
      text: text.trim(),
      author: author.trim() || undefined,
      category: category || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Texto */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-slate-700 mb-2">
          Texto para Análise *
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o discurso, post ou texto político para análise..."
          className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-500 mt-1">
          Máximo de 10.000 caracteres
        </p>
      </div>

      {/* Autor */}
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-slate-700 mb-2">
          Autor (Opcional)
        </label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Nome do político, empresa ou influencer"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
          Categoria (Opcional)
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        >
          <option value="">Selecione uma categoria...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={isLoading || text.trim().length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {isLoading ? 'Analisando...' : 'Analisar Promessas'}
      </button>
    </form>
  );
}
