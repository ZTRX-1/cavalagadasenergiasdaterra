import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/leads")({
  component: () => (
    <AdminPlaceholder
      icon={Sparkles}
      titulo="Leads"
      descricao="Funil completo de captação — origem, qualificação, status e histórico de cada contato interessado em expedições."
    />
  ),
});
