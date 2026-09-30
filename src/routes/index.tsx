import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { NoticeCard } from "@/components/NoticeCard";
import { endOfTomorrow, fetchClubs, fetchNotices, fetchStars, KIND_LABEL, urgencyLevel, timeLeft, fmtDue, type Notice } from "@/lib/board";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Noticeboard — IIM Nagpur clubs, deadlines & extensions" },
      { name: "description", content: "Urgent deadlines for today and tomorrow, your starred tracker, and every club notice at IIM Nagpur." },
      { property: "og:title", content: "The Noticeboard — IIM Nagpur" },
      { property: "og:description", content: "Every club notice, deadline and extension at IIM Nagpur in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl border-x border-border bg-card xl:grid xl:min-h-[calc(100vh-85px)] xl:grid-cols-12">
        <aside className="border-b border-border bg-background/60 p-5 sm:p-6 xl:col-span-3 xl:border-b-0 xl:border-r">
          <SectionTitle label="Starred tracker" note={user ? `${starred.length}` : undefined} />
          {!user ? (
            <div className="border border-border bg-card p-4 text-sm">
              <p className="text-muted-foreground">Save important notices across your devices.</p>
              <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/auth">Sign in with your college email</Link></Button>
            </div>
          ) : starred.length === 0 ? (
            <p className="border border-border bg-card p-4 text-sm text-muted-foreground">Nothing starred yet — select the star on any notice.</p>
          ) : (
            <div className="border-t border-border">{starred.map((n) => card(n))}</div>
          )}
          <div className="mt-8">
            <SectionTitle label="Filters" />
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase text-muted-foreground">Clubs</p>
            <div className="flex flex-wrap gap-1.5">
            <Chip active={club === "all"} onClick={() => setClub("all")}>All clubs</Chip>
            {(clubs.data ?? []).map((c) => (
              <Chip key={c.id} active={club === c.id} onClick={() => setClub(c.id)}>{c.name}</Chip>
            ))}
            </div>
            <p className="mb-2 mt-5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">Notice type</p>
            <div className="flex flex-wrap gap-1.5">
            <Chip small active={kind === "all"} onClick={() => setKind("all")}>Everything</Chip>
            {Object.entries(KIND_LABEL).map(([k, l]) => (
              <Chip small key={k} active={kind === k} onClick={() => setKind(k)}>{l}</Chip>
            ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 xl:col-span-6">
          <div className="flex items-baseline justify-between border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-xl font-bold">All notices</h2>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{filtered.length} shown</span>
          </div>
          {notices.isLoading ? (
            <p className="p-6 font-mono text-sm">Loading the board…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No notices match these filters.</p>
          ) : (
            <div>{filtered.map((n) => card(n))}</div>
          )}
        </section>

        <aside className="border-t border-border bg-background/60 p-5 sm:p-6 xl:col-span-3 xl:border-l xl:border-t-0">
          <SectionTitle label="Approaching deadlines" note={`${urgent.length}`} />
          {urgent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines in the next two days.</p>
          ) : (
            <ol className="space-y-5">{urgent.map((n) => {
              if (!n.due_at) return null;
              const level = urgencyLevel(n.due_at);
              return <li key={n.id} className={cn("border-l-2 pl-4", level === "urgent" && "border-urgent", level === "warning" && "border-warning", level === "watch" && "border-watch")}>
                <p className={cn("font-mono text-[10px] font-semibold uppercase", level === "urgent" && "text-urgent", level === "warning" && "text-warning", level === "watch" && "text-watch-foreground")}>{timeLeft(n.due_at)}</p>
                <h3 className="mt-1 text-sm font-bold leading-snug">{n.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{clubById.get(n.club_id)?.name} · {fmtDue(n.due_at)}</p>
              </li>;
            })}</ol>
          )}
          <div className="mt-8 border-t border-border pt-5 font-mono text-[10px] uppercase text-muted-foreground">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-urgent" /> Immediate</div>
            <div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning" /> Later today</div>
            <div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-watch" /> Tomorrow</div>
          </div>
        </aside>
      </main>
      <footer className="border-t border-border py-5 text-center font-mono text-[10px] uppercase text-muted-foreground">
        Club secretaries: <Link to="/post" className="underline">post from the club desk</Link>
      </footer>
    </div>
  );
}

function SectionTitle({ label, note }: { label: string; note?: string | undefined }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="font-sans text-xs font-semibold uppercase text-muted-foreground">{label}</h2>
      {note && <span className="font-mono text-[10px] uppercase text-muted-foreground">{note}</span>}
    </div>
  );
}

function Chip({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto min-h-7 whitespace-normal px-2 py-1 text-left font-mono text-[10px] uppercase",
        small && "min-h-6",
      )}
    >
      {children}
    </Button>
  );
}
