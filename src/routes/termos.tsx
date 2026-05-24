import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · Cavalgadas Energias da Terra" },
      { name: "description", content: "Condições de uso do site, reservas, pagamentos e cancelamentos das expedições Cavalgadas Energias da Terra." },
      { property: "og:title", content: "Termos de Uso · Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Condições de contratação das expedições equestres." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="bg-background pb-24">
      <section className="bg-carvao text-areia">
        <div className="container-tight pb-14 pt-32 md:pb-20 md:pt-40">
          <div className="eyebrow text-cobre-soft">Documento legal</div>
          <h1 className="mt-3 font-display text-4xl md:text-6xl">Termos e Condições de Uso</h1>
          <p className="mt-5 max-w-2xl text-areia/80">Última atualização: maio de 2026. Ao realizar uma pré-reserva ou contratar uma expedição, você declara ter lido, compreendido e aceito integralmente estes termos.</p>
        </div>
      </section>

      <article className="container-tight mt-16 max-w-3xl text-[0.98rem] leading-relaxed text-foreground/85">
        <div className="mb-10 rounded-sm border-l-2 border-cobre bg-cobre/5 px-5 py-4 text-sm text-foreground/75">
          Documento em revisão jurídica final. O texto abaixo reflete a prática contratual atual e
          será substituído pela versão definitiva em breve.
        </div>

        <Section n="01" title="Da contratante">
          <p>Cavalgadas Energias da Terra · CNPJ 60.252.479/0001-85, doravante denominada "Operadora", oferece expedições equestres boutique no Brasil e no exterior.</p>
        </Section>

        <Section n="02" title="Pré-reserva e confirmação">
          <p>A pré-reserva realizada pelo site é uma manifestação de interesse e <strong>não garante vaga</strong> até a confirmação formal por nossa equipe, mediante pagamento do sinal (mínimo 30%) ou valor integral.</p>
          <p>A vaga é considerada confirmada após: (i) recebimento do pagamento; (ii) envio do contrato assinado; (iii) preenchimento da ficha médica e termo de responsabilidade.</p>
        </Section>

        <Section n="03" title="Pagamento">
          <ul>
            <li><strong>PIX à vista:</strong> sem acréscimo, possibilidade de desconto.</li>
            <li><strong>Sinal + Saldo:</strong> 30% como sinal, saldo até 30 dias antes do embarque.</li>
            <li><strong>Cartão em 6×:</strong> acréscimo aproximado de 5,99% incluso.</li>
            <li>Valores em moeda estrangeira são convertidos pelo câmbio vigente na data do pagamento.</li>
          </ul>
        </Section>

        <Section n="04" title="Cancelamento e remarcação" highlight>
          <ul>
            <li><strong>Acima de 60 dias do embarque:</strong> reembolso de 90% do valor pago.</li>
            <li><strong>Entre 30 e 60 dias:</strong> reembolso de 50% ou crédito integral para outra data dentro de 12 meses.</li>
            <li><strong>Menos de 30 dias:</strong> sem reembolso, mas possibilidade de transferência da vaga para terceiro mediante aprovação.</li>
            <li>Cancelamentos pela Operadora (clima extremo, força maior, sanidade animal) geram reembolso integral ou reagendamento sem custo.</li>
          </ul>
        </Section>

        <Section n="05" title="Responsabilidade do cavaleiro" highlight>
          <p>O participante declara: (i) estar em boas condições de saúde para a atividade; (ii) ter informado verdadeiramente peso, idade e nível de experiência; (iii) respeitar o limite de <strong>110 kg por cavaleiro</strong>, estabelecido para preservar o bem-estar dos cavalos; (iv) seguir as orientações de guias e instrutores; (v) responder por danos causados intencionalmente a equipamentos, animais ou terceiros.</p>
        </Section>

        <Section n="06" title="Limitação de responsabilidade">
          <p>A Operadora adota todas as medidas de segurança razoáveis, porém atividades equestres em ambiente natural envolvem riscos inerentes. A Operadora não responde por: condições climáticas, comportamento imprevisível dos animais, condutas individuais que contrariem as orientações, perda ou dano a objetos pessoais, custos médicos não cobertos pelo seguro contratado.</p>
          <p>Recomendamos fortemente a contratação de seguro-viagem e/ou de aventura.</p>
        </Section>

        <Section n="07" title="Propriedade intelectual">
          <p>Todo o conteúdo do site (textos, fotos, vídeos, identidade visual) é de propriedade da Cavalgadas Energias da Terra. Reprodução não autorizada é proibida. Imagens captadas durante a expedição podem ser utilizadas para fins promocionais; caso não autorize, comunique por escrito antes do embarque.</p>
        </Section>

        <Section n="08" title="Foro">
          <p>Fica eleito o foro da Comarca de Belo Horizonte/MG para dirimir quaisquer controvérsias, renunciando-se a qualquer outro, por mais privilegiado que seja.</p>
        </Section>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link to="/privacidade" className="text-cobre hover:underline">Política de Privacidade →</Link>
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
