import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · Cavalgadas Energias da Terra" },
      { name: "description", content: "Como coletamos, usamos e protegemos seus dados na Cavalgadas Energias da Terra. Conformidade com a LGPD." },
      { property: "og:title", content: "Política de Privacidade · Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Tratamento de dados pessoais conforme a LGPD." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="bg-background pb-24">
      <section className="bg-carvao text-areia">
        <div className="container-tight pb-14 pt-32 md:pb-20 md:pt-40">
          <div className="eyebrow text-cobre-soft">Documento legal</div>
          <h1 className="mt-3 font-display text-4xl md:text-6xl">Política de Privacidade</h1>
          <p className="mt-5 max-w-2xl text-areia/80">Última atualização: maio de 2026. Esta política descreve como a Cavalgadas Energias da Terra trata seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
        </div>
      </section>

      <article className="container-tight mt-16 max-w-3xl text-[0.98rem] leading-relaxed text-foreground/85">
        <div className="mb-10 rounded-sm border-l-2 border-cobre bg-cobre/5 px-5 py-4 text-sm text-foreground/75">
          Documento em revisão jurídica final. O texto reflete a prática atual de tratamento de
          dados e será substituído pela versão definitiva em breve.
        </div>

        <Section n="01" title="Quem somos">
          <p>Cavalgadas Energias da Terra · CNPJ 60.252.479/0001-85 · sediada em Minas Gerais, Brasil. Operadora de expedições equestres boutique no Brasil e no exterior, sob as marcas Cavalgadas Energias da Terra, Canastra a Cavalo e Elas na Sela.</p>
          <p><strong>Encarregado de Dados (DPO):</strong> contato@cavalgadasenergiasdaterra.com.br</p>
        </Section>

        <Section n="02" title="Dados que coletamos">
          <ul>
            <li><strong>Cadastrais:</strong> nome completo, CPF, data de nascimento, telefone, e-mail, cidade e estado.</li>
            <li><strong>Operacionais da expedição:</strong> peso, idade, nível de experiência com cavalgada, restrições alimentares, condições de saúde relevantes para a segurança da atividade.</li>
            <li><strong>Pagamento:</strong> forma de pagamento escolhida. Dados de cartão são processados diretamente pela operadora financeira; não armazenamos números de cartão.</li>
            <li><strong>Navegação:</strong> cookies essenciais, idioma preferido, dados anonimizados de uso do site.</li>
          </ul>
        </Section>

        <Section n="03" title="Finalidade do tratamento">
          <ul>
            <li>Confirmar identidade e organizar a logística da expedição contratada;</li>
            <li>Garantir segurança e bem-estar do cavaleiro e do animal (peso, saúde, experiência);</li>
            <li>Emitir documentos fiscais e cumprir obrigações legais;</li>
            <li>Comunicação sobre datas, alterações, materiais de embarque;</li>
            <li>Atendimento pós-expedição e melhoria contínua dos roteiros.</li>
          </ul>
        </Section>

        <Section n="04" title="Bases legais">
          <p>Tratamos seus dados com base em: (i) execução de contrato; (ii) cumprimento de obrigação legal; (iii) consentimento, quando aplicável; e (iv) legítimo interesse para garantir a segurança das atividades.</p>
        </Section>

        <Section n="05" title="Compartilhamento">
          <p>Compartilhamos dados apenas com prestadores diretamente envolvidos na operação: pousadas, guias locais, transportadoras, operadoras de pagamento e órgãos públicos quando exigido por lei. Não vendemos dados a terceiros.</p>
        </Section>

        <Section n="06" title="Retenção">
          <p>Mantemos seus dados pelo tempo necessário ao cumprimento das finalidades acima e às obrigações legais (fiscais, civis e regulatórias). Após esse período, os dados são anonimizados ou eliminados.</p>
        </Section>

        <Section n="07" title="Seus direitos (LGPD)" highlight>
          <p>Você pode, a qualquer momento, solicitar: confirmação da existência de tratamento, acesso, correção, anonimização, portabilidade, eliminação, revogação de consentimento e informação sobre compartilhamentos. Envie a solicitação para <a href="mailto:contato@cavalgadasenergiasdaterra.com.br" className="text-cobre underline">contato@cavalgadasenergiasdaterra.com.br</a>.</p>
        </Section>

        <Section n="08" title="Segurança">
          <p>Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados: criptografia em trânsito (HTTPS), controle de acesso, backups e ambiente em nuvem com padrões internacionais de segurança.</p>
        </Section>

        <Section n="09" title="Cookies">
          <p>Utilizamos cookies essenciais para o funcionamento do site (idioma, sessão) e cookies analíticos anônimos. Você pode bloqueá-los nas configurações do navegador.</p>
        </Section>

        <Section n="10" title="Alterações">
          <p>Esta política pode ser atualizada. A versão vigente será sempre a publicada nesta página, com a data da última revisão.</p>
        </Section>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link to="/termos" className="text-cobre hover:underline">Termos de Uso →</Link>
          <Link to="/regras" className="text-cobre hover:underline">Regras das Expedições →</Link>
        </div>
      </article>
    </div>
  );
}

function Section({ n, title, children, highlight }: { n: string; title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={"mt-12 " + (highlight ? "border-l-2 border-cobre pl-6" : "")}>
      <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">{n}</div>
      <h2 className="mt-2 font-display text-2xl md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{children}</div>
    </section>
  );
}
