import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Save, Star, Trash2, ChevronUp, ChevronDown, Plus, ExternalLink, CheckCircle2, Circle, CalendarDays, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { GuidedSection, GuidedField, ListEditor } from "@/components/admin/guided-editor-components";
import { AdminUploader } from "@/components/admin/admin-uploader";
import { ExpedicaoPreview } from "@/components/admin/expedicao-preview";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import {
  getExpedicao,
  updateExpedicao,
  listAssets,
  uploadAsset,
  updateAsset,
  deleteAsset,
  setCapa,
  moveAsset,
  listDatas,
  createData,
  updateData,
  deleteData,
  slugify,
  type ExpedicaoRow,
  type AssetRow,
  type DataRow as DataRowRecord,
} from "@/lib/admin/api";

// Helpers for date/money (from existing file logic)
function isoToBrDate(iso: string | null) { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }
function brToIsoDate(br: string) { if (!br) return ""; const [d, m, y] = br.split("/"); return `${y}-${m}-${d}`; }
function formatBrDateInput(val: string) {
  const digits = val.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export const Route = createFileRoute("/admin/_authenticated/expedicoes/$id")({
  component: ExpedicaoEdit,
});

type RoteiroDia = { dia: string; titulo: string; desc: string };

function ExpedicaoEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: exp, isLoading } = useQuery({ queryKey: ["admin", "expedicao", id], queryFn: () => getExpedicao(id) });
  const { data: assets = [] } = useQuery({ queryKey: ["admin", "assets", id], queryFn: () => listAssets(id), enabled: !!exp });
  const { data: datas = [] } = useQuery({ queryKey: ["admin", "datas", id], queryFn: () => listDatas(id), enabled: !!exp });

  const [form, setForm] = useState<Partial<ExpedicaoRow> | null>(null);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => { if (exp) setForm(exp); }, [exp]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll("section[id]").forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [form]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<ExpedicaoRow>) => updateExpedicao(id, patch),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });

  const setF = (patch: Partial<ExpedicaoRow>) => setForm((f) => ({ ...(f ?? {}), ...patch }));

  if (!form) return <div className="admin-card h-40 animate-pulse" />;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8 pb-24">
      <nav className="sticky top-24 hidden lg:block space-y-1 h-fit">
        {[
          { id: "hero", label: "1. Hero" },
          { id: "imagens", label: "2. Experiência" },
          { id: "sobre", label: "3. Sobre" },
          { id: "cards", label: "4. Cards laterais" },
          { id: "roteiro", label: "5. Roteiro" },
          { id: "info", label: "6. Informações" },
          { id: "logistica", label: "7. Logística" },
          { id: "datas", label: "8. Próximas datas" },
          { id: "publicacao", label: "9. SEO e Publicação" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              setActiveSection(item.id);
            }}
            className={cn(
              "block px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors border-l-2",
              activeSection === item.id 
                ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-dourado-glow)] bg-[color:var(--admin-dourado)]/10" 
                : "border-transparent text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado-glow)]"
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        <GuidedSection id="hero" titulo="1. Hero da expedição" explicacao="Esta seção aparece no topo da página da expedição, sobre a imagem principal.">
          <div className="grid md:grid-cols-2 gap-6">
            <AdminField label="Título principal" ondeAparece="H1" previewTarget="hero">
              <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setF({ nome: e.target.value })} />
            </AdminField>
            <AdminField label="Linha de apoio" ondeAparece="Subtítulo sob o título principal" previewTarget="hero">
              <input className="admin-input" value={form.subtitulo ?? ""} onChange={(e) => setF({ subtitulo: e.target.value })} />
            </AdminField>
          </div>
        </GuidedSection>

        <GuidedSection id="imagens" titulo="2. Experiência em imagens" explicacao="Este bloco controla o carrossel de fotos da expedição. A 1ª foto também será usada como capa.">
          <AdminUploader
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
            hint="Envie até 8 fotos."
            onFiles={async (files) => {
              for (const f of files) await uploadAsset(id, f, "imagem");
              qc.invalidateQueries({ queryKey: ["admin", "assets", id] });
              qc.invalidateQueries({ queryKey: ["admin", "expedicao", id] });
            }}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assets.filter((a) => a.tipo === "imagem").map((a, i) => (
              <div key={a.id} className="admin-card p-3 space-y-2 relative group">
                <img src={a.url} className="aspect-[4/3] w-full rounded object-cover" />
                <textarea
                  className="admin-input text-xs min-h-[60px]"
                  placeholder="Legenda da foto..."
                  defaultValue={a.titulo ?? ""}
                  onBlur={(e) => updateAsset(a.id, { titulo: e.target.value })}
                />
                <button 
                  onClick={async () => { if(confirm("Remover?")) { await deleteAsset(a); qc.invalidateQueries({ queryKey: ["admin"] }); } }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </GuidedSection>

        <GuidedSection id="sobre" titulo="3. Sobre a expedição" explicacao="Este texto aparece na seção A Experiência, abaixo do carrossel.">
          <AdminField label="Título da seção" ondeAparece="Título da experiência" previewTarget="descricao">
            <input className="admin-input" value={form.regiao ?? ""} onChange={(e) => setF({ regiao: e.target.value })} />
          </AdminField>
          <AdminField label="Texto principal" ondeAparece="Corpo do texto da experiência" previewTarget="descricao">
            <textarea 
              className="admin-input min-h-[200px]" 
              value={form.descricao_longa ?? ""} 
              onChange={(e) => setF({ descricao_longa: e.target.value })} 
            />
          </AdminField>
        </GuidedSection>

        <GuidedSection id="cards" titulo="4. Cards laterais" explicacao="Configurações dos blocos de informações na lateral direita da página.">
          <div className="grid md:grid-cols-2 gap-8">
            <AdminField label="O que está incluso" ondeAparece="Card 'Incluso'">
              <ListEditor items={form.inclui ?? []} onChange={(items) => setF({ inclui: items })} />
            </AdminField>
            <div className="space-y-6">
              <AdminField label="Informações / Requisitos" ondeAparece="Card de requisitos">
                <ListEditor items={form.requisitos ?? []} onChange={(items) => setF({ requisitos: items })} />
              </AdminField>
              <AdminField label="Mensagem pública de valor" ondeAparece="No lugar do preço" hint="Ex: 'Consulte valores e disponibilidade'">
                <input className="admin-input" value={form.mensagem_comercial_publica ?? ""} onChange={(e) => setF({ mensagem_comercial_publica: e.target.value })} />
              </AdminField>
            </div>
          </div>
        </GuidedSection>

        <GuidedSection id="roteiro" titulo="5. Roteiro" explicacao="Esta seção mostra como cada dia da expedição se desenrola.">
          <div className="space-y-4">
            {(form.roteiro ?? []).map((d, idx) => (
              <div key={idx} className="admin-card p-4 space-y-4 relative group">
                <div className="flex items-center gap-4">
                  <input 
                    className="admin-input w-24 font-bold" 
                    value={d.dia} 
                    onChange={(e) => {
                      const next = [...(form.roteiro ?? [])];
                      next[idx].dia = e.target.value;
                      setF({ roteiro: next });
                    }}
                  />
                  <input 
                    className="admin-input flex-1" 
                    placeholder="Título do dia"
                    value={d.titulo} 
                    onChange={(e) => {
                      const next = [...(form.roteiro ?? [])];
                      next[idx].titulo = e.target.value;
                      setF({ roteiro: next });
                    }}
                  />
                  <button onClick={() => {
                    const next = (form.roteiro ?? []).filter((_, i) => i !== idx);
                    setF({ roteiro: next });
                  }} className="text-rose-400 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea 
                  className="admin-input min-h-[80px]" 
                  placeholder="Descrição do que acontece..."
                  value={d.desc} 
                  onChange={(e) => {
                    const next = [...(form.roteiro ?? [])];
                    next[idx].desc = e.target.value;
                    setF({ roteiro: next });
                  }}
                />
              </div>
            ))}
            <button 
              onClick={() => setF({ roteiro: [...(form.roteiro ?? []), { dia: `Dia ${(form.roteiro?.length ?? 0) + 1}`, titulo: "", desc: "" }] })}
              className="admin-btn-ghost w-full py-4 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar novo dia
            </button>
          </div>
        </GuidedSection>

        <GuidedSection id="info" titulo="6. Informações importantes" explicacao="Dados técnicos que aparecem na faixa de resumo.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdminField label="Nível de equitação" ondeAparece="Ícone de nível">
              <select className="admin-input" value={form.nivel ?? ""} onChange={(e) => setF({ nivel: e.target.value })}>
                <option>Iniciante</option>
                <option>Intermediário</option>
                <option>Avançado</option>
              </select>
            </AdminField>
            <AdminField label="Duração" ondeAparece="Ícone de relógio">
              <input className="admin-input" value={form.duracao ?? ""} onChange={(e) => setF({ duracao: e.target.value })} placeholder="Ex: 5 dias / 4 noites" />
            </AdminField>
            <AdminField label="Preço base (interno)" ondeAparece="Gestão interna">
              <input className="admin-input" type="number" value={form.preco ?? 0} onChange={(e) => setF({ preco: Number(e.target.value) })} />
            </AdminField>
          </div>
        </GuidedSection>

        <GuidedSection id="logistica" titulo="7. Logística / Como chegar" explicacao="Essas informações aparecem na parte inferior da página.">
          <div className="grid md:grid-cols-2 gap-6">
            <AdminField label="Aeroportos/Rodoviárias" ondeAparece="Seção logística">
              <textarea className="admin-input" value={form.como_chegar_aeroporto ?? ""} onChange={(e) => setF({ como_chegar_aeroporto: e.target.value })} />
            </AdminField>
            <AdminField label="Distâncias das capitais" ondeAparece="Seção logística" hint="Uma cidade por linha">
              <textarea className="admin-input" value={form.como_chegar_distancias ?? ""} onChange={(e) => setF({ como_chegar_distancias: e.target.value })} placeholder="São Paulo: 250km" />
            </AdminField>
          </div>
        </GuidedSection>

        <GuidedSection id="datas" titulo="8. Próximas datas" explicacao="Gerenciamento de turmas e vagas.">
          <div className="space-y-4">
            {datas.map((d) => (
              <DataRow 
                key={d.id} 
                data={d} 
                onSave={(patch) => updateData(d.id, patch).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))}
                onDelete={() => deleteData(d.id).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))}
              />
            ))}
            <button 
              onClick={async () => {
                const today = new Date().toISOString().slice(0,10);
                await createData({ expedicao_id: id, data_inicio: today, data_fim: today, vagas_total: 10, vagas_disponiveis: 10, status: "disponivel", preco_pix: form.preco ?? 0, preco_cartao: form.preco ?? 0 });
                qc.invalidateQueries({ queryKey: ["admin", "datas", id] });
              }}
              className="admin-btn-ghost w-full py-4 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar nova data
            </button>
          </div>
        </GuidedSection>

        <GuidedSection id="publicacao" titulo="9. SEO e Publicação" explicacao="Controle de visibilidade e indexação.">
          <div className="grid md:grid-cols-2 gap-6">
            <AdminField label="Status da expedição" ondeAparece="Visibilidade no site">
              <select className="admin-input" value={form.status ?? "rascunho"} onChange={(e) => setF({ status: e.target.value as any })}>
                <option value="rascunho">Rascunho</option>
                <option value="publicado">Publicado</option>
                <option value="pausado">Pausado</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </AdminField>
            <AdminField label="Slug (URL)" ondeAparece="Link do navegador">
              <input className="admin-input font-mono" value={form.slug ?? ""} onChange={(e) => setF({ slug: slugify(e.target.value) })} />
            </AdminField>
          </div>
        </GuidedSection>
        
        <div className="flex items-center justify-between p-6 admin-card sticky bottom-6 z-20 shadow-2xl border-[color:var(--admin-dourado)]/30">
          <div className="flex items-center gap-4">
            <StatusBadge status={form.status ?? "rascunho"} className="scale-110" />
            <span className="text-sm text-[color:var(--admin-cinza-3)] italic">Alterações não salvas</span>
          </div>
          <div className="flex gap-3">
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/expedicoes" })}>Cancelar</button>
            <button className="admin-btn-primary px-8 py-3" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
              <Save className="h-5 w-5 mr-2" /> Salvar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
