import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  closestCenter,
} from "@dnd-kit/core";
import { Calendar, Users, CreditCard, Clock, Trash2 } from "lucide-react";
import type { LeadEtapaId, LeadRow } from "@/lib/admin/api";
import {
  JORNADA_ESTAGIOS,
  JORNADA_REATIVACAO,
  JORNADA_TONE_CLASS,
  jornadaEstagio,
  jornadaFromLead,
  type JornadaEstagio,
  type JornadaId,
} from "@/lib/admin/jornada";

type Props = {
  leads: LeadRow[];
  onMove: (id: string, etapa: LeadEtapaId) => void;
  onDelete: (lead: LeadRow) => void;
};

/** Kanban operacional simplificado (Fase B).
 *  - 6 colunas lineares + coluna "Reativação" separada à direita
 *  - cards mostram apenas: Nome / Expedição / Data / Pessoas / Pagamento / Última interação
 *  - clique em qualquer card abre a ficha completa
 */
export function LeadsKanban({ leads, onMove, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const todasColunas: JornadaEstagio[] = useMemo(
    () => [...JORNADA_ESTAGIOS, JORNADA_REATIVACAO],
    [],
  );

  const grouped: Record<JornadaId, LeadRow[]> = useMemo(() => {
    return todasColunas.reduce((acc, s) => {
      acc[s.id] = leads.filter((l) => jornadaFromLead(l) === s.id);
      return acc;
    }, {} as Record<JornadaId, LeadRow[]>);
  }, [leads, todasColunas]);

  const active = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const destino = todasColunas.find((s) => s.id === String(overId));
    if (!destino) return;
    const lead = leads.find((l) => l.id === e.active.id);
    if (!lead) return;
    if (jornadaFromLead(lead) === destino.id) return;
    onMove(lead.id, destino.etapaPadrao);
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-3">
        {/* Jornada linear */}
        <div className="grid gap-3 overflow-x-auto pb-2 min-[1440px]:overflow-visible"
             style={{ gridTemplateColumns: `repeat(${JORNADA_ESTAGIOS.length}, minmax(220px, 1fr))` }}>
          {JORNADA_ESTAGIOS.map((s) => (
            <KanbanColumn key={s.id} id={s.id} leads={grouped[s.id]} onDelete={onDelete} />
          ))}
        </div>

        {/* Reativação separada */}
        {grouped.reativacao.length > 0 && (
          <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.03] p-3">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${JORNADA_TONE_CLASS.indigo}`}>
                {JORNADA_REATIVACAO.label}
              </span>
              <span className="text-[10px] text-[color:var(--admin-cinza-3)]">
                {JORNADA_REATIVACAO.descricao} — {grouped.reativacao.length} cliente(s)
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grouped.reativacao.map((l) => (
                <DraggableLeadCard key={l.id} lead={l} onDelete={() => onDelete(l)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {active ? (
          <div className="rotate-2 opacity-90">
            <LeadCardInner lead={active} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  leads,
  onDelete,
}: {
  id: JornadaId;
  leads: LeadRow[];
  onDelete: (l: LeadRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const estagio = jornadaEstagio(id);
  return (
    <div
      ref={setNodeRef}
      className={`admin-card flex min-h-[420px] flex-col p-3 transition ${
        isOver ? "ring-2 ring-[color:var(--admin-dourado)]/60" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${JORNADA_TONE_CLASS[estagio.tone]}`}>
            {estagio.label}
          </span>
          <span className="text-[10px] text-[color:var(--admin-cinza-3)] truncate">{estagio.descricao}</span>
        </div>
        <span className="rounded-md bg-[color:var(--admin-petroleo-soft)]/40 px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--admin-cinza-1)]">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
        {leads.map((l) => (
          <DraggableLeadCard key={l.id} lead={l} onDelete={() => onDelete(l)} />
        ))}
        {leads.length === 0 ? (
          <p className="rounded-md border border-dashed border-[color:var(--admin-borda)] py-6 text-center text-[11px] text-[color:var(--admin-cinza-3)]">
            Arraste aqui
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, onDelete }: { lead: LeadRow; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <LeadCardInner
        lead={lead}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  );
}

function formatData(s: string | null | undefined): string | null {
  if (!s) return null;
  try {
    return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return null;
  }
}

function tempoAtras(s: string | null | undefined): string | null {
  if (!s) return null;
  const ms = Date.now() - new Date(s).getTime();
  if (Number.isNaN(ms)) return null;
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  const m = Math.floor(d / 30);
  return `${m}mês atrás`;
}

function pagamentoLabel(lead: LeadRow): string | null {
  const canal = lead.canal_atendimento ?? lead.canal_entrada;
  // sem coluna de "forma de pagamento" no lead — usa proxy quando disponível
  if (lead.valor_estimado && lead.valor_estimado > 0) {
    return `R$ ${Math.round(lead.valor_estimado).toLocaleString("pt-BR")}`;
  }
  return canal ? canal.charAt(0).toUpperCase() + canal.slice(1) : null;
}

function LeadCardInner({
  lead,
  onDelete,
  dragging,
  dragAttributes,
  dragListeners,
  setActivatorNodeRef,
}: {
  lead: LeadRow;
  onDelete?: () => void;
  dragging?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
}) {
  const data = formatData(lead.data_interesse);
  const pessoas = lead.quantidade_pessoas ?? null;
  const pagamento = pagamentoLabel(lead);
  const ultima = tempoAtras(lead.ultima_interacao_at ?? lead.updated_at);

  return (
    <div className="group relative rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/90 p-3 transition hover:border-[color:var(--admin-dourado)]/50">
      {/* Cabeçalho: nome (handle de arrasto) + excluir */}
      <div className="flex items-start justify-between gap-2">
        <div
          ref={setActivatorNodeRef}
          {...dragAttributes}
          {...dragListeners}
          className="min-w-0 cursor-grab truncate text-sm font-semibold text-[color:var(--admin-cinza-1)] active:cursor-grabbing"
          title="Arrastar"
        >
          {lead.nome || "—"}
        </div>
        {!dragging && onDelete ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Expedição */}
      {lead.expedicao_interesse ? (
        <div className="mt-1.5 truncate text-[11px] text-[color:var(--admin-cinza-2)]" title={lead.expedicao_interesse}>
          {lead.expedicao_interesse}
        </div>
      ) : null}

      {/* Metadados compactos */}
      <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11px] text-[color:var(--admin-cinza-3)]">
        {data ? (
          <div className="flex items-center gap-1 truncate"><Calendar className="h-3 w-3" /> {data}</div>
        ) : <span />}
        {pessoas ? (
          <div className="flex items-center gap-1 truncate"><Users className="h-3 w-3" /> {pessoas} {pessoas === 1 ? "pessoa" : "pessoas"}</div>
        ) : <span />}
        {pagamento ? (
          <div className="flex items-center gap-1 truncate col-span-2"><CreditCard className="h-3 w-3" /> {pagamento}</div>
        ) : null}
        {ultima ? (
          <div className="flex items-center gap-1 truncate col-span-2"><Clock className="h-3 w-3" /> {ultima}</div>
        ) : null}
      </div>

      {/* Clique abre ficha (cobre o card inteiro, exceto o handle e botão) */}
      {!dragging ? (
        <Link
          to="/admin/leads/$id"
          params={{ id: lead.id }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-0"
          aria-label={`Abrir ficha de ${lead.nome}`}
        />
      ) : null}
    </div>
  );
}
