import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Building2, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface ContextualSearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  name: string;
  office?: string;
  state?: string;
  city?: string;
  party?: string;
}

export function ContextualSearchForm({ onSearch, isLoading = false }: ContextualSearchFormProps) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [params, setParams] = useState<SearchParams>({
    name: '',
    office: '',
    state: '',
    city: '',
    party: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.name.trim()) return;
    onSearch(params);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const offices = [
    { value: '', label: 'Qualquer Cargo' },
    { value: 'Presidente', label: 'Presidente' },
    { value: 'Governador', label: 'Governador' },
    { value: 'Senador', label: 'Senador' },
    { value: 'Deputado Federal', label: 'Deputado Federal' },
    { value: 'Deputado Estadual', label: 'Deputado Estadual' },
    { value: 'Prefeito', label: 'Prefeito' },
    { value: 'Vereador', label: 'Vereador' }
  ];

  const states = [
    '', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Busca Principal */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            name="name"
            value={params.name}
            onChange={handleChange}
            placeholder="Nome do político (ex: João Silva)"
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !params.name.trim()}
            className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              'Analisar'
            )}
          </button>
        </div>

        {/* Toggle Busca Avançada */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Filter size={14} />
            {isAdvanced ? 'Ocultar Filtros' : 'Adicionar Contexto (Cargo/Estado)'}
            {isAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Campos Avançados */}
        {isAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Briefcase size={12} /> Cargo Político
              </label>
              <select
                name="office"
                value={params.office}
                onChange={handleChange}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
              >
                {offices.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MapPin size={12} /> Estado (UF)
              </label>
              <select
                name="state"
                value={params.state}
                onChange={handleChange}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
              >
                <option value="">Qualquer Estado</option>
                {states.filter(s => s !== '').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 size={12} /> Cidade / Município
              </label>
              <input
                type="text"
                name="city"
                value={params.city}
                onChange={handleChange}
                placeholder="Ex: São Paulo"
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 size={12} /> Partido Político
              </label>
              <input
                type="text"
                name="party"
                value={params.party}
                onChange={handleChange}
                placeholder="Ex: PT, PL, PSDB"
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </form>

      {/* Dica de Uso */}
      {!isAdvanced && (
        <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
          <strong>Dica:</strong> Para políticos menos conhecidos, adicione o cargo ou estado para resultados mais precisos.
        </p>
      )}
    </div>
  );
}
