import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Trash2, Pencil, X, Save, Tag, Globe2, Star } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/ia-kb")({
  component: KBPage,
});

const TIPOS = [
  { k: "faq", l: "FAQ" },
  { k: "politica", l: "Política" },
  { k: "procedimento_interno", l: "Procedimento Interno" },
  { k: "expedicao", l: "Expedição" },
  { k: "hospedagem", l: "Hospedagem" },
  { k: "transporte", l: "Transporte" },
  { k: "pagamento", l: "Pagamento" },
  { k: "cancelamento", l: "Cancelamento" },
  { k: "documentacao", l: "Documentação" },
  { k: "roteiro_atendimento", l: "Roteiro de Atendimento" },
  { k: "objecoes_comerciais", l: "Objeções Comerciais" },
  { k: "seguranca", l: "Segurança" },
  { k: "alimentacao", l: "Alimentação" },
  { k: "equipamentos", l: "Equipamentos" },
] as const;

type Tipo = typeof TIPOS[number]["k"];
type Escopo = "global" | "expedicao" | "data";
type Prioridade = "baixa" | "media" | "alta" | "critica";

const PRIORIDADES: Prioridade[] = ["baixa", "media", "alta", "critica"];
const IDIOMAS = [
  { k: "pt-BR", l: "Português" },
  { k: "en", l: "Inglês" },
  { k: "es", l: "Espanhol" },
];

type KBItem = {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  subcategoria: string | null;
  tags: string[];
  tipo: Tipo;
  prioridade: Prioridade;
  idioma: string;
  escopo: Escopo;
  expedicao_id: string | null;
  data_id: string | null;
  ativo: boolean;
  versao: number;
  total_utilizacoes: number;
  ultima_utilizacao: string | null;
  embedding_pendente: boolean;
  created_at: string;
  updated_at: string;
};

async function listKB(): Promise<KBItem[]> {
  const { data, error } = await supabase
    .from("ia_knowledge_base")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as KBItem[];
}

async function listExpedicoes() {
  const { data } = await supabase.from("expedicoes").select("id,nome").order("nome");
  return (data ?? []) as { id: string; nome: string }[];
}

const empty = (): Partial<KBItem> => ({
  titulo: "",
  conteudo: "",
  categoria: "",
  subcategoria: "",
  tags: [],
  tipo: "faq",
  prioridade: "media",
  idioma: "pt-BR",
  escopo: "global",
  expedicao_id: null,
  data_id: null,
  ativo: true,
});

function KBPage() {
  const qc = useQueryClient();
  const { canEdit } = useCan("ia");
  const { data: items = [] } = useQuery({ queryKey: ["ia-kb"], queryFn: listKB });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["expedicoes-min"], queryFn: listExpedicoes });

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [escopo, setEscopo] = useState<Escopo | "">("");
  const [editing, setEditing] = useState<Partial<KBItem> | null>(null);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((i) => {
      if (tipo && i.tipo !== tipo) return false;
      if (escopo && i.escopo !== escopo) return false;
      if (!ql) return true;
      return (
        i.titulo.toLowerCase().includes(ql) ||
        (i.conteudo || "").toLowerCase().includes(ql) ||
        (i.categoria || "").toLowerCase().includes(ql) ||
        (i.subcategoria || "").toLowerCase().includes(ql) ||
        (i.tags || []).some((t) => t.toLowerCase().includes(ql))
      );
    });
  }, [items, q, tipo, escopo]);

  const save = useMutation({
    mutationFn: async (it: Partial<KBItem>) => {
      const payload = {
        titulo: it.titulo ?? "",
        conteudo: it.conteudo ?? "",
        categoria: it.categoria || null,
        subcategoria: it.subcategoria || null,
        tags: it.tags ?? [],
        tipo: (it.tipo ?? "faq") as Tipo,
        prioridade: (it.prioridade ?? "media") as Prioridade,
        idioma: it.idioma ?? "pt-BR",
        escopo: (it.escopo ?? "global") as Escopo,
        expedicao_id: it.escopo === "global" ? null : (it.expedicao_id ?? null),
        data_id: it.escopo === "data" ? (it.data_id ?? null) : null,
        ativo: it.ativo ?? true,
      };
      if (it.id) {
        const { error } = await supabase.from("ia_knowledge_base").update(payload).eq("id", it.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ia_knowledge_base").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Item salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ia-kb"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ia_knowledge_base").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removido");
      qc.invalidateQueries({ queryKey: ["ia-kb"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança · IA Bárbara"
        title="Base de Conhecimento"
        description="FAQs, políticas, procedimentos e roteiros que alimentam a operação e, na Fase 3, a IA."
        actions={canEdit ? (
          <button
            onClick={() => setEditing(empty())}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo item
          </button>
        ) : null}
      />

      <AdminPageIntro>
        Esta base é o principal ativo da Bárbara. Toda informação registrada aqui é usada hoje pela operação
        humana e, na Fase 3, será indexada e consultada pela IA. Mantenha tudo claro, curto e atualizado.
      </AdminPageIntro>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-cinza-3)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, conteúdo, categoria ou tag…"
            className="admin-input h-10 w-full pl-9 pr-3 text-sm"
          />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo | "")} className="admin-input h-10 px-3 text-sm">
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
        </select>
        <select value={escopo} onChange={(e) => setEscopo(e.target.value as Escopo | "")} className="admin-input h-10 px-3 text-sm">
          <option value="">Todos os escopos</option>
          <option value="global">Global</option>
          <option value="expedicao">Por expedição</option>
          <option value="data">Por data</option>
        </select>
      </div>

      <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--admin-cinza-3)]">
            <BookOpen className="mx-auto mb-3 h-6 w-6 opacity-60" />
            Nenhum item encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--admin-borda)]">
            {filtered.map((it) => (
              <li key={it.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs uppercase tracking-wide text-[color:var(--admin-dourado)]">
                      {TIPOS.find((t) => t.k === it.tipo)?.l ?? it.tipo}
                    </span>
                    <Badge>{it.escopo}</Badge>
                    <Badge>{it.prioridade}</Badge>
                    <Badge><Globe2 className="h-3 w-3" /> {it.idioma}</Badge>
                    {!it.ativo && <Badge tone="muted">inativo</Badge>}
                    {it.embedding_pendente && <Badge tone="muted">reindexar</Badge>}
                  </div>
                  <div className="text-sm font-medium text-[color:var(--admin-cinza-1)] truncate">{it.titulo}</div>
                  <div className="mt-1 text-xs text-[color:var(--admin-cinza-3)] line-clamp-2">{it.conteudo}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--admin-cinza-3)]">
                    {it.categoria && <span>📁 {it.categoria}{it.subcategoria ? ` / ${it.subcategoria}` : ""}</span>}
                    {it.tags?.length ? (
                      <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> {it.tags.join(", ")}</span>
                    ) : null}
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {it.total_utilizacoes} usos</span>
                    <span>· v{it.versao}</span>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(it)} className="rounded-md p-2 text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo-soft)]/40" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm("Remover este item?")) remove.mutate(it.id); }} className="rounded-md p-2 text-[color:var(--admin-cinza-2)] hover:text-red-400" title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <EditorModal
          item={editing}
          expedicoes={expedicoes}
          onClose={() => setEditing(null)}
          onSave={(v) => save.mutate(v)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "muted" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
      tone === "muted"
        ? "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)]"
        : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)]"
    }`}>{children}</span>
  );
}

function EditorModal({
  item, expedicoes, onClose, onSave, saving,
}: {
  item: Partial<KBItem>;
  expedicoes: { id: string; nome: string }[];
  onClose: () => void;
  onSave: (v: Partial<KBItem>) => void;
  saving: boolean;
}) {
  const [v, setV] = useState<Partial<KBItem>>(item);
  const [tagDraft, setTagDraft] = useState("");
  const set = <K extends keyof KBItem>(k: K, val: KBItem[K]) => setV((p) => ({ ...p, [k]: val }));

  const addTag = () => {
    if (!tagDraft.trim()) return;
    set("tags", [...(v.tags ?? []), tagDraft.trim()]);
    setTagDraft("");
  };

  const valid = (v.titulo ?? "").trim().length > 2 && (v.conteudo ?? "").trim().length > 5
    && (v.escopo !== "expedicao" || !!v.expedicao_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-[color:var(--admin-cinza-1)]">
            {item.id ? "Editar item" : "Novo item da KB"}
          </h2>
          <button onClick={onClose} className="text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <L label="Tipo">
            <select value={v.tipo} onChange={(e) => set("tipo", e.target.value as Tipo)} className="admin-input h-9 w-full px-3 text-sm">
              {TIPOS.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
            </select>
          </L>
          <L label="Prioridade">
            <select value={v.prioridade} onChange={(e) => set("prioridade", e.target.value as Prioridade)} className="admin-input h-9 w-full px-3 text-sm">
              {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </L>
          <L label="Categoria">
            <input value={v.categoria ?? ""} onChange={(e) => set("categoria", e.target.value)} className="admin-input h-9 w-full px-3 text-sm" />
          </L>
          <L label="Subcategoria">
            <input value={v.subcategoria ?? ""} onChange={(e) => set("subcategoria", e.target.value)} className="admin-input h-9 w-full px-3 text-sm" />
          </L>
          <L label="Idioma">
            <select value={v.idioma} onChange={(e) => set("idioma", e.target.value)} className="admin-input h-9 w-full px-3 text-sm">
              {IDIOMAS.map((i) => <option key={i.k} value={i.k}>{i.l}</option>)}
            </select>
          </L>
          <L label="Escopo">
            <select value={v.escopo} onChange={(e) => set("escopo", e.target.value as Escopo)} className="admin-input h-9 w-full px-3 text-sm">
              <option value="global">Global</option>
              <option value="expedicao">Por expedição</option>
              <option value="data">Por data específica</option>
            </select>
          </L>
          {(v.escopo === "expedicao" || v.escopo === "data") && (
            <L label="Expedição vinculada">
              <select value={v.expedicao_id ?? ""} onChange={(e) => set("expedicao_id", e.target.value || null)} className="admin-input h-9 w-full px-3 text-sm">
                <option value="">Selecione…</option>
                {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </L>
          )}
        </div>

        <div className="mt-4">
          <L label="Título">
            <input value={v.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} className="admin-input h-9 w-full px-3 text-sm" />
          </L>
        </div>
        <div className="mt-4">
          <L label="Conteúdo">
            <textarea rows={8} value={v.conteudo ?? ""} onChange={(e) => set("conteudo", e.target.value)} className="admin-input w-full p-3 text-sm" />
          </L>
        </div>

        <div className="mt-4">
          <L label="Tags">
            <div className="flex flex-wrap gap-1 mb-2">
              {(v.tags ?? []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--admin-borda)] px-2 py-0.5 text-[11px] text-[color:var(--admin-cinza-2)]">
                  {t}
                  <button onClick={() => set("tags", (v.tags ?? []).filter((_, idx) => idx !== i))} className="text-[color:var(--admin-cinza-3)] hover:text-red-400">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="adicionar tag…" className="admin-input h-9 flex-1 px-3 text-sm" />
              <button type="button" onClick={addTag} className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1.5 text-xs text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40">Adicionar</button>
            </div>
          </L>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-[color:var(--admin-cinza-2)]">
          <input type="checkbox" checked={v.ativo ?? true} onChange={(e) => set("ativo", e.target.checked)} />
          Ativo
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[color:var(--admin-borda)] px-4 py-2 text-sm text-[color:var(--admin-cinza-1)]">Cancelar</button>
          <button
            disabled={!valid || saving}
            onClick={() => onSave(v)}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-[color:var(--admin-cinza-3)]">
      <div className="mb-1">{label}</div>
      {children}
    </label>
  );
}
