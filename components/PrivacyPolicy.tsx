import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-3xl font-black text-slate-900">Política de Privacidade</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          <div className="prose prose-slate max-w-none space-y-6">
            <div>
              <p className="text-sm text-slate-500 mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">1. Informações que Coletamos</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Coletamos informações que você nos fornece diretamente, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Endereço de e-mail para criação e gerenciamento da conta</li>
                <li>Senha (criptografada e armazenada de forma segura)</li>
                <li>Informações de perfil (nome, foto de perfil) quando fornecidas</li>
                <li>Histórico de transações e compras</li>
                <li>Artes e imagens geradas por você</li>
                <li>Preferências de uso da plataforma</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">2. Como Usamos suas Informações</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Fornecer, manter e melhorar nossos serviços</li>
                <li>Processar transações e gerenciar sua conta</li>
                <li>Enviar notificações sobre sua conta e serviços</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Detectar e prevenir fraudes e abusos</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">3. Compartilhamento de Informações</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Com prestadores de serviços que nos ajudam a operar a plataforma (processamento de pagamentos, hospedagem)</li>
                <li>Quando você opta por compartilhar suas artes publicamente na galeria comunitária</li>
                <li>Para cumprir obrigações legais ou responder a solicitações governamentais</li>
                <li>Para proteger nossos direitos, privacidade, segurança ou propriedade</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">4. Seus Direitos (LGPD)</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> Solicitar remoção de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Solicitar portabilidade dos seus dados</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com seu consentimento</li>
                <li><strong>Revogação de consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">5. Segurança dos Dados</h3>
              <p className="text-slate-700 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia, controles de acesso e monitoramento regular de nossos sistemas.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">6. Retenção de Dados</h3>
              <p className="text-slate-700 leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">7. Cookies e Tecnologias Similares</h3>
              <p className="text-slate-700 leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">8. Alterações nesta Política</h3>
              <p className="text-slate-700 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página e atualizando a data de "Última atualização".
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">9. Contato</h3>
              <p className="text-slate-700 leading-relaxed">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre em contato conosco através do e-mail de suporte da plataforma.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

