/**
 * Camada pública de leitura de expedições.
 * Lê do banco (tabela `expedicoes` + `datas`) e cai para o arquivo estático
 * em caso de falha (offline / build sem DB).
 */
import { supabase } from "@/integrations/supabase/client";
import {
  type DataExpedicao,
  type Expedicao,
  listExpedicoes as listExpedicoesStatic,
  listProximasDatas as listProximasDatasStatic,
  getExpedicaoBySlug as getExpedicaoBySlugStatic,
} from "@/lib/expedicoes-static";
import { getCanonicalExpedicaoSlug } from "@/lib/expedicao-slugs";

export type { DataExpedicao };

export interface Expedicao {
  id: string;
  slug: string;
  nome: string;
  descricao_curta: string;
  descricao_longa: string;
  duracao: string;
  nivel: string;
  preco: number;
  moeda: string;
  mensagem_comercial_publica: string | null;
  como_chegar_distancias: string | null;
  marca: string;
  pais: string;
  regiao: string | null;
  imagem_url: string | null;
  galeria: string[];
  inclui: string[];
  requisitos: string[];
  roteiro: { dia: string; titulo: string; desc: string }[];
  como_chegar_titulo: string | null;
  como_chegar_conteudo: string | null;
  como_chegar_aeroporto: string | null;
  como_chegar_referencia: string | null;
  como_chegar_observacoes: string | null;
  observacoes: string | null;
  ativo?: boolean; // Novo campo para controlar exposição do preço
}

export interface ExpedicaoAssetLite {
  url: string;
  tipo: string;
  titulo: string | null;
  ordem: number;
  is_capa: boolean;
}

function normalizeExpedicao(row: Record<string, unknown>): Expedicao {
  return {
    id: row.id as string,
    slug: row.slug as string,
    nome: row.nome as string,
    descricao_curta: (row.descricao_curta as string) ?? "",
    descricao_longa: (row.descricao_longa as string) ?? "",
    duracao: (row.duracao as string) ?? "",
    nivel: (row.nivel as string) ?? "",
    preco: Number(row.preco ?? 0),
    moeda: (row.moeda as string) ?? "BRL",
    mensagem_comercial_publica: (row.mensagem_comercial_publica as string | null) ?? null,
    como_chegar_distancias: (row.como_chegar_distancias as string | null) ?? null,
    marca: (row.marca as string) ?? "cavalgadas",
    pais: (row.pais as string) ?? "brasil",
    regiao: ((row.regiao as string) || (row.cidade as string) || (row.estado as string)) ?? null,
    imagem_url: (row.imagem_url as string) ?? (row.capa_url as string) ?? null,
    galeria: Array.isArray(row.galeria) ? (row.galeria as string[]) : [],
    inclui: Array.isArray(row.inclui) ? (row.inclui as string[]) : [],
    requisitos: Array.isArray(row.requisitos) ? (row.requisitos as string[]) : [],
    roteiro: Array.isArray(row.roteiro)
      ? (row.roteiro as { dia: string; titulo: string; desc: string }[])
      : [],
    como_chegar_titulo: (row.como_chegar_titulo as string | null) ?? null,
    como_chegar_conteudo: (row.como_chegar_conteudo as string | null) ?? null,
    como_chegar_aeroporto: (row.como_chegar_aeroporto as string | null) ?? null,
    como_chegar_referencia: (row.como_chegar_referencia as string | null) ?? null,
    como_chegar_observacoes: (row.como_chegar_observacoes as string | null) ?? null,
    observacoes: (row.observacoes as string | null) ?? null,
    ativo: (row.ativo as boolean) ?? false,
  };
}


function normalizeData(row: Record<string, unknown>, exp?: { nome: string; slug: string; moeda?: string }): DataExpedicao {
  return {
    id: row.id as string,
    expedicao_id: row.expedicao_id as string,
    expedicao_nome: exp?.nome,
    expedicao_slug: exp?.slug,
    data_inicio: row.data_inicio as string,
    data_fim: row.data_fim as string,
    vagas_total: Number(row.vagas_total ?? 0),
    vagas_disponiveis: Number(row.vagas_disponiveis ?? 0),
    status: (row.status as string) ?? "disponivel",
    preco_pix: row.preco_pix == null ? null : Number(row.preco_pix),
    preco_cartao: row.preco_cartao == null ? null : Number(row.preco_cartao),
    tag: (row.tag as string) ?? undefined,
    moeda: exp?.moeda ?? "BRL",
  };
}

export async function listExpedicoes(): Promise<Expedicao[]> {
  try {
    const { data, error } = await supabase
      .from("expedicoes")
      .select("*")
      .eq("status", "publicado")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return listExpedicoesStatic();
    return data.map((row) => normalizeExpedicao(row as Record<string, unknown>));
  } catch {
    return listExpedicoesStatic();
  }
}

export async function getExpedicaoBySlug(
  input: { data: { slug: string } },
): Promise<{ expedicao: Expedicao; datas: DataExpedicao[]; assets: ExpedicaoAssetLite[]; capa_url: string | null } | null> {
  const canonicalSlug = getCanonicalExpedicaoSlug(input.data.slug);
  try {
    const { data: exp, error } = await supabase
      .from("expedicoes")
      .select("*")
      .eq("slug", canonicalSlug)
      .eq("status", "publicado")
      .maybeSingle();
    if (error) throw error;
    if (!exp) {
      const fallback = await getExpedicaoBySlugStatic(input);
      return fallback ? { ...fallback, assets: [], capa_url: null } : null;
    }
    const norm = normalizeExpedicao(exp as Record<string, unknown>);
    const [datasRes, assetsRes] = await Promise.all([
      supabase.from("datas").select("*").eq("expedicao_id", norm.id).order("data_inicio", { ascending: true }),
      supabase
        .from("expedicao_assets")
        .select("url, tipo, titulo, ordem, is_capa")
        .eq("expedicao_id", norm.id)
        .order("ordem", { ascending: true }),
    ]);
    return {
      expedicao: norm,
      datas: (datasRes.data ?? []).map((d) =>
        normalizeData(d as Record<string, unknown>, { nome: norm.nome, slug: norm.slug, moeda: norm.moeda }),
      ),
      assets: (assetsRes.data ?? []) as ExpedicaoAssetLite[],
      capa_url: ((exp as Record<string, unknown>).capa_url as string | null) ?? null,
    };
  } catch {
    const fallback = await getExpedicaoBySlugStatic(input);
    return fallback ? { ...fallback, assets: [], capa_url: null } : null;
  }
}

export async function listProximasDatas(): Promise<DataExpedicao[]> {
  try {
    const { data, error } = await supabase
      .from("datas")
      .select("*, expedicoes:expedicao_id(nome, slug, ativo, status, moeda)")
      .order("data_inicio", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return listProximasDatasStatic();
    return data
      .filter((row) => {
        const exp = (row as { expedicoes?: { ativo: boolean; status: string } | null }).expedicoes;
        return exp?.status === "publicado";
      })
      .map((row) => {
        const exp = (row as { expedicoes?: { nome: string; slug: string; moeda?: string } | null }).expedicoes ?? undefined;
        return normalizeData(row as Record<string, unknown>, exp);
      });
  } catch {
    return listProximasDatasStatic();
  }
}
