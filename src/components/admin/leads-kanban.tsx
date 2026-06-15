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
import { Star, Flame, Trash2, ArrowRight } from "lucide-react";
import { LEAD_TEMPERATURAS, type LeadEtapaId, type LeadRow } from "@/lib/admin/api";
import {
  JORNADA_ESTAGIOS,
  JORNADA_TONE_CLASS,
  jornadaEstagio,
  jornadaFromLead,
  type JornadaId,
} from "@/lib/admin/jornada";

type Props = {
  leads: LeadRow[];
  onMove: (id: string, etapa: LeadEtapaId) => void;
  onDelete: (lead: LeadRow) => void;
  onConverter: (lead: LeadRow) => void;
};

export function LeadsKanban({ leads, onMove, onDelete, onConverter }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped: Record<JornadaId, LeadRow[]> = useMemo(() => {
    return JORNADA_ESTAGIOS.reduce((acc, s) => {
      acc[s.id] = leads.filter((l) => jornadaFromLead(l) === s.id);
      return acc;
    }, {} as Record<JornadaId, LeadRow[]>);
  }, [leads]);

  const active = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const destino = JORNADA_ESTAGIOS.find((s) => s.id === String(overId));
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
      <div
        className="grid gap-3 overflow-x-auto pb-4"
        style={{ gridTemplateColumns: `repeat(${JORNADA_ESTAGIOS.length}, minmax(240px, 1fr))` }}
      >
        {JORNADA_ESTAGIOS.map((s) => (
          <KanbanColumn
            key={s.id}
            id={s.id}
            leads={grouped[s.id]}
            onDelete={onDelete}
            onConverter={onConverter}
          />
        ))}
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
  onConverter,
}: {
  id: JornadaId;
  leads: LeadRow[];
  onDelete: (l: LeadRow) => void;
  onConverter: (l: LeadRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const estagio = jornadaEstagio(id);
  return (
    <div
      ref={setNodeRef}
      className={`admin-card flex min-h-[400px] flex-col p-3 transition ${
        isOver ? "ring-2 ring-[color:var(--admin-dourado)]/60" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${JORNADA_TONE_CLASS[estagio.tone]}`}>
            {estagio.label}
          </span>
          <span className="text-[10px] text-[color:var(--admin-cinza-3)]">{estagio.descricao}</span>
        </div>
        <span className="text-xs text-[color:var(--admin-cinza-3)]">{leads.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {leads.map((l) => (
          <DraggableLeadCard
            key={l.id}
            lead={l}
            onDelete={() => onDelete(l)}
            onConverter={() => onConverter(l)}
          />
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

function DraggableLeadCard({
  lead,
  onDelete,
  onConverter,
}: {
  lead: LeadRow;
  onDelete: () => void;
  onConverter: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <LeadCardInner
        lead={lead}
        onDelete={onDelete}
        onConverter={onConverter}
        dragAttributes={attributes}
        dragListeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
      />
    </div>
  );
}

function LeadCardInner({
  lead,
  onDelete,
  onConverter,
  dragging,
  dragAttributes,
  dragListeners,
  setActivatorNodeRef,
}: {
  lead: LeadRow;
  onDelete?: () => void;
  onConverter?: () => void;
  dragging?: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
}) {
  const nivel = lead.nivel_interesse ?? 3;
  const score = lead.lead_score ?? 0;
  const ehReservaPendente = lead.etapa_atendimento === "reserva_pendente";
  const temperatura = LEAD_TEMPERATURAS.find((t) => t.id === (lead.temperatura_lead ?? "frio")) ?? LEAD_TEMPERATURAS[0];

  const content = (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div
          ref={setActivatorNodeRef}
          {...dragAttributes}
          {...dragListeners}
          className="min-w-0 cursor-grab truncate text-sm font-semibold text-[color:var(--admin-cinza-1)] active:cursor-grabbing hover:text-[color:var(--admin-dourado)] transition-colors"
          title="Arrastar lead"
        >
          {lead.nome}
        </div>
        {!dragging && onDelete ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="text-[color:var(--admin-cinza-3)] hover:text-rose-300 transition-colors p-1 -m-1"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-md bg-[color:var(--admin-petroleo-soft)]/40 px-1.5 py-0.5 text-[10px] text-[color:var(--admin-cinza-2)] ring-1 ring-[color:var(--admin-borda)]"
          title={`Temperatura: ${temperatura.label}`}
        >
          {temperatura.emoji} {temperatura.label}
        </span>
        {score > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300 ring-1 ring-amber-500/20">
            <Flame className="h-3 w-3" /> {score}
          </span>
        )}
      </div>

      {lead.expedicao_interesse && (
        <div className="text-[11px] text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-dourado)]/5 border border-[color:var(--admin-dourado)]/10 rounded px-2 py-1 truncate">
          {lead.expedicao_interesse}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-2.5 w-2.5 ${
                i < nivel
                  ? "fill-[color:var(--admin-dourado)] text-[color:var(--admin-dourado)]"
                  : "text-[color:var(--admin-borda)]"
              }`}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-[color:var(--admin-cinza-3)]">
          {lead.protocolo ?? "—"}
        </span>
      </div>

      {lead.proxima_acao ? (
        <div className="border-t border-[color:var(--admin-borda)]/30 pt-2 text-[10px] text-amber-200/80 italic truncate" title={lead.proxima_acao}>
          → {lead.proxima_acao}
        </div>
      ) : null}

      {!dragging && ehReservaPendente && onConverter ? (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConverter();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 px-2 py-1.5 text-xs font-medium text-[color:var(--admin-dourado)] hover:bg-[color:var(--admin-dourado)]/20 transition-all"
        >
          <ArrowRight className="h-3.5 w-3.5" /> Converter em reserva
        </button>
      ) : null}

      {!dragging && (
        <Link
          to="/admin/leads/$id"
          params={{ id: lead.id }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="block w-full text-center text-[10px] text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado)] transition-colors mt-1 py-1"
        >
          Ver detalhes →
        </Link>
      )}
    </div>
  );

  return (
    <div className="group rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/90 p-3.5 transition-all duration-200 hover:border-[color:var(--admin-dourado)]/50 hover:shadow-[0_0_20px_-12px_rgba(212,175,55,0.3)]">
      {content}
    </div>
  );
}
