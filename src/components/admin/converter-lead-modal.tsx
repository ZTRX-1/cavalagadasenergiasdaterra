import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Calendar, Users, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminField } from "@/components/admin/admin-section";
import {
  listExpedicoes,
  listDatas,
  converterLeadEmReserva,
  type LeadRow,
  type DataRow,
} from "@/lib/admin/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: LeadRow;
  onConverted?: () => void;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDateRange(inicio: string, fim: string) {
  try {
    const a = new Date(inicio + "T00:00:00");
    const b = new Date(fim + "T00:00:00");
    return `${a.toLocaleDateString("pt-BR")} → ${b.toLocaleDateString("pt-BR")}`;
  } catch {
    return `${inicio} → ${fim}`;
  }
}

export function ConverterLeadModal({ open, onOpenChange, lead, onConverted }: Props) {
  const nav = useNavigate();
  const { data: expedicoes = [] } = useQuery({
    queryKey: ["admin", "expedicoes"],
    queryFn: listExpedicoes,
  });

  // tenta pré-selecionar pela expedição de interesse
  const expedicaoPreselecionada = useMemo(() => {
    if (!lead.expedicao_interesse) return null;
    const alvo = lead.expedicao_interesse.toLowerCase().trim();
    return (
      expedicoes.find((e) => e.nome.toLowerCase().trim() === alvo) ??
      expedicoes.find((e) => e.nome.toLowerCase().includes(alvo)) ??
      null
    );
  }, [expedicoes, lead.expedicao_interesse]);

  const [expedicaoId, setExpedicaoId] = useState<string>("");
  const [dataId, setDataId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(Math.max(1, lead.quantidade_pessoas ?? 1));
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [observacoes, setObservacoes] = useState<string>("");

  useEffect(() => {
    if (open && expedicaoPreselecionada && !expedicaoId) {
      setExpedicaoId(expedicaoPreselecionada.id);
    }
  }, [open, expedicaoPreselecionada, expedicaoId]);

  const { data: datas = [] } = useQuery({
    queryKey: ["admin", "datas", expedicaoId],
    queryFn: () => listDatas(expedicaoId),
    enabled: !!expedicaoId,
  });

  // pré-seleciona próxima data disponível
  useEffect(() => {
    if (!dataId && datas.length > 0) {
      const proxima = datas.find((d) => d.status === "disponivel" && d.vagas_disponiveis > 0);
      if (proxima) setDataId(proxima.id);
    }
  }, [datas, dataId]);

  const dataSelecionada: DataRow | undefined = datas.find((d) => d.id === dataId);
  const precoUnitario =
    dataSelecionada?.preco_pix ??
    dataSelecionada?.preco_cartao ??
    expedicoes.find((e) => e.id === expedicaoId)?.preco ??
    0;
  const valorTotal = Number(precoUnitario) * quantidade;

  const mut = useMutation({
    mutationFn: () => {
      if (!expedicaoId) throw new Error("Selecione uma expedição.");
      if (!dataSelecionada) throw new Error("Selecione uma data.");
      const exp = expedicoes.find((e) => e.id === expedicaoId);
      if (!exp) throw new Error("Expedição inválida.");
      if (quantidade > dataSelecionada.vagas_disponiveis) {
        throw new Error(
          `Apenas ${dataSelecionada.vagas_disponiveis} vaga(s) disponível(is) nessa data.`,
        );
      }
      return converterLeadEmReserva(lead.id, {
        expedicao_id: expedicaoId,
        expedicao_nome: exp.nome,
        data_id: dataSelecionada.id,
        data_label: fmtDateRange(dataSelecionada.data_inicio, dataSelecionada.data_fim),
        quantidade_participantes: quantidade,
        preco_unitario: Number(precoUnitario),
        forma_pagamento: formaPagamento,
        observacoes: observacoes.trim() || null,
      });
    },
    onSuccess: (res) => {
      toast.success(`Reserva ${res.protocolo} criada.`);
      onConverted?.();
      onOpenChange(false);
      nav({ to: "/admin/reservas/$id", params: { id: res.reserva_id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const podeConfirmar =
    !!expedicaoId && !!dataId && quantidade >= 1 && Number(precoUnitario) > 0 && !mut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Converter em reserva</DialogTitle>
          <DialogDescription className="text-[color:var(--admin-cinza-3)]">
            Esse lead vira uma reserva com participantes prontos pra completar. O lead será movido para
            <strong className="text-[color:var(--admin-cinza-1)]">Reserva Pendente</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-3 text-sm">
          <div className="text-[color:var(--admin-cinza-1)] font-medium">{lead.nome}</div>
          <div className="text-[11px] text-[color:var(--admin-cinza-3)]">
            {lead.telefone ?? lead.email ?? "—"} · {lead.protocolo ?? "sem protocolo"}
          </div>
        </div>

        <div className="space-y-3">
          <AdminField label="Expedição">
            <select
              className="admin-input"
              value={expedicaoId}
              onChange={(e) => {
                setExpedicaoId(e.target.value);
                setDataId("");
              }}
            >
              <option value="">Selecione…</option>
              {expedicoes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField
            label="Data"
            hint={expedicaoId ? `${datas.length} data(s) disponível(is)` : "Selecione uma expedição primeiro"}
          >
            <select
              className="admin-input"
              value={dataId}
              onChange={(e) => setDataId(e.target.value)}
              disabled={!expedicaoId}
            >
              <option value="">Selecione…</option>
              {datas.map((d) => (
                <option key={d.id} value={d.id}>
                  {fmtDateRange(d.data_inicio, d.data_fim)} · {d.vagas_disponiveis}/{d.vagas_total} vagas
                  {d.status !== "disponivel" ? ` (${d.status})` : ""}
                </option>
              ))}
            </select>
          </AdminField>

          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Participantes" hint="Inclui o responsável">
              <input
                type="number"
                min={1}
                max={dataSelecionada?.vagas_disponiveis ?? 20}
                className="admin-input"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
              />
            </AdminField>
            <AdminField label="Forma de pagamento prevista">
              <select
                className="admin-input"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
              >
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="boleto">Boleto</option>
              </select>
            </AdminField>
          </div>

          <AdminField label="Observações (opcional)">
            <textarea
              className="admin-input min-h-[60px]"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Combinados, condições especiais, etc."
            />
          </AdminField>

          {dataSelecionada ? (
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-[color:var(--admin-dourado)]/20 bg-[color:var(--admin-dourado)]/5 p-3 text-sm">
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  <Calendar className="h-3 w-3" /> Data
                </div>
                <div className="text-[color:var(--admin-cinza-1)] mt-0.5">
                  {fmtDateRange(dataSelecionada.data_inicio, dataSelecionada.data_fim)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  <Users className="h-3 w-3" /> Vagas
                </div>
                <div className="text-[color:var(--admin-cinza-1)] mt-0.5">
                  {quantidade} × {fmtBRL(Number(precoUnitario))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  <Wallet className="h-3 w-3" /> Total
                </div>
                <div className="font-display text-[color:var(--admin-dourado)] mt-0.5">{fmtBRL(valorTotal)}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="admin-btn-ghost" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </button>
          <button
            className="admin-btn-primary"
            disabled={!podeConfirmar}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Convertendo…" : (
              <>
                Criar reserva <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
