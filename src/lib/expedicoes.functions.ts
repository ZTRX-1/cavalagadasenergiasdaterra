import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCanonicalExpedicaoSlug } from "@/lib/expedicao-slugs";

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
  marca: string;
  pais: string;
  regiao: string | null;
  imagem_url: string | null;
  galeria: string[];
  inclui: string[];
  requisitos: string[];
  roteiro: { dia: string; titulo: string; desc: string }[];
}

export interface DataExpedicao {
  id: string;
  expedicao_id: string;
  expedicao_nome?: string;
  expedicao_slug?: string;
  data_inicio: string;
  data_fim: string;
  vagas_total: number;
  vagas_disponiveis: number;
  status: string;
  preco_pix?: number | null;
  preco_cartao?: number | null;
}


export const listExpedicoes = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("expedicoes")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Expedicao[];
});

export const getExpedicaoBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const canonicalSlug = getCanonicalExpedicaoSlug(data.slug);
    const { data: exp, error } = await supabaseAdmin
      .from("expedicoes")
      .select("*")
      .eq("slug", canonicalSlug)
      .eq("ativo", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!exp) return null;

    const { data: datas, error: e2 } = await supabaseAdmin
      .from("datas")
      .select("*")
      .eq("expedicao_id", exp.id)
      .gte("data_inicio", new Date().toISOString().slice(0, 10))
      .order("data_inicio", { ascending: true });
    if (e2) throw new Error(e2.message);

    return { expedicao: exp as unknown as Expedicao, datas: (datas ?? []) as unknown as DataExpedicao[] };
  });

export const listProximasDatas = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("datas")
    .select("id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status, preco_pix, preco_cartao, expedicoes!inner(nome, slug, ativo)")
    .gte("data_inicio", today)
    .eq("expedicoes.ativo", true)
    .order("data_inicio", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: any) => ({
    id: d.id,
    expedicao_id: d.expedicao_id,
    expedicao_nome: d.expedicoes.nome,
    expedicao_slug: d.expedicoes.slug,
    data_inicio: d.data_inicio,
    data_fim: d.data_fim,
    vagas_total: d.vagas_total,
    vagas_disponiveis: d.vagas_disponiveis,
    status: d.status,
    preco_pix: d.preco_pix,
    preco_cartao: d.preco_cartao,
  })) as DataExpedicao[];
});

