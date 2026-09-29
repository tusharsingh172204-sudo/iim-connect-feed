import { supabase } from "@/integrations/supabase/client";

export type Club = { id: string; slug: string; name: string; tagline: string };
export type Notice = {
  id: string;
  club_id: string;
  kind: "notice" | "deadline" | "extension" | "timeline";
  title: string;
  body: string;
  due_at: string | null;
  link: string | null;
  created_at: string;
};

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from("clubs").select("id,slug,name,tagline").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("id,club_id,kind,title,body,due_at,link,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notice[];
}

export async function fetchStars(): Promise<string[]> {
  const { data, error } = await supabase.from("stars").select("notice_id");
  if (error) throw error;
  return (data ?? []).map((r) => r.notice_id);
}

export async function fetchMyClubId(): Promise<string | null> {
  const { data } = await supabase.from("club_logins").select("club_id").maybeSingle();
  return data?.club_id ?? null;
}

export const KIND_LABEL: Record<Notice["kind"], string> = {
  notice: "Notice",
  deadline: "Deadline",
  extension: "Extension",
  timeline: "Timeline",
};

export function endOfTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Closed";
  const h = Math.floor(ms / 3.6e6);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 6e4))}m left`;
  if (h < 48) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

export function fmtDue(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
