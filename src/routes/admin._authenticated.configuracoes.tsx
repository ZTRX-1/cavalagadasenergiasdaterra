import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/configuracoes")({
  component: () => (
    <AdminPlaceholder
      icon={Settings}
      titulo="Configurações"
      descricao="Equipe interna, papéis e permissões, integrações, identidade visual do painel e preferências da operação."
    />
  ),
});
