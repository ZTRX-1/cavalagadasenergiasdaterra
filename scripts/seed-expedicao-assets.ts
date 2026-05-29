/**
 * Seed único: importa para o banco as 8 fotos + legendas que o site público
 * já mostra (curadoria estática em src/lib/expedicao-images.ts).
 *
 * Idempotente: apaga e recria os assets de cada slug.
 *
 * Uso: bun run scripts/seed-expedicao-assets.ts
 * Requer: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "expedicao-midia";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Faltando SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

type Cena = { file: string; titulo: string };
type Plano = { slug: string; folder: string; cenas: Cena[] };

const PLAN: Plano[] = [
  {
    slug: "serra-da-canastra",
    folder: "canastra",
    cenas: [
      { file: "new-01.jpg", titulo: "Serra da Canastra não se visita. Se vive a cavalo." },
      { file: "new-02.jpg", titulo: "Entre cânions, cachoeiras e estradas de terra, a Canastra revela um Brasil raro." },
      { file: "new-03.jpg", titulo: "Dias guiados pelo ritmo do cavalo e pelo silêncio da natureza." },
      { file: "new-04.jpg", titulo: "Alguns lugares não ficam nas fotos. Ficam na gente." },
      { file: "new-05.jpg", titulo: "Almoços ao ar livre, sabores mineiros e pausas que fazem parte da jornada." },
      { file: "new-06.jpg", titulo: "Estranhos no primeiro dia. Manada no último." },
      { file: "new-07.jpg", titulo: "Café mineiro, hospitalidade local e o tempo correndo mais devagar." },
      { file: "new-08.jpg", titulo: "E quando a expedição termina… uma parte sua ainda fica na Canastra." },
    ],
  },
  {
    slug: "patagonia-gaucha",
    folder: "patagonia",
    cenas: [
      { file: "new-01.jpg", titulo: "Na Patagônia, a sensação é de estar cavalgando no fim do mundo. Tudo parece maior, mais intenso e mais selvagem." },
      { file: "new-02.jpg", titulo: "Montanhas nevadas, vento gelado e quilômetros de paisagens que fazem qualquer pessoa parar em silêncio." },
      { file: "new-03.jpg", titulo: "Aqui, o cavalo deixa de ser só companhia. Ele vira parte da conexão com esse lugar absurdo." },
      { file: "new-04.jpg", titulo: "A cada curva da trilha, uma nova paisagem. Lagos, vales, rios e montanhas que parecem cenário de filme." },
      { file: "new-05.jpg", titulo: "Viajar a cavalo pela Patagônia é acessar lugares onde quase ninguém chega da forma certa." },
      { file: "new-06.jpg", titulo: "O frio, o silêncio e a imensidão fazem você esquecer completamente da correria da vida." },
      { file: "new-07.jpg", titulo: "Existem momentos da viagem em que tudo fica em silêncio. Só o som do vento, dos cavalos e da natureza." },
      { file: "new-08.jpg", titulo: "A Patagônia não é um destino comum. É o tipo de experiência que fica com você mesmo depois da volta." },
    ],
  },
  {
    slug: "jericoacoara",
    folder: "jericoacoara",
    cenas: [
      { file: "01.jpg", titulo: "O começo de uma experiência que dificilmente será esquecida." },
      { file: "02.jpg", titulo: "Paisagens que mudam o ritmo da mente e ampliam a sensação de liberdade." },
      { file: "03.jpg", titulo: "O caminho é vivido no ritmo do cavalo, entre silêncio, natureza e presença." },
      { file: "04.jpg", titulo: "Mais do que cavalgar, existe uma conexão que transforma a experiência." },
      { file: "05.jpg", titulo: "Cada expedição revela cenários que não podem ser vividos da mesma forma em outro lugar." },
      { file: "06.jpg", titulo: "Pessoas diferentes, histórias diferentes, conectadas pela mesma experiência." },
      { file: "07.jpg", titulo: "Conforto, curadoria e hospitalidade pensados para fazer parte da jornada." },
      { file: "08.jpg", titulo: "Algumas experiências terminam. Outras permanecem para sempre na memória." },
    ],
  },
  {
    slug: "mantiqueira-refugio",
    folder: "mantiqueira",
    cenas: [
      { file: "new-01.jpg", titulo: "Onde o tempo desacelera e a alma volta a respirar." },
      { file: "new-02.jpg", titulo: "Entre montanhas, cavalos e silêncio, a Mantiqueira revela outro ritmo de vida." },
      { file: "new-03.jpg", titulo: "Mais do que uma cavalgada: uma experiência para sentir a natureza de verdade." },
      { file: "new-04.jpg", titulo: "Caminhos que conectam pessoas, cavalos e paisagens inesquecíveis." },
      { file: "new-05.jpg", titulo: "A liberdade tem som de casco na terra e horizonte sem fim." },
      { file: "new-06.jpg", titulo: "Dias vividos a cavalo, cercados pelas montanhas da Serra da Mantiqueira." },
      { file: "new-07.jpg", titulo: "Existem lugares que não se explicam. Apenas se vivem." },
      { file: "new-08.jpg", titulo: "Uma expedição para quem deseja voltar diferente." },
    ],
  },
  {
    slug: "peru-vale-do-colca",
    folder: "peru",
    cenas: [
      { file: "new-01.jpg", titulo: "Cavalgar entre cânions gigantes no Peru é daquelas experiências que ficam na memória pra sempre." },
      { file: "new-02.jpg", titulo: "Levar nossa bandeira até lugares assim mostra exatamente o que são as viagens da Cavalgadas Energias da Terra." },
      { file: "new-03.jpg", titulo: "Estradas de terra, cavalos, poeira e paisagens que parecem de outro planeta." },
      { file: "new-04.jpg", titulo: "O Peru mistura história, montanhas e cultura de um jeito impossível de explicar em foto." },
      { file: "new-05.jpg", titulo: "Viajar a cavalo permite acessar lugares e paisagens que pouca gente vive de verdade." },
      { file: "new-06.jpg", titulo: "Conhecer as comunidades locais no meio da rota torna tudo ainda mais especial." },
      { file: "new-07.jpg", titulo: "No meio das montanhas, o tempo desacelera. Fica só o cavalo, o caminho e o silêncio." },
      { file: "new-08.jpg", titulo: "O Peru a cavalo não é só uma viagem. É uma experiência que muda a forma de enxergar o mundo." },
    ],
  },
  {
    slug: "canastra-elas-na-sela",
    folder: "elas-na-sela",
    cenas: [
      { file: "new-01.jpg", titulo: "Existem experiências que despertam a força que existe dentro de toda mulher." },
      { file: "new-02.jpg", titulo: "Existem caminhos que fazem mulheres desacelerarem por dentro." },
      { file: "new-03.jpg", titulo: "Entre trilhas, poeira e silêncio, mulheres descobrem novas versões de si mesmas." },
      { file: "new-04.jpg", titulo: "Existe algo no cavalo que faz uma mulher voltar para si mesma." },
      { file: "new-05.jpg", titulo: "Algumas experiências despertam coragem, liberdade e verdade." },
      { file: "new-06.jpg", titulo: "A melhor parte do caminho é encontrar mulheres que vibram na mesma frequência que você." },
      { file: "new-07.jpg", titulo: "Entre montanhas, silêncio e cavalos, muitas mulheres reencontram a própria essência." },
      { file: "new-08.jpg", titulo: "Algumas viagens terminam. Outras permanecem para sempre dentro de uma mulher." },
    ],
  },
  {
    slug: "berco-do-marchador",
    folder: "berco-do-marchador",
    cenas: [
      { file: "01.jpg", titulo: "No berço do Mangalarga Marchador, cada caminho revela a essência de Minas Gerais e a paixão que une cavaleiros e amazonas de todo o Brasil." },
      { file: "02.jpg", titulo: "Fazendas centenárias, paisagens preservadas e histórias que ajudaram a construir a tradição equestre brasileira." },
      { file: "03.jpg", titulo: "Casarões históricos e cenários autênticos mantêm viva a memória de uma das regiões mais emblemáticas do universo do cavalo." },
      { file: "04.jpg", titulo: "Entre campos abertos e horizontes sem pressa, a conexão com a natureza acontece de forma genuína." },
      { file: "05.jpg", titulo: "Cruzília abriga o Museu Nacional do Mangalarga Marchador, um encontro com a história da raça que conquistou o Brasil." },
      { file: "06.jpg", titulo: "Mais do que uma expedição, uma oportunidade de compartilhar momentos, histórias e a paixão pelos cavalos." },
      { file: "07.jpg", titulo: "Patrimônio, hospitalidade e paisagens inesquecíveis se encontram em lugares que parecem ter parado no tempo." },
      { file: "08.jpg", titulo: "Ao final da jornada, fica a certeza de que algumas experiências permanecem conosco muito depois da viagem terminar." },
    ],
  },
  {
    slug: "caminho-de-santiago",
    folder: "santiago",
    cenas: [
      { file: "01.jpg", titulo: "Chegar a Santiago a cavalo é viver uma das jornadas mais marcantes do mundo, unindo história, cultura, espiritualidade e a conexão única entre cavalo e cavaleiro." },
      { file: "02.jpg", titulo: "Ao longo dos séculos, milhões de peregrinos percorreram estes caminhos em busca de propósito, reflexão e transformação." },
      { file: "03.jpg", titulo: "Pequenas aldeias preservam tradições centenárias e revelam a essência autêntica da Galícia." },
      { file: "04.jpg", titulo: "Bosques centenários e caminhos históricos transformam cada dia em uma descoberta." },
      { file: "05.jpg", titulo: "O ritmo da marcha permite apreciar paisagens, aromas e detalhes que passam despercebidos para a maioria dos viajantes." },
      { file: "06.jpg", titulo: "Momentos de silêncio e contemplação fazem parte da magia do Caminho de Santiago." },
      { file: "07.jpg", titulo: "Finisterra, o lendário “Fim do Mundo”, marca o encontro entre a terra, o oceano e a sensação de missão cumprida." },
      { file: "08.jpg", titulo: "Mais do que uma expedição, Santiago deixa memórias, amizades e histórias que acompanham cada participante por toda a vida." },
    ],
  },
];

async function uploadOne(slug: string, folder: string, file: string): Promise<string> {
  const localPath = resolve(process.cwd(), "src/assets/fotos", folder, file);
  const buffer = await readFile(localPath);
  const objectPath = `${slug}/${file}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`upload ${objectPath}: ${error.message}`);
  const { data } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function seedPlano(p: Plano) {
  console.log(`\n→ ${p.slug}`);
  const { data: exp, error: expErr } = await admin
    .from("expedicoes")
    .select("id")
    .eq("slug", p.slug)
    .maybeSingle();
  if (expErr || !exp) {
    console.warn(`  ⚠ expedição não encontrada (${p.slug}) — pulando.`);
    return;
  }
  const expedicaoId = exp.id;

  // limpa assets existentes (idempotente)
  const { error: delErr } = await admin
    .from("expedicao_assets")
    .delete()
    .eq("expedicao_id", expedicaoId);
  if (delErr) throw new Error(`delete assets ${p.slug}: ${delErr.message}`);

  // upload + insert
  const rows: Array<{
    expedicao_id: string;
    tipo: string;
    url: string;
    titulo: string;
    ordem: number;
    is_capa: boolean;
  }> = [];

  for (let i = 0; i < p.cenas.length; i++) {
    const cena = p.cenas[i];
    const url = await uploadOne(p.slug, p.folder, cena.file);
    rows.push({
      expedicao_id: expedicaoId,
      tipo: "imagem",
      url,
      titulo: cena.titulo,
      ordem: i + 1,
      is_capa: i === 0,
    });
    process.stdout.write(`  ✓ ${cena.file}\n`);
  }

  const { error: insErr } = await admin.from("expedicao_assets").insert(rows);
  if (insErr) throw new Error(`insert assets ${p.slug}: ${insErr.message}`);

  // capa_url na própria expedição
  const { error: updErr } = await admin
    .from("expedicoes")
    .update({ capa_url: rows[0].url })
    .eq("id", expedicaoId);
  if (updErr) throw new Error(`update capa ${p.slug}: ${updErr.message}`);

  console.log(`  ✓ ${rows.length} fotos + capa OK`);
}

async function main() {
  for (const p of PLAN) {
    try {
      await seedPlano(p);
    } catch (e) {
      console.error(`✗ ${p.slug}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log("\n✓ Seed concluído.");
}

main();
