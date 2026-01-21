import React from 'react';

/**
 * Página de Política de Privacidade
 * Explica como os dados são coletados, processados e protegidos
 */
export function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-blue-100">Detector de Promessa Vazia</p>
          <p className="text-blue-100 text-sm mt-4">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introdução */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
          <p className="text-gray-700 leading-relaxed">
            O Detector de Promessa Vazia ("nós", "nosso" ou "aplicação") está comprometido em
            proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos,
            divulgamos e protegemos suas informações quando você usa nossa aplicação web.
          </p>
        </section>

        {/* Informações Coletadas */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Informações de Registro</h3>
              <p className="text-gray-700">
                Quando você se registra, coletamos: email, nome, e senha (criptografada). Essas
                informações são necessárias para criar e manter sua conta.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2.2 Dados de Análise</h3>
              <p className="text-gray-700">
                Quando você submete um texto para análise, armazenamos: o texto original, autor
                (se fornecido), categoria, e os resultados da análise (promessas extraídas e
                probabilidade de cumprimento).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2.3 Dados de Navegação</h3>
              <p className="text-gray-700">
                Coletamos automaticamente: endereço IP, tipo de navegador, sistema operacional,
                páginas visitadas, e hora das requisições. Isso é usado para segurança, análise de
                uso, e melhorias do serviço.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2.4 Cookies</h3>
              <p className="text-gray-700">
                Usamos cookies para: autenticação (JWT), preferências de sessão, e proteção CSRF.
                Você pode controlar cookies nas configurações do seu navegador.
              </p>
            </div>
          </div>
        </section>

        {/* Como Usamos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Fornecer, manter e melhorar o serviço</li>
            <li>✓ Processar análises de promessas</li>
            <li>✓ Autenticar sua identidade</li>
            <li>✓ Enviar notificações e atualizações</li>
            <li>✓ Detectar e prevenir fraudes e abuso</li>
            <li>✓ Cumprir obrigações legais</li>
            <li>✓ Análise de uso e estatísticas (anonimizadas)</li>
          </ul>
        </section>

        {/* Segurança */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Segurança de Dados</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Implementamos medidas de segurança técnicas, administrativas e físicas para proteger
            seus dados:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li>• Criptografia SSL/TLS para transmissão de dados</li>
            <li>• Hashing bcrypt para senhas</li>
            <li>• Autenticação JWT com tokens seguros</li>
            <li>• Rate limiting para prevenir abuso</li>
            <li>• Logging de auditoria de todas as ações</li>
            <li>• Acesso restrito a dados sensíveis</li>
            <li>• Backups regulares</li>
          </ul>
        </section>

        {/* Retenção de Dados */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retenção de Dados</h2>
          <p className="text-gray-700 leading-relaxed">
            Mantemos seus dados enquanto sua conta estiver ativa. Se você solicitar exclusão ou
            não usar a aplicação por 12 meses consecutivos, podemos deletar seus dados. Logs de
            auditoria são mantidos por 90 dias para fins de segurança.
          </p>
        </section>

        {/* Direitos LGPD */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos LGPD</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
          </p>
          <div className="space-y-3 ml-4">
            <div>
              <h4 className="font-semibold text-gray-800">6.1 Direito de Acesso</h4>
              <p className="text-gray-700">
                Você pode solicitar acesso a todos os seus dados pessoais armazenados
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">6.2 Direito de Correção</h4>
              <p className="text-gray-700">
                Você pode corrigir dados imprecisos ou incompletos
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">6.3 Direito ao Esquecimento</h4>
              <p className="text-gray-700">
                Você pode solicitar a exclusão de seus dados pessoais (DELETE /api/user/data)
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">6.4 Direito de Portabilidade</h4>
              <p className="text-gray-700">
                Você pode exportar todos os seus dados em formato JSON (GET /api/user/data/export)
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">6.5 Direito de Revogação</h4>
              <p className="text-gray-700">
                Você pode revogar seu consentimento para processamento de dados a qualquer momento
              </p>
            </div>
          </div>
        </section>

        {/* Compartilhamento de Dados */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Compartilhamento de Dados</h2>
          <p className="text-gray-700 leading-relaxed">
            Não compartilhamos seus dados pessoais com terceiros, exceto:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4 mt-3">
            <li>• Quando legalmente obrigado (ordem judicial)</li>
            <li>• Para proteger direitos, privacidade ou segurança</li>
            <li>• Com seu consentimento explícito</li>
          </ul>
        </section>

        {/* Dados Públicos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dados Públicos Utilizados</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Para análises, utilizamos dados públicos de fontes oficiais:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li>• SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público)</li>
            <li>• Portal da Transparência (Governo Federal)</li>
            <li>• TSE (Tribunal Superior Eleitoral)</li>
            <li>• Dados legislativos públicos</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Esses dados são armazenados em cache local para melhor performance e não são
            compartilhados com terceiros.
          </p>
        </section>

        {/* Contato */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contato</h2>
          <p className="text-gray-700 leading-relaxed">
            Se você tem dúvidas sobre esta Política de Privacidade ou deseja exercer seus direitos
            LGPD, entre em contato conosco:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mt-4">
            <p className="text-gray-700">
              <strong>Email:</strong> privacy@detectorpromessavazia.com
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Endereço:</strong> [Seu endereço aqui]
            </p>
          </div>
        </section>

        {/* Alterações */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Alterações nesta Política</h2>
          <p className="text-gray-700 leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você de
            mudanças significativas via email ou através de um aviso destacado na aplicação.
          </p>
        </section>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise Probabilística</h3>
          <p className="text-gray-700">
            O Detector de Promessa Vazia fornece análises probabilísticas baseadas em padrões
            linguísticos e dados históricos. Essas análises não constituem acusações de má fé ou
            desonestidade. São ferramentas de transparência para ajudar cidadãos a avaliar
            promessas políticas de forma informada.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
