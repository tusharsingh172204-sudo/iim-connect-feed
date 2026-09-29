import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="border-b-4 border-double border-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
        <span className="truncate">{today}</span>
        <nav className="flex items-center gap-3">
          <Link to="/post" className="hover:underline">Club desk</Link>
          {user ? (
            <button onClick={signOut} className="hover:underline">Sign out</button>
          ) : (
            <Link to="/auth" className="hover:underline">Sign in</Link>
          )}
        </nav>
      </div>
      <div className="border-t border-foreground">
        <Link to="/" className="mx-auto block max-w-6xl px-4 py-4 text-center">
          <h1 className="text-4xl leading-none sm:text-6xl md:text-7xl">THE NOTICEBOARD</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Indian Institute of Management Nagpur · All clubs · All deadlines
          </p>
        </Link>
      </div>
    </header>
  );
}
