/**
 * API pública da IA Bárbara — leitura/escrita de leads, conversas, timeline
 * e disponibilidade de expedições.
 *
 * Auth: header `Authorization: Bearer <IA_BARBARA_API_KEY>`.
 * Roda como service_role (bypass de RLS) — toda escrita passa por validação Zod.
 *
 * Compatível com chamadas externas (N8N, WhatsApp API, etc).
 */
import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { z } from "zod";

// ---------- Schemas ----------

const TemperaturaZ = z.enum(["frio", "morno", "quente", "urgente"]);
const StatusAtendZ = z.enum(["ia", "humano", "transferido", "encerrado"]);
const EtapaZ = z.enum(["novo", "em_atendimento", "qualificado", "pronto_reserva", "convertido", "perdido"]);
const MotivoPerdaZ = z.enum(["preco", "data", "sem_disponibilidade", "nao_respondeu", "concorrente", "outro"]);
const CanalZ = z.enum(["whatsapp", "instagram", "email", "site", "telefone", "presencial", "outro"]);
const DirecaoZ = z.enum(["entrada", "saida"]);

const UpsertLeadZ = z.object({
  action: z.literal("upsert_lead"),
  nome: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  telefone: z.string().min(3).max(50).optional().nullable(),
  origem: z.string().max(50).optional().nullable(),
  canal_entrada: z.string().max(50).optional().nullable(),
  expedicao_interesse: z.string().max(255).optional().nullable(),
  data_interesse: z.string().optional().nullable(),
  quantidade_pessoas: z.number().int().min(1).max(50).optional(),
  observacoes: z.string().max(5000).optional().nullable(),
});

const UpdateCamposZ = z.object({
  action: z.literal("update_campos"),
  lead_id: z.string().uuid(),
  temperatura_lead: TemperaturaZ.optional(),
  status_atendimento: StatusAtendZ.optional(),
  etapa_atendimento: EtapaZ.optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
  proxima_acao: z.string().max(500).optional().nullable(),
  resumo_ia: z.string().max(10000).optional().nullable(),
  motivo_perda: MotivoPerdaZ.optional().nullable(),
  motivo_perda_detalhe: z.string().max(1000).optional().nullable(),
  expedicao_id: z.string().uuid().optional().nullable(),
  data_expedicao_id: z.string().uuid().optional().nullable(),
  nivel_interesse: z.number().int().min(1).max(5).optional(),
});

const RegistrarConversaZ = z.object({
  action: z.literal("registrar_conversa"),
  lead_id: z.string().uuid(),
  canal: CanalZ.optional(),
  direcao: DirecaoZ.optional(),
  autor_nome: z.string().max(120).default("ia_barbara"),
  conteudo: z.string().min(1).max(10000),
  tipo: z.enum(["mensagem_ia", "mensagem_humana", "ligacao", "email", "observacao_interna"]).default("mensagem_ia"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const RegistrarTimelineZ = z.object({
  action: z.literal("registrar_timeline"),
  lead_id: z.string().uuid(),
  evento: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
  descricao: z.string().min(1).max(500),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const TransferirHumanoZ = z.object({
  action: z.literal("transferir_humano"),
  lead_id: z.string().uuid(),
  motivo: z.string().max(500).optional(),
});

const PostZ = z.discriminatedUnion("action", [
  UpsertLeadZ,
  UpdateCamposZ,
  RegistrarConversaZ,
  RegistrarTimelineZ,
  TransferirHumanoZ,
]);

// ---------- Helpers ----------

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...(init?.headers ?? {}),
    },
  });
}

function auth(request: Request): Response | null {
  const expected = process.env.IA_BARBARA_API_KEY;
  if (!expected) return json({ error: "IA_BARBARA_API_KEY não configurada no servidor" }, { status: 500 });
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== expected) return json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// ---------- Route ----------

export const Route = createFileRoute("/api/public/ia-barbara/leads")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),

      GET: async ({ request }) => {
        const unauth = auth(request);
        if (unauth) return unauth;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const action = url.searchParams.get("action");

        // --- Lista expedições publicadas com tudo que a IA precisa ---
        if (action === "expedicoes") {
          const { data: expedicoes, error } = await supabaseAdmin
            .from("expedicoes")
            .select(
              "id, slug, nome, subtitulo, descricao_curta, descricao_longa, duracao, nivel, preco, moeda, marca, estado, cidade, regiao, inclui, requisitos, roteiro, politicas, tags, observacoes, como_chegar_titulo, como_chegar_conteudo, como_chegar_aeroporto, como_chegar_referencia, como_chegar_observacoes, parcelamento_max, vagas_total_padrao",
            )
            .eq("ativo", true)
            .eq("status", "publicado")
            .order("ordem");
          if (error) return json({ error: error.message }, { status: 500 });

          const ids = (expedicoes ?? []).map((e) => e.id);
          const { data: datas } = await supabaseAdmin
            .from("datas")
            .select("id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status, tag, preco_pix, preco_cartao")
            .in("expedicao_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
            .order("data_inicio");

          const datasByExp = new Map<string, typeof datas>();
          (datas ?? []).forEach((d) => {
            const arr = datasByExp.get(d.expedicao_id) ?? [];
            arr.push(d);
            datasByExp.set(d.expedicao_id, arr);
          });

          return json({
            expedicoes: (expedicoes ?? []).map((e) => ({
              ...e,
              datas: datasByExp.get(e.id) ?? [],
            })),
          });
        }

        // --- Disponibilidade em tempo real de uma data específica ---
        if (action === "disponibilidade") {
          const dataId = url.searchParams.get("data_id");
          if (!dataId) return json({ error: "data_id obrigatório" }, { status: 400 });
          const { data, error } = await supabaseAdmin
            .from("datas")
            .select("id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status")
            .eq("id", dataId)
            .maybeSingle();
          if (error) return json({ error: error.message }, { status: 500 });
          if (!data) return json({ error: "Data não encontrada" }, { status: 404 });
          return json({
            ...data,
            disponivel: data.status === "disponivel" && (data.vagas_disponiveis ?? 0) > 0,
          });
        }

        // --- Lead por id | telefone | email ---
        const id = url.searchParams.get("id");
        const telefone = url.searchParams.get("telefone");
        const email = url.searchParams.get("email");
        if (!id && !telefone && !email) {
          return json({ error: "Informe id, telefone ou email" }, { status: 400 });
        }

        let query = supabaseAdmin.from("leads").select("*").limit(1);
        if (id) query = query.eq("id", id);
        else if (telefone) query = query.eq("telefone", telefone);
        else if (email) query = query.eq("email", email);

        const { data: lead, error } = await query.maybeSingle();
        if (error) return json({ error: error.message }, { status: 500 });
        if (!lead) return json({ lead: null });

        const [{ data: memoria }, { data: conversas }] = await Promise.all([
          supabaseAdmin.from("lead_memoria").select("*").eq("lead_id", lead.id).maybeSingle(),
          supabaseAdmin
            .from("lead_conversas")
            .select("*")
            .eq("lead_id", lead.id)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        return json({ lead, memoria: memoria ?? null, conversas: conversas ?? [] });
      },

      POST: async ({ request }) => {
        const unauth = auth(request);
        if (unauth) return unauth;

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "JSON inválido" }, { status: 400 });
        }

        const parsed = PostZ.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Payload inválido", issues: parsed.error.issues }, { status: 400 });
        }
        const body = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (body.action === "upsert_lead") {
          // procura por telefone ou email
          let existing: { id: string } | null = null;
          if (body.telefone) {
            const { data } = await supabaseAdmin.from("leads").select("id").eq("telefone", body.telefone).maybeSingle();
            existing = data ?? null;
          }
          if (!existing && body.email) {
            const { data } = await supabaseAdmin.from("leads").select("id").eq("email", body.email).maybeSingle();
            existing = data ?? null;
          }

          if (existing) {
            const patch: Record<string, unknown> = { ultima_interacao_at: new Date().toISOString() };
            if (body.expedicao_interesse) patch.expedicao_interesse = body.expedicao_interesse;
            if (body.data_interesse) patch.data_interesse = body.data_interesse;
            if (body.quantidade_pessoas) patch.quantidade_pessoas = body.quantidade_pessoas;
            if (body.observacoes) patch.observacoes = body.observacoes;
            const { data, error } = await supabaseAdmin.from("leads").update(patch).eq("id", existing.id).select().single();
            if (error) return json({ error: error.message }, { status: 500 });
            return json({ lead: data, created: false });
          }

          // gera protocolo
          const { data: protocolo } = await supabaseAdmin.rpc("gerar_protocolo_lead");
          const { data, error } = await supabaseAdmin
            .from("leads")
            .insert({
              nome: body.nome,
              email: body.email ?? null,
              telefone: body.telefone ?? null,
              origem: body.origem ?? "ia_barbara",
              canal_entrada: body.canal_entrada ?? "whatsapp",
              canal_atendimento: "whatsapp",
              expedicao_interesse: body.expedicao_interesse ?? null,
              data_interesse: body.data_interesse ?? null,
              quantidade_pessoas: body.quantidade_pessoas ?? 1,
              observacoes: body.observacoes ?? null,
              protocolo: protocolo ?? null,
              status_atendimento: "ia",
            })
            .select()
            .single();
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ lead: data, created: true });
        }

        if (body.action === "update_campos") {
          const { action: _a, lead_id, ...patch } = body;
          // remove undefined
          const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
          cleaned.ultima_interacao_at = new Date().toISOString();
          // se etapa virou perdido sem motivo, força "outro"
          if (cleaned.etapa_atendimento === "perdido" && !cleaned.motivo_perda) {
            cleaned.motivo_perda = "outro";
          }
          // sincroniza status legado
          if (cleaned.etapa_atendimento) cleaned.status = cleaned.etapa_atendimento;
          const { data, error } = await supabaseAdmin.from("leads").update(cleaned).eq("id", lead_id).select().single();
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ lead: data });
        }

        if (body.action === "registrar_conversa") {
          const { data, error } = await supabaseAdmin
            .from("lead_conversas")
            .insert({
              lead_id: body.lead_id,
              tipo_evento: body.tipo,
              canal: body.canal ?? "whatsapp",
              direcao: body.direcao ?? "entrada",
              autor_nome: body.autor_nome,
              conteudo: body.conteudo,
              metadata: body.metadata ?? {},
            })
            .select()
            .single();
          if (error) return json({ error: error.message }, { status: 500 });
          // atualiza última interação no lead
          await supabaseAdmin
            .from("leads")
            .update({ ultima_interacao_at: new Date().toISOString() })
            .eq("id", body.lead_id);
          return json({ conversa: data });
        }

        if (body.action === "registrar_timeline") {
          const { data, error } = await supabaseAdmin
            .from("lead_conversas")
            .insert({
              lead_id: body.lead_id,
              tipo_evento: body.evento,
              conteudo: body.descricao,
              metadata: body.metadata ?? {},
            })
            .select()
            .single();
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ evento: data });
        }

        if (body.action === "transferir_humano") {
          const { data, error } = await supabaseAdmin
            .from("leads")
            .update({ status_atendimento: "humano", proxima_acao: body.motivo ?? "Atendimento humano solicitado" })
            .eq("id", body.lead_id)
            .select()
            .single();
          if (error) return json({ error: error.message }, { status: 500 });
          return json({ lead: data });
        }

        return json({ error: "Ação desconhecida" }, { status: 400 });
      },
    },
  },
});
