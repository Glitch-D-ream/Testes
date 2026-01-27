
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  desc: string;
  variants?: any;
}

export default function StatCard({ title, value, icon, desc, variants }: StatCardProps) {
  return (
    <motion.div 
      className="glass rounded-[2rem] p-8 border border-slate-800/50 group hover:border-blue-500/30 transition-all duration-500"
      variants={variants}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{title}</h4>
      <div className="text-4xl font-black text-white mb-3 tracking-tighter">{value}</div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
    </motion.div>
  );
}
