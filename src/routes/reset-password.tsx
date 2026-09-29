import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set your password — The Noticeboard, IIM Nagpur" },
      { name: "description", content: "Choose a new password for your Noticeboard account." },
      { property: "og:title", content: "Set your password — The Noticeboard" },
      { property: "og:description", content: "Choose a new password for your Noticeboard account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Password set. You're signed in."); navigate({ to: "/post" }); }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="border-2 border-foreground bg-card p-6">
          <h2 className="text-2xl">SET YOUR PASSWORD</h2>
          {!ready ? (
            <p className="mt-3 text-sm">Open this page from the link in your email. Links expire after a while — request a new one from the sign-in page if needed.</p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input required type="password" minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
              <input required type="password" minLength={8} placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
              <button disabled={busy} className="w-full bg-foreground py-2 font-semibold text-background disabled:opacity-60">
                {busy ? "Saving…" : "Save password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
