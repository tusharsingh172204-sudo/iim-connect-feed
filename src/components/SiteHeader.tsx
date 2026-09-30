import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="min-w-0">
          <span className="block font-mono text-[10px] font-semibold uppercase text-muted-foreground">IIM Nagpur · {today}</span>
          <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">Student Noticeboard</h1>
        </Link>
        <nav className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm"><Link to="/post">Club desk</Link></Button>
          {user ? (
            <Button onClick={signOut} variant="ghost" size="sm">Sign out</Button>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
