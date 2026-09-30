import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set your password — The Noticeboard, IIM Nagpur" },
      { name: "description", content: "Choose a new password for your Noticeboard account." },
      { property: "og:title", content: "Set your password — The Noticeboard" },
      { property: "og:description", content: "Choose a new password for your Noticeboard account." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <div className="border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Set your password</h2>
          {!ready ? (
            <p className="mt-3 text-sm">Open this page from the link in your email. Links expire after a while — request a new one from the sign-in page if needed.</p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input required type="password" minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-1 focus:ring-ring" />
              <input required type="password" minLength={8} placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-1 focus:ring-ring" />
              <Button disabled={busy} className="w-full">
                {busy ? "Saving…" : "Save password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
