import React from 'react';

interface TermsOfServiceProps {
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Termos de Uso</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
              <h3 className="text-2xl font-black text-slate-900 mb-4">1. Aceitação dos Termos</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Ao acessar e usar a plataforma Imagenius, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">2. Descrição do Serviço</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                O Imagenius é uma plataforma que permite aos usuários gerar imagens usando inteligência artificial. Nossos serviços incluem:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Geração de imagens baseadas em prompts e referências visuais</li>
                <li>Armazenamento de artes geradas pelo usuário</li>
                <li>Galeria comunitária para compartilhamento de artes</li>
                <li>Sistema de créditos para acesso aos serviços</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">3. Conta do Usuário</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Para usar nossos serviços, você precisa criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades que ocorrem sob sua conta</li>
                <li>Fornecer informações precisas e atualizadas</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">4. Uso Aceitável</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Você concorda em NÃO usar nossos serviços para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Criar conteúdo ilegal, difamatório, ofensivo ou prejudicial</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Gerar conteúdo que promova discriminação, ódio ou violência</li>
                <li>Tentar acessar áreas restritas ou comprometer a segurança do sistema</li>
                <li>Usar bots ou scripts automatizados para gerar imagens em massa</li>
                <li>Revender ou redistribuir nossos serviços sem autorização</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">5. Propriedade Intelectual</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Suas Artes:</strong> Você mantém todos os direitos sobre as imagens que gera usando nossa plataforma. Você pode usar, modificar e distribuir suas próprias criações como desejar.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Nossa Plataforma:</strong> Todo o conteúdo da plataforma, incluindo design, código, logotipos e marcas, é propriedade do Imagenius e protegido por leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">6. Créditos e Pagamentos</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Nossos serviços operam com um sistema de créditos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Créditos são consumidos ao gerar imagens</li>
                <li>Créditos comprados são não reembolsáveis, exceto conforme exigido por lei</li>
                <li>Reservamo-nos o direito de ajustar preços e políticas de créditos</li>
                <li>Créditos não utilizados não expiram, mas podem estar sujeitos a políticas futuras</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">7. Compartilhamento na Comunidade</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Ao compartilhar suas artes na galeria comunitária, você concede ao Imagenius e a outros usuários o direito de visualizar, curtir e comentar suas criações dentro da plataforma. Você pode remover suas artes compartilhadas a qualquer momento.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">8. Limitação de Responsabilidade</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                O Imagenius é fornecido "como está", sem garantias de qualquer tipo. Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. Não seremos responsáveis por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso de nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">9. Modificações do Serviço</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto dos serviços a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por qualquer modificação, suspensão ou descontinuação.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">10. Rescisão</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, se você violar estes Termos de Uso. Você também pode excluir sua conta a qualquer momento através das configurações do perfil.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">11. Lei Aplicável</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">12. Alterações nos Termos</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Podemos atualizar estes Termos de Uso periodicamente. Notificaremos você sobre mudanças significativas. O uso continuado dos serviços após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4">13. Contato</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do e-mail de suporte da plataforma.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

