import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCan } from "@/hooks/use-permissions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { 
  Users, Mail, Clock, CalendarDays, Shield, Send, 
  CheckCircle2, Archive, MessageSquare, ChevronRight, X, Lock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/equipe")({
  component: EquipePage,
});

type Membro = {
  user_id: string;
  nome: string | null;
  cargo: string | null;
  bio: string | null;
  avatar_url: string | null;
  especialidades: string[] | null;
  ultimo_login: string | null;
  created_at?: string;
};

type Mensagem = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  read: boolean;
  archived: boolean;
  created_at: string;
  sender?: { nome: string | null; avatar_url: string | null };
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function EquipePage() {
  const qc = useQueryClient();
  const { canView, role: userRole } = useCan("equipe");
  const { data: userData } = useQuery({ 
    queryKey: ["admin", "me"], 
    queryFn: async () => (await supabase.auth.getUser()).data.user 
  });
  const isMaster = userData?.id === "20b7839f-b3c3-494c-90df-515ba0a0de4f";

  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [abaMensagens, setAbaMensagens] = useState<"recebidas" | "enviadas">("recebidas");
  const [showNovoMsg, setShowNovoMsg] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: "", content: "" });

  const isDevOrSuper = userRole === "desenvolvedor" || userRole === "superadmin";

  // Retirado o bloqueio total para permitir o efeito de blur
  const showBlurOverlay = !canView || (!isDevOrSuper && !isMaster);

  const { data: membros, isLoading: loadingMembros } = useQuery({
    queryKey: ["admin", "equipe"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, bio, avatar_url, especialidades, ultimo_login, created_at");
      if (error) throw error;
      return (data || []) as Membro[];
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["admin", "user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const { data: mensagens, isLoading: loadingMensagens } = useQuery({
    queryKey: ["admin", "mensagens"],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from("internal_messages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar_url");

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (msgs || []).map(m => ({
        ...m,
        sender: profileMap.get(m.sender_id) ? {
          nome: profileMap.get(m.sender_id)!.nome,
          avatar_url: profileMap.get(m.sender_id)!.avatar_url
        } : undefined
      })) as Mensagem[];
    },
  });

  const sendMut = useMutation({
    mutationFn: async (recipientId: string) => {
      if (!currentUser) throw new Error("Não logado");
      const { error } = await supabase.from("internal_messages").insert({
        sender_id: currentUser.id,
        recipient_id: recipientId,
        subject: msgForm.subject,
        content: msgForm.content
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada!");
      setMsgForm({ subject: "", content: "" });
      setShowNovoMsg(false);
      qc.invalidateQueries({ queryKey: ["admin", "mensagens"] });
    },
    onError: (e) => toast.error(e.message)
  });

  const readMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_messages").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mensagens"] })
  });

  const archiveMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_messages").update({ archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem arquivada");
      qc.invalidateQueries({ queryKey: ["admin", "mensagens"] });
    }
  });

  const msgsRecebidas = mensagens?.filter(m => m.recipient_id === currentUser?.id && !m.archived) || [];
  const naoLidasCount = msgsRecebidas.filter(m => !m.read).length;

  const getStatus = (ultimoLogin: string | null) => {
    if (!ultimoLogin) return { label: "Offline", color: "bg-gray-500" };
    const diff = Date.now() - new Date(ultimoLogin).getTime();
    if (diff < 5 * 60 * 1000) return { label: "Online", color: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" };
    if (diff < 15 * 60 * 1000) return { label: "Ausente", color: "bg-amber-500" };
    return { label: "Offline", color: "bg-gray-500" };
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader
        eyebrow="Operação"
        title={
          <div className="flex items-center gap-3">
            <span>Equipe</span>
            {naoLidasCount > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse">
                {naoLidasCount}
              </span>
            )}
          </div>
        }
        description="Conecte-se com os membros da operação e gerencie comunicações internas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {!isDevOrSuper && !isMaster && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[color:var(--admin-carvao)]/60 backdrop-blur-md border border-white/5 shadow-2xl">
            <div className="max-w-md p-8 text-center bg-black/40 rounded-3xl border border-white/10 ring-1 ring-white/5">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-display text-[color:var(--admin-cinza-1)]">Módulo Protegido</h2>
              <p className="mt-4 text-sm text-[color:var(--admin-cinza-2)] leading-relaxed">
                Este módulo está em fase de implantação estratégica. 
                O acesso é restrito ao <span className="text-amber-400 font-semibold">Núcleo de Desenvolvimento</span>.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-[10px] uppercase tracking-widest text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Acesso Alfa
              </div>
            </div>
          </div>
        )}
        
        {/* Listagem de Membros */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingMembros
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-[color:var(--admin-petroleo)]/30 animate-pulse border border-[color:var(--admin-borda)]" />
                ))
              : membros?.map((m) => {
                  const status = getStatus(m.ultimo_login);
                  return (
                    <div
                      key={m.user_id}
                      onClick={() => setMembroSelecionado(m)}
                      className="group cursor-pointer relative overflow-hidden rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] p-5 transition-all hover:border-[color:var(--admin-dourado)]/40 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[color:var(--admin-petroleo)] ring-1 ring-[color:var(--admin-borda-strong)]">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt={m.nome || ""} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xl font-medium text-[color:var(--admin-dourado)]">
                              {m.nome?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[color:var(--admin-cinza-1)] truncate group-hover:text-[color:var(--admin-dourado)] transition-colors">
                            {m.nome}
                          </h3>
                          <p className="text-[10px] text-[color:var(--admin-dourado)] uppercase tracking-wider font-semibold mt-0.5 truncate">
                            {m.cargo}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={cn("inline-block h-2 w-2 rounded-full", status.color)} />
                            <span className="text-[10px] text-[color:var(--admin-cinza-3)] uppercase tracking-tight">{status.label}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-[13px] text-[color:var(--admin-cinza-2)] line-clamp-2 leading-relaxed h-10">
                        {m.bio}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {m.especialidades?.slice(0, 3).map((esp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[color:var(--admin-petroleo)] border border-[color:var(--admin-borda-strong)] text-[9px] text-[color:var(--admin-cinza-2)] uppercase tracking-tighter">
                            {esp}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Sistema de Mensagens */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] overflow-hidden">
            <div className="p-4 border-b border-[color:var(--admin-borda)] flex items-center justify-between bg-black/20">
              <h2 className="text-sm font-semibold text-[color:var(--admin-cinza-1)] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[color:var(--admin-dourado)]" />
                Mensagens Internas
              </h2>
              <div className="flex gap-1">
                <button 
                  onClick={() => setAbaMensagens("recebidas")}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] uppercase transition-colors",
                    abaMensagens === "recebidas" ? "bg-[color:var(--admin-dourado)] text-black font-bold" : "text-[color:var(--admin-cinza-3)] hover:text-white"
                  )}
                >
                  Recebidas
                </button>
                <button 
                  onClick={() => setAbaMensagens("enviadas")}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] uppercase transition-colors",
                    abaMensagens === "enviadas" ? "bg-[color:var(--admin-dourado)] text-black font-bold" : "text-[color:var(--admin-cinza-3)] hover:text-white"
                  )}
                >
                  Enviadas
                </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-[color:var(--admin-borda)]">
              {loadingMensagens ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 h-24 animate-pulse bg-white/5" />
                ))
              ) : msgsRecebidas.length === 0 && abaMensagens === "recebidas" ? (
                <div className="p-10 text-center text-[color:var(--admin-cinza-3)] italic text-sm">
                  Nenhuma mensagem recebida.
                </div>
              ) : abaMensagens === "enviadas" && mensagens?.filter(m => m.sender_id === currentUser?.id).length === 0 ? (
                <div className="p-10 text-center text-[color:var(--admin-cinza-3)] italic text-sm">
                  Nenhuma mensagem enviada.
                </div>
              ) : (
                (abaMensagens === "recebidas" ? msgsRecebidas : mensagens?.filter(m => m.sender_id === currentUser?.id))?.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "p-4 transition-colors relative group",
                      !msg.read && abaMensagens === "recebidas" ? "bg-[color:var(--admin-petroleo-soft)]/20" : "hover:bg-white/5"
                    )}
                  >
                    {!msg.read && abaMensagens === "recebidas" && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--admin-dourado)]" />
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/5">
                          {msg.sender?.avatar_url && <img src={msg.sender.avatar_url} className="h-full w-full object-cover" />}
                        </div>
                        <span className="text-[11px] font-medium text-[color:var(--admin-dourado)]">
                          {abaMensagens === "recebidas" ? msg.sender?.nome : "Para você"}
                        </span>
                      </div>
                      <span className="text-[9px] text-[color:var(--admin-cinza-3)] uppercase">{formatDateTime(msg.created_at)}</span>
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-[color:var(--admin-cinza-1)]">{msg.subject}</h4>
                    <p className="mt-1 text-xs text-[color:var(--admin-cinza-2)] line-clamp-2 leading-relaxed">{msg.content}</p>
                    
                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {abaMensagens === "recebidas" && !msg.read && (
                        <button 
                          onClick={() => readMut.mutate(msg.id)}
                          className="text-[9px] uppercase tracking-wider text-[color:var(--admin-dourado)] flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Marcar como lida
                        </button>
                      )}
                      <button 
                        onClick={() => archiveMut.mutate(msg.id)}
                        className="text-[9px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] hover:text-white flex items-center gap-1"
                      >
                        <Archive className="h-3 w-3" /> Arquivar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Perfil Interno */}
      {membroSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMembroSelecionado(null)} />
          <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden rounded-2xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] shadow-2xl">
            {/* Header / Capa */}
            <div className="h-32 bg-gradient-to-r from-[color:var(--admin-carvao)] to-[color:var(--admin-petroleo)] relative">
              <button 
                onClick={() => setMembroSelecionado(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8 -mt-12 relative">
              <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--admin-petroleo)] ring-4 ring-[color:var(--admin-carvao-deep)] shadow-2xl">
                  {membroSelecionado.avatar_url ? (
                    <img src={membroSelecionado.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-4xl font-medium text-[color:var(--admin-dourado)]">
                      {membroSelecionado.nome?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-display text-[color:var(--admin-cinza-1)]">{membroSelecionado.nome}</h2>
                  <p className="text-[color:var(--admin-dourado)] text-sm font-semibold uppercase tracking-widest mt-1">{membroSelecionado.cargo}</p>
                </div>
                <button 
                  onClick={() => setShowNovoMsg(true)}
                  className="mb-2 flex items-center gap-2 rounded-lg bg-[color:var(--admin-dourado)] px-4 py-2 text-xs font-bold text-black transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" /> ENVIAR MENSAGEM
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[color:var(--admin-cinza-3)] mb-2">Sobre</h4>
                    <p className="text-sm text-[color:var(--admin-cinza-2)] leading-relaxed whitespace-pre-line italic">
                      "{membroSelecionado.bio || "Este membro ainda não preencheu sua biografia."}"
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[color:var(--admin-cinza-3)] mb-3">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {membroSelecionado.especialidades?.map((esp, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--admin-petroleo)] border border-[color:var(--admin-borda-strong)] text-[11px] text-[color:var(--admin-cinza-1)]">
                          <CheckCircle2 className="h-3 w-3 text-[color:var(--admin-dourado)]" />
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-black/20 p-5 rounded-xl border border-[color:var(--admin-borda)]/30">
                  <div>
                    <h4 className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)] flex items-center gap-2 mb-3">
                      <Clock className="h-3 w-3" /> Metadados
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-[color:var(--admin-cinza-3)] uppercase mb-1">Status Atual</p>
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", getStatus(membroSelecionado.ultimo_login).color)} />
                          <span className="text-xs text-[color:var(--admin-cinza-1)]">{getStatus(membroSelecionado.ultimo_login).label}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-[color:var(--admin-cinza-3)] uppercase mb-1">Último Acesso</p>
                        <p className="text-xs text-[color:var(--admin-cinza-1)]">{formatDateTime(membroSelecionado.ultimo_login)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[color:var(--admin-cinza-3)] uppercase mb-1">Data de Entrada</p>
                        <p className="text-xs text-[color:var(--admin-cinza-1)]">{formatDateTime(membroSelecionado.created_at || null)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)] flex items-center gap-2 mb-3">
                      <Shield className="h-3 w-3" /> Governança
                    </h4>
                    <div className="rounded bg-[color:var(--admin-petroleo)] p-3 border border-[color:var(--admin-borda-strong)]">
                      <p className="text-[10px] text-[color:var(--admin-cinza-2)] uppercase leading-relaxed tracking-tighter">
                        Permissões vinculadas ao cargo de {membroSelecionado.cargo}. Acesso de nível operacional.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Mensagem */}
      {showNovoMsg && membroSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowNovoMsg(false)} />
          <div className="relative w-full max-w-md bg-[color:var(--admin-carvao-deep)] rounded-2xl border border-[color:var(--admin-borda)] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-[color:var(--admin-borda)] bg-black/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display text-[color:var(--admin-cinza-1)]">Nova Mensagem</h3>
                <p className="text-xs text-[color:var(--admin-cinza-3)] mt-0.5">Para: {membroSelecionado.nome}</p>
              </div>
              <button onClick={() => setShowNovoMsg(false)} className="text-[color:var(--admin-cinza-3)] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[color:var(--admin-cinza-3)]">Assunto</label>
                <input 
                  type="text" 
                  value={msgForm.subject}
                  onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Ex: Reunião de alinhamento"
                  className="w-full bg-black/30 border border-[color:var(--admin-borda)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[color:var(--admin-dourado)] transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[color:var(--admin-cinza-3)]">Mensagem</label>
                <textarea 
                  rows={5}
                  value={msgForm.content}
                  onChange={e => setMsgForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Escreva sua mensagem aqui..."
                  className="w-full bg-black/30 border border-[color:var(--admin-borda)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[color:var(--admin-dourado)] transition-colors resize-none"
                />
              </div>
              
              <button 
                disabled={sendMut.isPending || !msgForm.subject || !msgForm.content}
                onClick={() => sendMut.mutate(membroSelecionado.user_id)}
                className="w-full bg-[color:var(--admin-dourado)] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {sendMut.isPending ? "ENVIANDO..." : (
                  <>
                    <Send className="h-4 w-4" />
                    ENVIAR AGORA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
