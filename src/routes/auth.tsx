import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — The Noticeboard, IIM Nagpur" },
      { name: "description", content: "Sign in to star notices and keep your own deadline tracker." },
      { property: "og:title", content: "Sign in — The Noticeboard" },
      { property: "og:description", content: "Sign in to star notices and keep your own deadline tracker." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      if (!email.trim().toLowerCase().endsWith("@iimnagpur.ac.in")) {
        toast.error("Sign-ups are only open to @iimnagpur.ac.in email addresses.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your inbox to confirm your email, then sign in.");
    }
    setBusy(false);
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { hd: "iimnagpur.ac.in", prompt: "select_account" },
    });
    if (res.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="border-2 border-foreground bg-card p-6">
          <h2 className="text-2xl">{mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Students: sign up with your @iimnagpur.ac.in email. Club desks: use the login you were given.</p>
          <button onClick={google} className="mt-5 w-full border-2 border-foreground bg-background py-2 font-semibold hover:bg-highlight">
            Continue with Google
          </button>
          <div className="my-4 text-center font-mono text-xs uppercase text-muted-foreground">— or —</div>
          <form onSubmit={submit} className="space-y-3">
            <input required type="email" placeholder="you@iimnagpur.ac.in" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
            <input required type="password" minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-foreground bg-background px-3 py-2 outline-none focus:border-urgent" />
            <button disabled={busy} className="w-full bg-foreground py-2 font-semibold text-background disabled:opacity-60">
              {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm underline">
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
