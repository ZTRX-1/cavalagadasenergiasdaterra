import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Upload, Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getMeuPerfil, atualizarMeuPerfil, uploadAvatar, CARGOS_EQUIPE } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const qc = useQueryClient();
  const { data: perfil } = useQuery({ queryKey: ["admin", "meu-perfil"], queryFn: getMeuPerfil });
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", bio: "", telefone: "", avatar_url: "" });

  useEffect(() => {
    if (perfil) setForm({
      nome: perfil.nome ?? "",
      cargo: perfil.cargo ?? "",
      bio: perfil.bio ?? "",
      telefone: perfil.telefone ?? "",
      avatar_url: perfil.avatar_url ?? "",
    });
  }, [perfil]);

  const saveMut = useMutation({
    mutationFn: () => atualizarMeuPerfil({
      nome: form.nome || null,
      cargo: form.cargo || null,
      bio: form.bio || null,
      telefone: form.telefone || null,
      avatar_url: form.avatar_url || null,
    }),
    onSuccess: () => { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const onPickFile = async (file: File) => {
    try {
      const url = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.success("Foto enviada — clique em Salvar para confirmar");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Conta" title="Meu perfil" description="Suas informações pessoais e cargo na equipe." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="admin-card text-center space-y-3">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="mx-auto h-32 w-32 rounded-full object-cover ring-2 ring-[color:var(--admin-dourado)]/40" />
          ) : (
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-3xl text-[color:var(--admin-dourado-glow)]">
              {(form.nome || perfil?.email || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
          <button className="admin-btn-ghost mx-auto" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Trocar foto
          </button>
          <p className="text-[11px] text-[color:var(--admin-cinza-3)]">JPG, PNG ou WebP · máx. 2 MB</p>
          {perfil?.role && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--admin-petroleo)] px-2 py-1 text-[11px] text-[color:var(--admin-dourado-glow)]">
              <Shield className="h-3 w-3" /> {perfil.role}
            </div>
          )}
        </div>

        <div className="admin-card space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome completo"><input className="admin-input w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
            <Field label="E-mail (somente leitura)"><input disabled className="admin-input w-full opacity-60" value={perfil?.email ?? ""} /></Field>
            <Field label="Cargo">
              <select className="admin-input w-full" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}>
                <option value="">—</option>
                {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Telefone"><input className="admin-input w-full" placeholder="+55 35 99999-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Biografia curta"><textarea className="admin-input w-full min-h-[120px]" placeholder="Conte um pouco sobre você, sua função e experiência." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="admin-btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              <Save className="h-4 w-4" /> Salvar perfil
            </button>
          </div>
        </div>
      </div>
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
