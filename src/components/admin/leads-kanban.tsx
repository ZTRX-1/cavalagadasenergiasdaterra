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
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { LEAD_ETAPAS, LEAD_TEMPERATURAS, type LeadEtapaId, type LeadRow } from "@/lib/admin/api";

type Props = {
  leads: LeadRow[];
  onMove: (id: string, etapa: LeadEtapaId) => void;
  onDelete: (lead: LeadRow) => void;
  onConverter: (lead: LeadRow) => void;
};

export function LeadsKanban({ leads, onMove, onDelete, onConverter }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped: Record<LeadEtapaId, LeadRow[]> = useMemo(() => {
    // Regra de Auditoria: Leads abandonados (status incompleto) são ocultados do CRM operacional
    const filteredLeads = leads.filter(l => l.status !== "incompleto");
    
    return LEAD_ETAPAS.reduce((acc, s) => {
      acc[s.id] = filteredLeads.filter((l) => (l.etapa_atendimento ?? "novo") === s.id);
      return acc;
    }, {} as Record<LeadEtapaId, LeadRow[]>);
  }, [leads]);

  const active = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const etapa = String(overId) as LeadEtapaId;
    const lead = leads.find((l) => l.id === e.active.id);
    if (!lead || lead.etapa_atendimento === etapa) return;
    if (!LEAD_ETAPAS.some((s) => s.id === etapa)) return;
    onMove(lead.id, etapa);
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
        style={{ gridTemplateColumns: `repeat(${LEAD_ETAPAS.length - 1}, minmax(260px, 1fr))` }}
      >
        {LEAD_ETAPAS.filter(s => s.id !== "incompleto").map((s) => (
          <KanbanColumn
            key={s.id}
            id={s.id}
            label={s.label}
            descricao={s.descricao}
            leads={grouped[s.id] || []}
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
  label,
  descricao,
  leads,
  onDelete,
  onConverter,
}: {
  id: LeadEtapaId;
  label: string;
  descricao: string;
  leads: LeadRow[];
  onDelete: (l: LeadRow) => void;
  onConverter: (l: LeadRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`admin-card flex min-h-[400px] flex-col p-3 transition ${
        isOver ? "ring-2 ring-[color:var(--admin-dourado)]/60" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={id} />
          <span className="text-[10px] text-[color:var(--admin-cinza-3)]">{descricao}</span>
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
  const ehProntoReserva = lead.etapa_atendimento === "pronto_reserva";
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

      <div className="flex flex-col gap-1 border-t border-[color:var(--admin-borda)]/30 pt-2 text-[10px] text-[color:var(--admin-cinza-3)]">
        <div className="flex justify-between items-center">
          <span>Última interação:</span>
          <span>{lead.ultima_interacao_at ? new Date(lead.ultima_interacao_at).toLocaleDateString("pt-BR") : "—"}</span>
        </div>
        {lead.proxima_acao && (
          <div className="text-amber-200/80 italic truncate" title={lead.proxima_acao}>
            → {lead.proxima_acao}
          </div>
        )}
      </div>

      {!dragging && ehProntoReserva && onConverter ? (
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
