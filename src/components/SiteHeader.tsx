import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import iimNagpurLogo from "@/assets/iim-nagpur-logo.png.asset.json";
import { InstallButton } from "@/components/InstallButton";

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
    <header className="border-b-4 border-success bg-brand text-brand-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-card p-1 sm:h-20 sm:w-20">
            <img src={iimNagpurLogo.url} alt="IIM Nagpur" className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[9px] font-semibold uppercase text-brand-foreground/70 sm:text-[10px]">IIM Nagpur · {today}</span>
            <h1 className="mt-1 text-lg font-bold leading-tight sm:text-3xl">Student Noticeboard</h1>
          </span>
        </Link>
        <nav className="col-span-2 flex min-w-0 items-center justify-end gap-1.5 sm:col-span-1 sm:gap-2">
          <InstallButton />
          <Button asChild size="sm" className="bg-success text-success-foreground hover:bg-success/90"><Link to="/post">Club desk</Link></Button>
          {user ? (
            <Button onClick={signOut} variant="ghost" size="sm" className="text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground">Sign out</Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"><Link to="/auth">Sign in</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
