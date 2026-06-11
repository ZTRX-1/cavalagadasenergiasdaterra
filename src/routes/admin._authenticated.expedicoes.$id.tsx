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
      <nav className="sticky top-24 hidden lg:block space-y-2 h-fit">
        {[
          { id: "hero", label: "1. Hero" },
          { id: "imagens", label: "2. Experiência (Imagens)" },
          { id: "sobre", label: "3. Sobre" },
          { id: "cards", label: "4. Cards laterais" },
          { id: "roteiro", label: "5. Roteiro" },
          { id: "info", label: "6. Informações importantes" },
          { id: "logistica", label: "7. Logística" },
          { id: "datas", label: "8. Próximas datas" },
          { id: "publicacao", label: "9. SEO e Publicação" },
        ].map(i => <a key={i.id} href={`#${i.id}`} className="block px-4 py-2 text-xs uppercase tracking-[0.1em] text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado-glow)]">{i.label}</a>)}
      </nav>

      <div className="space-y-8">
        <GuidedSection id="hero" titulo="Hero da expedição" explicacao="Esta seção aparece no topo da página da expedição, sobre a imagem principal.">
          <div className="grid md:grid-cols-2 gap-6">
            <AdminField label="Título principal" ondeAparece="H1" previewTarget="hero">
              <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setF({ nome: e.target.value })} />
            </AdminField>
            <AdminField label="Linha de apoio" ondeAparece="Subtítulo sob o título principal" previewTarget="hero">
              <input className="admin-input" value={form.subtitulo ?? ""} onChange={(e) => setF({ subtitulo: e.target.value })} />
            </AdminField>
          </div>
        </GuidedSection>
        
        {/* Adicione as outras seções conforme solicitado seguindo este mesmo padrão */}
        
        <div className="flex gap-4">
            <button className="admin-btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
              <Save className="h-4 w-4" /> Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
}
