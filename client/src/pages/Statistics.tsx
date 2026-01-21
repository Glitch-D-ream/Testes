import React from 'react';
import { motion } from 'framer-motion';
import { useStatistics } from '@/hooks/useStatistics';
import { PromiseDistributionChart } from '@/components/PromiseDistributionChart';
import { ComplianceTrendChart } from '@/components/ComplianceTrendChart';

/**
 * Página de Estatísticas e Dashboard
 * Mostra distribuição de promessas, tendências e KPIs
 * Consome dados reais da API
 */
export default function Statistics() {
  const { data, loading, error, refetch } = useStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Erro ao carregar dados</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-background p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Estatísticas</h1>
          <p className="text-muted-foreground">
            Análise completa de promessas políticas e tendências de cumprimento
          </p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: 'Total de Análises',
              value: data.totalAnalyses.toLocaleString('pt-BR'),
              icon: '📊',
            },
            {
              label: 'Total de Promessas',
              value: data.totalPromises.toLocaleString('pt-BR'),
              icon: '🎯',
            },
            {
              label: 'Confiança Média',
              value: `${data.averageConfidence.toFixed(1)}%`,
              icon: '📈',
            },
            {
              label: 'Taxa de Cumprimento',
              value: `${data.complianceRate.toFixed(1)}%`,
              icon: '✅',
            },
          ].map((kpi, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <span className="text-3xl">{kpi.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PromiseDistributionChart data={data.byCategory} />
          <ComplianceTrendChart data={data.trends} />
        </motion.div>

        {/* Detailed Table */}
        <motion.div variants={itemVariants} className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">Detalhamento por Categoria</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Categoria</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Cumpridas</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Pendentes</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Falhadas</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Taxa (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((category, index) => {
                  const rate = ((category.fulfilled / category.count) * 100).toFixed(1);
                  return (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">{category.category}</td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {category.count.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        {category.fulfilled.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-3 px-4 text-amber-600 font-medium">
                        {category.pending.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 font-medium">
                        {category.failed.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-foreground">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
