import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { NoticeCard } from "@/components/NoticeCard";
import { endOfTomorrow, fetchClubs, fetchNotices, fetchStars, KIND_LABEL, type Notice } from "@/lib/board";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Noticeboard — IIM Nagpur clubs, deadlines & extensions" },
      { name: "description", content: "Urgent deadlines for today and tomorrow, your starred tracker, and every club notice at IIM Nagpur." },
      { property: "og:title", content: "The Noticeboard — IIM Nagpur" },
      { property: "og:description", content: "Every club notice, deadline and extension at IIM Nagpur in one place." },
    ],
  }),
  component: Board,
});

function Board() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [club, setClub] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const clubs = useQuery({ queryKey: ["clubs"], queryFn: fetchClubs });
  const notices = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const stars = useQuery({ queryKey: ["stars", user?.id], queryFn: fetchStars, enabled: !!user });

  const starSet = useMemo(() => new Set(stars.data ?? []), [stars.data]);
  const clubById = useMemo(() => new Map((clubs.data ?? []).map((c) => [c.id, c])), [clubs.data]);

  const toggle = useMutation({
    mutationFn: async (n: Notice) => {
      if (starSet.has(n.id)) {
        const { error } = await supabase.from("stars").delete().eq("notice_id", n.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stars").insert({ notice_id: n.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stars"] }),
    onError: () => toast.error("Couldn't update your tracker"),
  });

  function onStar(n: Notice) {
    if (!user) {
      toast("Sign in with your college email to star notices", {
        action: { label: "Sign in", onClick: () => (window.location.href = "/auth") },
      });
      return;
    }
    if (!user.email?.toLowerCase().endsWith("@iimnagpur.ac.in")) {
      toast.error("Starring is for @iimnagpur.ac.in accounts only.");
      return;
    }
    toggle.mutate(n);
  }

  const all = notices.data ?? [];
  const now = Date.now();
  const limit = endOfTomorrow().getTime();
  const urgent = all
    .filter((n) => n.due_at && new Date(n.due_at).getTime() >= now && new Date(n.due_at).getTime() <= limit)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  const starred = all
    .filter((n) => starSet.has(n.id))
    .sort((a, b) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity));
  const filtered = all.filter((n) => (club === "all" || n.club_id === club) && (kind === "all" || n.kind === kind));

  const card = (n: Notice, isUrgent = false) => (
    <NoticeCard key={n.id} notice={n} club={clubById.get(n.club_id)} starred={starSet.has(n.id)} onToggleStar={() => onStar(n)} urgent={isUrgent} />
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Starred tracker */}
        <section className="mb-8">
          <SectionTitle label="My tracker" note={user ? `${starred.length} starred` : "Sign in to star"} />
          {!user ? (
            <div className="border-2 border-dashed border-foreground p-4 text-sm">
              Star the notices that matter to you and they'll be waiting here every time you open the board.{" "}
              <Link to="/auth" className="font-semibold underline">Sign in with your college email</Link>
            </div>
          ) : starred.length === 0 ? (
            <p className="border-2 border-dashed border-foreground p-4 text-sm">Nothing starred yet — tap the ☆ on any notice below.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{starred.map((n) => card(n))}</div>
          )}
        </section>

        {/* Urgent */}
        <section className="mb-8">
          <div className="mb-3 flex items-baseline justify-between bg-urgent px-3 py-2 text-urgent-foreground">
            <h2 className="text-xl sm:text-2xl">DUE TODAY & TOMORROW</h2>
            <span className="font-mono text-xs uppercase">{urgent.length} closing soon</span>
          </div>
          {urgent.length === 0 ? (
            <p className="border-2 border-dashed border-foreground p-4 text-sm">No deadlines in the next two days. Breathe.</p>
          ) : (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{urgent.map((n) => <li key={n.id}>{card(n, true)}</li>)}</ol>
          )}
        </section>

        {/* All notices */}
        <section>
          <SectionTitle label="All notices" note={`${filtered.length} shown`} />
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <Chip active={club === "all"} onClick={() => setClub("all")}>All clubs</Chip>
            {(clubs.data ?? []).map((c) => (
              <Chip key={c.id} active={club === c.id} onClick={() => setClub(c.id)}>{c.name}</Chip>
            ))}
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Chip small active={kind === "all"} onClick={() => setKind("all")}>Everything</Chip>
            {Object.entries(KIND_LABEL).map(([k, l]) => (
              <Chip small key={k} active={kind === k} onClick={() => setKind(k)}>{l}</Chip>
            ))}
          </div>
          {notices.isLoading ? (
            <p className="font-mono text-sm">Loading the board…</p>
          ) : filtered.length === 0 ? (
            <p className="border-2 border-dashed border-foreground p-4 text-sm">No notices here yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((n) => card(n))}</div>
          )}
        </section>
      </main>
      <footer className="mt-10 border-t-4 border-double border-foreground py-4 text-center font-mono text-[11px] uppercase tracking-wider">
        Club secretaries: <Link to="/post" className="underline">post from the club desk</Link>
      </footer>
    </div>
  );
}

function SectionTitle({ label, note }: { label: string; note?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b-2 border-foreground pb-1">
      <h2 className="text-xl uppercase sm:text-2xl">{label}</h2>
      {note && <span className="font-mono text-xs uppercase text-muted-foreground">{note}</span>}
    </div>
  );
}

function Chip({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 border-2 border-foreground font-mono uppercase tracking-wider transition-colors",
        small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs font-semibold",
        active ? "bg-foreground text-background" : "bg-card hover:bg-highlight",
      )}
    >
      {children}
    </button>
  );
}
