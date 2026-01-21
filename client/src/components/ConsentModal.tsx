import React, { useState } from 'react';

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

/**
 * Modal de consentimento LGPD
 * Exibe informações sobre processamento de dados e coleta de consentimento
 */
export function ConsentModal({ onAccept, onDecline, isOpen }: ConsentModalProps) {
  const [dataProcessing, setDataProcessing] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);

  if (!isOpen) return null;

  const canAccept = dataProcessing && privacyPolicy;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h2 className="text-2xl font-bold">Política de Privacidade e Consentimento</h2>
          <p className="text-blue-100 mt-2">Detector de Promessa Vazia</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seção de Processamento de Dados */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Processamento de Dados Pessoais
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Nós processamos seus dados pessoais para fornecer o serviço de análise de promessas
              políticas. Isso inclui:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
              <li>Email e nome para autenticação</li>
              <li>Histórico de análises realizadas</li>
              <li>Endereço IP e informações de navegador para segurança</li>
              <li>Logs de atividades para auditoria</li>
            </ul>
            <p className="text-gray-700 mt-4 leading-relaxed">
              Seus dados são armazenados de forma segura e nunca serão compartilhados com terceiros
              sem seu consentimento explícito.
            </p>

            {/* Checkbox */}
            <div className="mt-4 flex items-start">
              <input
                type="checkbox"
                id="dataProcessing"
                checked={dataProcessing}
                onChange={(e) => setDataProcessing(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 cursor-pointer"
              />
              <label htmlFor="dataProcessing" className="ml-3 text-gray-700 cursor-pointer">
                <span className="font-medium">Consinto com o processamento de meus dados pessoais</span>
                <p className="text-sm text-gray-600 mt-1">
                  Você pode revogar este consentimento a qualquer momento
                </p>
              </label>
            </div>
          </section>

          {/* Seção de Política de Privacidade */}
          <section className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Política de Privacidade
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Leia nossa política de privacidade completa para entender como seus dados são
              protegidos:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Principais Pontos:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Retenção de Dados:</strong> Seus dados são retidos enquanto sua conta
                  estiver ativa
                </li>
                <li>
                  <strong>Direito ao Esquecimento:</strong> Você pode solicitar a exclusão de seus
                  dados a qualquer momento
                </li>
                <li>
                  <strong>Portabilidade:</strong> Você pode exportar todos os seus dados em formato
                  JSON
                </li>
                <li>
                  <strong>Segurança:</strong> Usamos criptografia e protocolos de segurança modernos
                </li>
                <li>
                  <strong>Conformidade:</strong> Estamos em conformidade com a LGPD (Lei Geral de
                  Proteção de Dados)
                </li>
              </ul>
            </div>

            {/* Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="privacyPolicy"
                checked={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 cursor-pointer"
              />
              <label htmlFor="privacyPolicy" className="ml-3 text-gray-700 cursor-pointer">
                <span className="font-medium">
                  Aceito a Política de Privacidade e os Termos de Serviço
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Ler política completa
                  </a>
                </p>
              </label>
            </div>
          </section>

          {/* Seção de Direitos */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">Seus Direitos LGPD:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Direito de acesso aos seus dados</li>
              <li>✓ Direito de correção de dados imprecisos</li>
              <li>✓ Direito ao esquecimento (exclusão)</li>
              <li>✓ Direito de portabilidade de dados</li>
              <li>✓ Direito de revogar consentimento</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Recusar
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              canAccept
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Aceitar e Continuar
          </button>
        </div>

        {/* Aviso se não marcou */}
        {(!dataProcessing || !privacyPolicy) && (
          <div className="bg-yellow-50 px-6 py-3 border-t border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ Você precisa aceitar ambos os termos para continuar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsentModal;
