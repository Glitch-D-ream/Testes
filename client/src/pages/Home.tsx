
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Database, BarChart3, Activity, Globe, Cpu, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import RecentAudits from '../components/RecentAudits';
import AgentModal from '../components/AgentModal';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const agents = {
    scout: {
      title: "Scout Hybrid",
      icon: <Globe size={28} />,
      desc: "Rede de agentes que mineram portais oficiais, diários e redes sociais em busca de promessas literais.",
      details: [
        "Monitoramento de Diários Oficiais",
        "Scraping de Redes Sociais",
        "Indexação de Portais de Transparência",
        "Detecção de Falas em Entrevistas"
      ],
      technical: "Engine: Playwright + HuggingFace NER. Latência: < 2s por fonte. Cobertura: Nacional (Federal/Estadual).",
      color: "blue"
    },
    brain: {
      title: "Brain Agent",
      icon: <Cpu size={28} />,
      desc: "Motor de auditoria forense que cruza falas com o SICONFI e APIs da Câmara para detectar incoerências.",
      details: [
        "Correlação Orçamentária",
        "Análise de Consistência Histórica",
        "Cálculo de Probabilidade de Entrega",
        "Detecção de Gap de Radicalismo"
      ],
      technical: "Engine: Gemini 1.5 Flash + DeepSeek R1. Lógica: Inferência Bayesiana para Score de Credibilidade.",
      color: "cyan"
    },
    ironclad: {
      title: "Ironclad Vault",
      icon: <Database size={28} />,
      desc: "Snapshot nacional persistente que garante auditoria mesmo quando portais governamentais estão offline.",
      details: [
        "Cache de Dados Governamentais",
        "Snapshot SICONFI (LOA/PLOA)",
        "Base Histórica do TSE",
        "Resiliência de API (Nível 4)"
      ],
      technical: "Storage: Supabase JSONB + Redis. Sincronização: A cada 6h via GitHub Actions (Scout Worker).",
      color: "indigo"
    }
  };

  const openAgent = (agentKey: keyof typeof agents) => {
    setSelectedAgent(agents[agentKey]);
    setIsModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden relative selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header */}
      <nav className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="text-white" size={22} />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tighter text-white block leading-none">SETH VII</span>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Forensic Intelligence</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
              <button onClick={() => openAgent('brain')} className="hover:text-blue-400 transition-colors uppercase">Metodologia</button>
              <button onClick={() => openAgent('scout')} className="hover:text-blue-400 transition-colors uppercase">Rede de Agentes</button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-2"
              >
                <Activity size={14} className="text-blue-400" /> Global Stats
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.main 
        className="relative z-10 pt-24 pb-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Sistema de Auditoria Ativo • v3.2 Ironclad</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black text-white tracking-tight mb-8 leading-[0.9]">
            A Verdade em <br />
            <span className="text-gradient">Dados Brutos.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            O primeiro motor de inteligência forense que cruza discursos políticos com 
            rastreabilidade financeira, atos oficiais e consistência histórica em tempo real.
          </motion.p>

          <motion.div variants={itemVariants} className="max-w-3xl mx-auto glass rounded-3xl p-3 neon-border mb-10 group transition-all duration-500 hover:shadow-blue-500/10">
            <SearchBar />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>Monitorando agora:</span>
            <button onClick={() => navigate('/analyze/nikolas')} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Nikolas Ferreira
            </button>
            <button onClick={() => navigate('/analyze/lira')} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Arthur Lira
            </button>
            <button onClick={() => navigate('/analyze/erika')} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Erika Hilton
            </button>
          </motion.div>
        </div>
      </motion.main>

      {/* Recent Audits Section */}
      <section className="relative z-10 py-24 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Auditorias Recentes</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Dossiês processados em tempo real pela rede Seth VII</p>
            </div>
            <button 
              onClick={() => navigate('/history')}
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              Ver Histórico Completo <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="glass rounded-[2.5rem] border border-slate-800/50 overflow-hidden">
            <RecentAudits />
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="relative z-10 py-32 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={agents.scout.icon}
              title={agents.scout.title}
              desc={agents.scout.desc}
              color={agents.scout.color}
              onClick={() => openAgent('scout')}
            />
            <FeatureCard 
              icon={agents.brain.icon}
              title={agents.brain.title}
              desc={agents.brain.desc}
              color={agents.brain.color}
              onClick={() => openAgent('brain')}
            />
            <FeatureCard 
              icon={agents.ironclad.icon}
              title={agents.ironclad.title}
              desc={agents.ironclad.desc}
              color={agents.ironclad.color}
              onClick={() => openAgent('ironclad')}
            />
          </div>
        </div>
      </section>

      {/* Agent Modal */}
      <AgentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agent={selectedAgent}
      />

      {/* Footer */}
      <footer className="relative z-10 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-500" size={16} />
            </div>
            <span className="font-bold text-slate-200">SETH VII</span>
            <span className="text-slate-600 text-xs font-bold tracking-widest uppercase">© 2026 Forensic Audit</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Termos</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, onClick }: { icon: React.ReactNode, title: string, desc: string, color: string, onClick: () => void }) {
  const colors: any = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-500/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-500/20",
    indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-500/20"
  };

  return (
    <div className="glass p-10 rounded-[2.5rem] border border-slate-800/50 group hover:border-blue-500/30 transition-all duration-500">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium">
        {desc}
      </p>
      <button 
        onClick={onClick}
        className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:gap-4 transition-all"
      >
        Ver Detalhes <ChevronRight size={14} />
      </button>
    </div>
  );
}
