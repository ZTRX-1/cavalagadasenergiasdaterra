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

export type { DataExpedicao, Expedicao };

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
  };
}

function normalizeData(row: Record<string, unknown>, exp?: { nome: string; slug: string }): DataExpedicao {
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
  };
}

export async function listExpedicoes(): Promise<Expedicao[]> {
  try {
    const { data, error } = await supabase
      .from("expedicoes")
      .select("*")
      .eq("ativo", true)
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
): Promise<{ expedicao: Expedicao; datas: DataExpedicao[] } | null> {
  const canonicalSlug = getCanonicalExpedicaoSlug(input.data.slug);
  try {
    const { data: exp, error } = await supabase
      .from("expedicoes")
      .select("*")
      .eq("slug", canonicalSlug)
      .eq("ativo", true)
      .eq("status", "publicado")
      .maybeSingle();
    if (error) throw error;
    if (!exp) return getExpedicaoBySlugStatic(input);
    const norm = normalizeExpedicao(exp as Record<string, unknown>);
    const { data: datas } = await supabase
      .from("datas")
      .select("*")
      .eq("expedicao_id", norm.id)
      .order("data_inicio", { ascending: true });
    return {
      expedicao: norm,
      datas: (datas ?? []).map((d) =>
        normalizeData(d as Record<string, unknown>, { nome: norm.nome, slug: norm.slug }),
      ),
    };
  } catch {
    return getExpedicaoBySlugStatic(input);
  }
}

export async function listProximasDatas(): Promise<DataExpedicao[]> {
  try {
    const { data, error } = await supabase
      .from("datas")
      .select("*, expedicoes:expedicao_id(nome, slug, ativo, status)")
      .order("data_inicio", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return listProximasDatasStatic();
    return data
      .filter((row) => {
        const exp = (row as { expedicoes?: { ativo: boolean; status: string } | null }).expedicoes;
        return exp?.ativo && exp.status === "publicado";
      })
      .map((row) => {
        const exp = (row as { expedicoes?: { nome: string; slug: string } | null }).expedicoes ?? undefined;
        return normalizeData(row as Record<string, unknown>, exp);
      });
  } catch {
    return listProximasDatasStatic();
  }
}
