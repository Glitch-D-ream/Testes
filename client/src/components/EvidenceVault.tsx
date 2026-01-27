
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Link, Database, ExternalLink, X, Eye, FileSearch, ShieldCheck } from 'lucide-react';

interface EvidenceVaultProps {
  sources: any;
}

export default function EvidenceVault({ sources }: EvidenceVaultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const getEvidenceList = () => {
    const list = [
      { type: 'API', name: 'Câmara dos Deputados', status: sources?.projects?.length > 0 ? 'Sincronizado' : 'Consulta Direta', icon: <Database size={16} /> },
      { type: 'API', name: 'SICONFI (Tesouro Nacional)', status: sources?.budgetVerdict ? 'Auditado' : 'Base Regional', icon: <ShieldCheck size={16} /> },
      { type: 'WEB', name: 'Google News / RSS', status: 'Monitorado', icon: <Link size={16} /> },
    ];

    if (sources?.absenceReport) {
      list.push({ type: 'DOC', name: 'Portal da Transparência', status: 'Extraído', icon: <FileText size={16} /> });
    }

    return list;
  };

  const evidenceList = getEvidenceList();

  return (
    <div className="mt-8">
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-6 py-4 glass rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all group"
      >
        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
          <FileSearch size={18} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cofre de Evidências</p>
          <p className="text-xs font-bold text-slate-200">Ver Fontes e Documentos Brutos</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[80vh] glass rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Evidence Vault</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rastreabilidade Forense v2.6</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar: Source List */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fontes Consultadas</h4>
                  {evidenceList.map((item, i) => (
                    <div 
                      key={i}
                      className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-blue-500">{item.icon}</div>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{item.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.type}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full" /> {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main: Data Preview */}
                <div className="md:col-span-2 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Dados Brutos & Documentos</h4>
                  
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 space-y-4">
                    {sources?.projects?.slice(0, 2).map((p: any, i: number) => (
                      <a href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`} target="_blank" rel="noopener noreferrer" key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="text-blue-500" size={20} />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{p.siglaTipo} {p.numero}/{p.ano}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black">PROJETO DE LEI • CÂMARA DOS DEPUTADOS</p>
                          </div>
                        </div>
                        <ExternalLink size={18} className="text-slate-500"/>
                      </a>
                    ))}

                    {sources?.absenceReport?.pdfLink && (
                       <a href={sources.absenceReport.pdfLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="text-red-500" size={20} />
                          <div>
                            <p className="text-xs font-bold text-slate-200">Relatório de Faltas</p>
                            <p className="text-[9px] text-slate-500 uppercase font-black">PDF • PORTAL DA TRANSPARÊNCIA</p>
                          </div>
                        </div>
                        <ExternalLink size={18} className="text-slate-500"/>
                      </a>
                    )}
                  </div>

                  <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Nota de Integridade</h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Todos os documentos acima foram capturados e processados pelo motor **Ironclad v2.6**. A integridade dos arquivos é verificada via hash SHA-256 para garantir que não houve alteração após a coleta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-4 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocolo de Segurança Seth-7-SEC</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Fechar Cofre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
