import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { Button } from './Button';
import { Search, User, Tag, Send } from 'lucide-react';

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
  const [textError, setTextError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) {
      setTextError('O texto deve ter pelo menos 10 caracteres para uma análise precisa.');
      return;
    }
    setTextError('');
    await onSubmit({
      text: text.trim(),
      author: author.trim() || undefined,
      category: category || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <FormTextarea
          label="O que foi prometido?"
          placeholder="Cole aqui o discurso, post de rede social ou texto do plano de governo..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.length >= 10) setTextError('');
          }}
          error={textError}
          maxLength={10000}
          required
          className="min-h-[200px] text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Quem prometeu?"
          placeholder="Ex: Deputado Silva ou Prefeito João"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          icon={<User size={18} />}
          helperText="Opcional, mas ajuda no cruzamento de histórico"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Qual a área principal?
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Tag size={18} />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none outline-none"
            >
              <option value="">Detecção automática pela IA</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          icon={<Send size={18} />}
        >
          Iniciar Auditoria Digital
        </Button>
        <p className="text-center text-xs text-slate-400 mt-4">
          Ao clicar, você concorda que esta análise é baseada em dados públicos e algoritmos de IA.
        </p>
      </div>
    </form>
  );
}
