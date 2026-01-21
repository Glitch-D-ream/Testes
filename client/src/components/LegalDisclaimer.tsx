import React from 'react';

export default function LegalDisclaimer() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            Aviso Legal Importante
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              <strong>Análise Probabilística:</strong> Este sistema fornece uma análise probabilística baseada em dados históricos, orçamentários e padrões linguísticos. Não constitui acusação de má fé, enganação ou qualquer juízo de valor sobre o autor.
            </p>
            <p>
              <strong>Transparência Metodológica:</strong> Todos os critérios, fontes de dados e cálculos utilizados são públicos e auditáveis. Consulte a seção "Metodologia" para detalhes completos.
            </p>
            <p>
              <strong>Direito de Resposta:</strong> Qualquer pessoa mencionada tem direito a solicitar revisão, correção ou contestação de uma análise. Entre em contato para exercer este direito.
            </p>
            <p>
              <strong>Sem Responsabilidade Jurídica:</strong> Este sistema é fornecido como ferramenta de análise informativa. Não se responsabiliza por decisões tomadas com base em seus resultados.
            </p>
            <p>
              <strong>Independência:</strong> Este sistema é completamente independente e não possui afiliações políticas, comerciais ou de qualquer outra natureza.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
