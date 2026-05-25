import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/financeiro")({
  component: () => (
    <AdminPlaceholder
      icon={Wallet}
      titulo="Financeiro"
      descricao="Controle de pagamentos, recebimentos por expedição, conciliação Pix / cartão e projeções de faturamento."
    />
  ),
});
