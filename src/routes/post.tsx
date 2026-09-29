import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { NoticeCard } from "@/components/NoticeCard";
import { fetchClubs, fetchMyClubId, fetchNotices, KIND_LABEL, type Notice } from "@/lib/board";

export const Route = createFileRoute("/post")({
  head: () => ({
    meta: [
      { title: "Club desk — Post notices | The Noticeboard, IIM Nagpur" },
      { name: "description", content: "Club logins post notices, deadlines, extensions and timelines for their club." },
      { property: "og:title", content: "Club desk — The Noticeboard" },
      { property: "og:description", content: "Where IIM Nagpur clubs post their notices and deadlines." },
    ],
  }),
  component: ClubDesk,
});

const empty = { kind: "notice" as Notice["kind"], title: "", body: "", due: "", link: "" };

function ClubDesk() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  const myClub = useQuery({ queryKey: ["myClub", user?.id], queryFn: fetchMyClubId, enabled: !!user });
  const clubs = useQuery({ queryKey: ["clubs"], queryFn: fetchClubs });
  const notices = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const club = clubs.data?.find((c) => c.id === myClub.data);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notices").insert({
        club_id: myClub.data!,
        kind: form.kind,
        title: form.title.trim(),
        body: form.body.trim(),
        due_at: form.due ? new Date(form.due).toISOString() : null,
        link: form.link.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Posted to the board");
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
  });

  let content: React.ReactNode;
  if (!ready || (user && myClub.isLoading)) content = <p className="font-mono text-sm">Checking your desk…</p>;
  else if (!user)
    content = (
      <Box>
        <p>Sign in with your club's login to post notices.</p>
        <Link to="/auth" className="mt-3 inline-block bg-foreground px-4 py-2 font-semibold text-background">Sign in</Link>
      </Box>
    );
  else if (!myClub.data)
    content = (
      <Box>
        <p>This account ({user.email}) isn't linked to any club. Only official club logins can post — you can still read and star everything on the board.</p>
      </Box>
    );
  else {
    const mine = (notices.data ?? []).filter((n) => n.club_id === myClub.data);
    const needsDate = form.kind !== "notice";
    content = (
      <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="space-y-3 border-2 border-foreground bg-card p-5"
        >
          <h2 className="text-2xl">POST FOR {club?.name.toUpperCase()}</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(KIND_LABEL) as Notice["kind"][]).map((k) => (
              <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })}
                className={`border-2 border-foreground px-3 py-1 font-mono text-xs uppercase ${form.kind === k ? "bg-foreground text-background" : ""}`}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <input required maxLength={140} placeholder="Headline" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
          <textarea rows={4} maxLength={2000} placeholder="Details" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
          <label className="block font-mono text-xs uppercase">
            {needsDate ? "Due date & time (required)" : "Date & time (optional)"}
            <input type="datetime-local" required={needsDate} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })}
              className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 font-sans normal-case outline-none focus:border-urgent" />
          </label>
          <input type="url" placeholder="Link (form, doc…) — optional" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
          <button disabled={create.isPending} className="w-full bg-urgent py-2 font-semibold text-urgent-foreground disabled:opacity-60">
            {create.isPending ? "Posting…" : "Pin to the board"}
          </button>
        </form>
        <div>
          <h2 className="mb-3 border-b-2 border-foreground pb-1 text-xl">YOUR POSTS ({mine.length})</h2>
          <div className="space-y-4">
            {mine.map((n) => (
              <NoticeCard key={n.id} notice={n} club={club} starred={false}
                actions={<button onClick={() => remove.mutate(n.id)} className="border-2 border-foreground px-3 py-1 text-xs font-semibold hover:bg-urgent hover:text-urgent-foreground">Remove</button>} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{content}</main>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md border-2 border-foreground bg-card p-6 text-sm">{children}</div>;
}
