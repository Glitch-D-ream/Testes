import { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useFormValidation } from '../hooks/useFormValidation';

interface AnalysisFormProps {
  onSuccess?: (analysisId: string) => void;
}

export function AnalysisFormImproved({ onSuccess }: AnalysisFormProps) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('GERAL');
  const [submitted, setSubmitted] = useState(false);

  const { loading, error, submit } = useAnalysis({
    onSuccess: (data) => {
      setSubmitted(true);
      onSuccess?.(data.id);
      // Limpar formulário
      setText('');
      setAuthor('');
      setCategory('GERAL');
    },
  });

  const { errors, validate } = useFormValidation({
    text: {
      required: 'Texto é obrigatório',
      minLength: { value: 10, message: 'Texto deve ter no mínimo 10 caracteres' },
      maxLength: { value: 5000, message: 'Texto não pode exceder 5000 caracteres' },
    },
    author: {
      required: 'Autor é obrigatório',
      minLength: { value: 3, message: 'Autor deve ter no mínimo 3 caracteres' },
    },
    category: {
      required: 'Categoria é obrigatória',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate({ text, author, category });
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await submit(text, author, category);
    } catch (err) {
      // Erro já é tratado pelo hook
    }
  };

  const textLength = text.length;
  const textPercentage = (textLength / 5000) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-gray-700">
          Autor/Político
        </label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Ex: João Silva"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="GERAL">Geral</option>
          <option value="INFRASTRUCTURE">Infraestrutura</option>
          <option value="EDUCATION">Educação</option>
          <option value="HEALTH">Saúde</option>
          <option value="EMPLOYMENT">Emprego</option>
          <option value="SECURITY">Segurança</option>
          <option value="ENVIRONMENT">Meio Ambiente</option>
          <option value="SOCIAL">Social</option>
          <option value="ECONOMY">Economia</option>
          <option value="AGRICULTURE">Agricultura</option>
          <option value="CULTURE">Cultura</option>
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>

      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">
          Texto/Promessa ({textLength}/5000)
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o texto da promessa, discurso ou post..."
          rows={8}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(textPercentage, 100)}%` }}
          />
        </div>
        {errors.text && <p className="mt-1 text-sm text-red-600">{errors.text}</p>}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      {submitted && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Análise realizada com sucesso!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Analisando...' : 'Analisar Promessa'}
      </button>
    </form>
  );
}
