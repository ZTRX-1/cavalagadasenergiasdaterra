import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Heart, Shield, Weight } from "lucide-react";

export const Route = createFileRoute("/regras")({
  head: () => ({
    meta: [
      { title: "Regras das Expedições · Cavalgadas Energias da Terra" },
      { name: "description", content: "Regras de segurança, saúde e bem-estar animal para as expedições equestres. Limite de 110 kg, requisitos físicos e conduta em trilha." },
      { property: "og:title", content: "Regras das Expedições · Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Segurança, saúde e bem-estar dos cavalos." },
    ],
  }),
  component: RegrasPage,
});

function RegrasPage() {
  return (
    <div className="bg-background pb-24">
      <section className="bg-carvao text-areia">
        <div className="container-tight pb-14 pt-32 md:pb-20 md:pt-40">
          <div className="eyebrow text-cobre-soft">Segurança · Saúde · Bem-estar</div>
          <h1 className="mt-3 font-display text-4xl md:text-6xl">Regras das Expedições</h1>
          <p className="mt-5 max-w-2xl text-areia/80 ">Cavalgar é uma travessia de confiança entre você, a equipe e, sobretudo, o cavalo. Estas regras existem para preservar a integridade de todos os envolvidos — humanos e animais.</p>
        </div>
      </section>

      <div className="container-tight mt-16 max-w-4xl">
        {/* Destaque: peso máximo */}
        <div className="rounded-sm border-2 border-cobre/60 bg-cobre/5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <Weight className="mt-1 h-8 w-8 shrink-0 text-cobre" />
            <div>
              <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.28em] text-cobre">Regra inegociável</div>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">Peso máximo: 110 kg por cavaleiro</h2>
              <p className="mt-3 text-foreground/85 ">Nossas expedições percorrem trilhas longas, com subidas, descidas e travessias de até 30 km por dia. Acima de <strong>110 kg</strong> o esforço sobre a coluna do cavalo torna-se incompatível com seu bem-estar, podendo causar lesões irreversíveis. Esta regra é absoluta e não comporta exceções, independentemente de condicionamento físico do cavaleiro.</p>
              <p className="mt-2 text-foreground/85 ">Caso o peso seja informado incorretamente na ficha de inscrição e verificado no embarque, a Operadora se reserva o direito de não permitir a participação, sem reembolso.</p>
            </div>
          </div>
        </div>

        <article className="mt-12 space-y-12 text-[0.98rem] leading-relaxed text-foreground/85 ">
          <Block icon={<Heart className="h-6 w-6" />} title="Saúde e condicionamento">
            <ul>
              <li>Idade mínima: 12 anos (menores acompanhados por responsável).</li>
              <li>Idade máxima: 70 anos, mediante avaliação médica recente.</li>
              <li><strong>Contraindicações absolutas:</strong> gestação, problemas cardiovasculares graves, epilepsia não controlada, cirurgias recentes na coluna ou membros inferiores, hérnias de disco em fase aguda, próteses ortopédicas instáveis.</li>
              <li><strong>Contraindicações relativas:</strong> hipertensão não controlada, diabetes descompensada, asma severa — requerem liberação médica e medicação de uso contínuo em mãos.</li>
              <li>Recomendamos preparação física leve nos 30 dias anteriores: caminhadas, fortalecimento de core e pernas.</li>
              <li>Vacinação em dia (incluindo antitetânica).</li>
            </ul>
          </Block>

          <Block icon={<Shield className="h-6 w-6" />} title="Segurança em trilha">
            <ul>
              <li>Uso obrigatório de capacete fornecido pela Operadora durante toda a cavalgada.</li>
              <li>Calça comprida e bota de cano alto (ou perneira) são obrigatórias.</li>
              <li>Mantenha distância mínima de 2 metros entre cavalos.</li>
              <li>Nunca passe à frente do guia sem autorização.</li>
              <li>Proibido fumar, usar fones de ouvido ou manipular celular sobre o cavalo.</li>
              <li>Bebidas alcoólicas são vetadas antes e durante a cavalgada. Consumo moderado apenas após o pernoite.</li>
              <li>Em caso de queda, permaneça imóvel até a chegada da equipe de apoio.</li>
            </ul>
          </Block>

          <Block icon={<Heart className="h-6 w-6" />} title="Bem-estar dos cavalos">
            <ul>
              <li>Os cavalos são Mangalarga Marchador selecionados, descansados e em ciclo de trabalho controlado.</li>
              <li>Não é permitido bater, esporear com força ou puxar bruscamente as rédeas.</li>
              <li>Respeitamos paradas obrigatórias para hidratação e descanso dos animais.</li>
              <li>Em dias de calor extremo ou clima severo, a Operadora pode alterar o roteiro priorizando a saúde dos animais.</li>
              <li>Alimentar os cavalos com alimentos humanos é proibido.</li>
            </ul>
          </Block>

          <Block icon={<AlertTriangle className="h-6 w-6" />} title="Riscos inerentes">
            <p>Cavalgada em ambiente natural é uma atividade de aventura. Mesmo com todos os cuidados, existem riscos inerentes: quedas, mordidas, coices, picadas de insetos, exposição ao sol e à chuva, terreno irregular, animais silvestres. Ao assinar o termo de aceite, o participante reconhece esses riscos e declara participar por livre e espontânea vontade.</p>
            <p>Recomendamos fortemente seguro-viagem com cobertura para esportes de aventura.</p>
          </Block>

          <Block icon={<Shield className="h-6 w-6" />} title="Conduta em grupo">
            <ul>
              <li>Pontualidade nos horários combinados (saída, paradas, refeições).</li>
              <li>Respeito mútuo entre cavaleiros, equipe, anfitriões locais e comunidades visitadas.</li>
              <li>Lixo zero: tudo que entra na trilha sai com você.</li>
              <li>Em propriedades particulares e unidades de conservação, siga rigorosamente as orientações.</li>
              <li>Fotografias de comunidades tradicionais somente com consentimento.</li>
            </ul>
          </Block>

          <Block icon={<AlertTriangle className="h-6 w-6" />} title="Direito de exclusão">
            <p>A Operadora se reserva o direito de afastar da expedição, sem reembolso, qualquer participante que: descumprir estas regras, colocar em risco a si, ao grupo ou aos animais, apresentar conduta incompatível com a atividade ou estiver sob efeito de substâncias.</p>
          </Block>
        </article>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link to="/termos" className="text-cobre hover:underline">Termos de Uso →</Link>
          <Link to="/privacidade" className="text-cobre hover:underline">Política de Privacidade →</Link>
        </div>
      </div>
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 text-cobre">
        {icon}
        <h2 className="font-display text-2xl md:text-3xl text-foreground">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{children}</div>
    </section>
  );
}
