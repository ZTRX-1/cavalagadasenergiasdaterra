import { supabase } from "@/integrations/supabase/client";

export type AnalyticsRange = { from: string; to: string };

function classifyReferrer(ref: string | null): string {
  if (!ref) return "Direto";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (h.includes("google")) return "Google";
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("facebook") || h.includes("fb.com")) return "Facebook";
    if (h.includes("whatsapp") || h.includes("wa.me")) return "WhatsApp";
    if (h.includes("youtube")) return "YouTube";
    if (h.includes("bing")) return "Bing";
    if (h.includes("tiktok")) return "TikTok";
    return h;
  } catch {
    return "Outros";
  }
}

export async function fetchAnalytics(range: AnalyticsRange) {
  const { data, error } = await supabase
    .from("page_views")
    .select("path, referrer, session_id, created_at")
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .limit(10000);
  if (error) throw error;
  const rows = data ?? [];
  const sessions = new Set<string>();
  const pageMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  for (const r of rows) {
    if (r.session_id) sessions.add(r.session_id);
    pageMap.set(r.path, (pageMap.get(r.path) ?? 0) + 1);
    const src = classifyReferrer(r.referrer);
    sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    const dia = r.created_at.slice(0, 10);
    dayMap.set(dia, (dayMap.get(dia) ?? 0) + 1);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  const sources = Array.from(sourceMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const series = Array.from(dayMap.entries())
    .map(([dia, views]) => ({ dia, views }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
  return {
    visitas: rows.length,
    sessoes: sessions.size,
    topPages,
    sources,
    series,
  };
}
