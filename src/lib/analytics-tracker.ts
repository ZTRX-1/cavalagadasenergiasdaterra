import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  try {
    const KEY = "cet_session_id";
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

let lastTracked: string | null = null;

export async function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin")) return;
  if (lastTracked === path) return;
  lastTracked = path;
  try {
    await supabase.from("page_views").insert({
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    });
  } catch {
    // silencioso — analytics não pode quebrar o site
  }
}
