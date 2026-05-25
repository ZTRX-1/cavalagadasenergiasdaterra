import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Building2, Users, Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getConfiguracoes, saveConfiguracoes, listUsuariosInternos } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { data: config } = useQuery({ queryKey: ["admin", "configuracoes"], queryFn: getConfiguracoes });
  const { data: usuarios = [] } = useQuery({ queryKey: ["admin", "usuarios-internos"], queryFn: listUsuariosInternos });

  const [aba, setAba] = useState<"empresa" | "usuarios">("empresa");
  const [form, setForm] = useState({
    empresa_nome: "",
    empresa_cnpj: "",
    endereco: "",
    email: "",
    whatsapp: "",
    instagram: "",
    logo_url: "",
    cor_destaque: "",
    emails_str: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        empresa_nome: config.empresa_nome ?? "",
        empresa_cnpj: config.empresa_cnpj ?? "",
        endereco: config.endereco ?? "",
        email: config.email ?? "",
        whatsapp: config.whatsapp ?? "",
        instagram: config.instagram ?? "",
        logo_url: config.logo_url ?? "",
        cor_destaque: config.cor_destaque ?? "",
        emails_str: (config.emails_notificacao ?? []).join(", "),
      });
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () => saveConfiguracoes({
      empresa_nome: form.empresa_nome || null,
      empresa_cnpj: form.empresa_cnpj || null,
      endereco: form.endereco || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      instagram: form.instagram || null,
      logo_url: form.logo_url || null,
      cor_destaque: form.cor_destaque || null,
      emails_notificacao: form.emails_str.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["admin", "configuracoes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Configurações"
        description="Dados da empresa, canais de comunicação, identidade visual e equipe interna."
      />

      <div className="mb-4 flex gap-2 border-b border-[color:var(--admin-borda)]">
        <button
          onClick={() => setAba("empresa")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${aba === "empresa" ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]" : "border-transparent text-[color:var(--admin-cinza-3)]"}`}
        >
          <Building2 className="h-4 w-4" /> Empresa
        </button>
        <button
          onClick={() => setAba("usuarios")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${aba === "usuarios" ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]" : "border-transparent text-[color:var(--admin-cinza-3)]"}`}
        >
          <Users className="h-4 w-4" /> Usuários internos
        </button>
      </div>

      {aba === "empresa" ? (
        <div className="admin-card space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome da empresa">
              <input className="admin-input w-full" value={form.empresa_nome} onChange={(e) => setForm({ ...form, empresa_nome: e.target.value })} />
            </Field>
            <Field label="CNPJ">
              <input className="admin-input w-full" value={form.empresa_cnpj} onChange={(e) => setForm({ ...form, empresa_cnpj: e.target.value })} />
            </Field>
            <Field label="WhatsApp oficial">
              <input className="admin-input w-full" placeholder="+55 35 99999-0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </Field>
            <Field label="Instagram">
              <input className="admin-input w-full" placeholder="@cavalgadas" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </Field>
            <Field label="E-mail oficial">
              <input className="admin-input w-full" placeholder="contato@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Logo (URL)">
              <input className="admin-input w-full" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </Field>
            <Field label="Cor de destaque (hex)">
              <input className="admin-input w-full" placeholder="#C9A84C" value={form.cor_destaque} onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Endereço">
                <input className="admin-input w-full" placeholder="Rua, número, cidade — UF" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="E-mails de notificação (separados por vírgula)">
                <input className="admin-input w-full" placeholder="operacao@empresa.com, financeiro@empresa.com" value={form.emails_str} onChange={(e) => setForm({ ...form, emails_str: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              <Save className="h-4 w-4" /> Salvar configurações
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-left text-sm min-w-[520px]">
            <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Usuário</th>
                <th className="px-3 py-3.5 font-medium">Cargo</th>
                <th className="px-3 py-3.5 font-medium">Papel</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-[color:var(--admin-cinza-3)]">Nenhum usuário interno cadastrado.</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.user_id} className="border-t border-[color:var(--admin-borda)]">
                  <td className="px-5 py-4 text-[color:var(--admin-cinza-1)]">{u.nome ?? "Sem nome"}</td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{u.cargo ?? "—"}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--admin-petroleo)] px-2 py-1 text-[11px] text-[color:var(--admin-dourado-glow)]">
                      <Shield className="h-3 w-3" /> {u.role ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
