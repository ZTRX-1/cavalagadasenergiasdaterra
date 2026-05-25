import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listReservas, updatePagamento, type ReservaRow } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const qc = useQueryClient();
  const { data: reservas = [], isLoading } = useQuery({ queryKey: ["admin", "reservas"], queryFn: listReservas });
  const [edit, setEdit] = useState<ReservaRow | null>(null);

  const confirmados = reservas.filter((r) => r.status_pagamento === "confirmado");
  const pendentes = reservas.filter((r) => r.status_pagamento !== "confirmado");

  const totalConfirmado = confirmados.reduce((s, r) => s + (Number(r.valor_pago) || 0), 0);
  const totalEstimado = reservas.reduce((s, r) => s + (Number(r.valor_total) || 0), 0);
  const totalPendente = pendentes.reduce((s, r) => s + ((Number(r.valor_total) || 0) - (Number(r.valor_pago) || 0)), 0);

  const porExpedicao = Object.entries(
    reservas.reduce<Record<string, number>>((acc, r) => {
      const key = r.expedicao_nome || "Outros";
      acc[key] = (acc[key] || 0) + (Number(r.valor_pago) || 0);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Operação" title="Financeiro" description="Acompanhe pagamentos, faturamento e expedições mais lucrativas." />

      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Faturamento confirmado" value={`R$ ${totalConfirmado.toLocaleString("pt-BR")}`} accent />
        <KPI label="Faturamento estimado" value={`R$ ${totalEstimado.toLocaleString("pt-BR")}`} />
        <KPI label="Pagamentos pendentes" value={`R$ ${totalPendente.toLocaleString("pt-BR")}`} />
      </div>

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : reservas.length === 0 ? (
        <AdminEmpty icon={Wallet} titulo="Nenhuma reserva ainda" descricao="As reservas confirmadas pelo site aparecerão aqui automaticamente." />
      ) : (
        <>
          <AdminSection titulo="Top expedições por receita">
            <div className="space-y-2">
              {porExpedicao.map(([nome, v]) => (
                <div key={nome} className="flex items-center justify-between rounded-md border border-[color:var(--admin-borda)] p-3">
                  <span className="text-sm text-[color:var(--admin-cinza-1)] truncate">{nome}</span>
                  <span className="text-sm font-medium text-[color:var(--admin-dourado)]">R$ {v.toLocaleString("pt-BR")}</span>
                </div>
              ))}
              {porExpedicao.length === 0 ? <p className="text-sm text-[color:var(--admin-cinza-3)]">Sem dados.</p> : null}
            </div>
          </AdminSection>

          <AdminSection titulo="Reservas">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  <tr>
                    <th className="py-2 font-medium">Protocolo</th>
                    <th className="py-2 font-medium">Expedição</th>
                    <th className="py-2 font-medium">Data</th>
                    <th className="py-2 font-medium">Pessoas</th>
                    <th className="py-2 font-medium">Valor</th>
                    <th className="py-2 font-medium">Pago</th>
                    <th className="py-2 font-medium">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id} className="border-t border-[color:var(--admin-borda)]">
                      <td className="py-3 font-mono text-xs text-[color:var(--admin-cinza-2)]">{r.protocolo}</td>
                      <td className="py-3 text-[color:var(--admin-cinza-1)] truncate max-w-[200px]">{r.expedicao_nome}</td>
                      <td className="py-3 text-[color:var(--admin-cinza-2)]">{r.data_label}</td>
                      <td className="py-3 text-[color:var(--admin-cinza-2)]">{r.quantidade_participantes}</td>
                      <td className="py-3 text-[color:var(--admin-cinza-2)]">R$ {Number(r.valor_total ?? 0).toLocaleString("pt-BR")}</td>
                      <td className="py-3 text-[color:var(--admin-cinza-2)]">R$ {Number(r.valor_pago).toLocaleString("pt-BR")}</td>
                      <td className="py-3"><StatusBadge status={r.status_pagamento} /></td>
                      <td className="py-3 text-right"><button className="admin-btn-ghost px-3 py-1" onClick={() => setEdit(r)}>Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>
        </>
      )}

      {edit ? <PagamentoDialog reserva={edit} onClose={() => setEdit(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "reservas"] })} /> : null}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="admin-card p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">{label}</div>
      <div className={`mt-2 font-display text-3xl ${accent ? "text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-1)]"}`}>{value}</div>
    </div>
  );
}

function PagamentoDialog({ reserva, onClose, onSaved }: { reserva: ReservaRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    valor_total: reserva.valor_total ?? 0,
    valor_pago: reserva.valor_pago ?? 0,
    forma_pagamento: reserva.forma_pagamento ?? "pix",
    parcelas: reserva.parcelas ?? 1,
    status_pagamento: reserva.status_pagamento ?? "pendente",
  });
  const mut = useMutation({
    mutationFn: () => updatePagamento(reserva.id, form as never),
    onSuccess: () => { toast.success("Pagamento atualizado"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)]">
        <DialogHeader><DialogTitle className="font-display text-2xl">{reserva.protocolo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--admin-cinza-2)]">{reserva.expedicao_nome} · {reserva.data_label}</p>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Valor total"><input type="number" className="admin-input" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })} /></AdminField>
            <AdminField label="Valor pago"><input type="number" className="admin-input" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Forma">
              <select className="admin-input" value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </select>
            </AdminField>
            <AdminField label="Parcelas"><input type="number" className="admin-input" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })} /></AdminField>
          </div>
          <AdminField label="Status do pagamento">
            <select className="admin-input" value={form.status_pagamento} onChange={(e) => setForm({ ...form, status_pagamento: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
