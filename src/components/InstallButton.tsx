import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (evt) {
      await evt.prompt();
      await evt.userChoice;
      setEvt(null);
      setShowInstructions(false);
      return;
    }
    setShowInstructions((visible) => !visible);
  }

  return (
    <span className="relative inline-flex">
      <Button onClick={install} variant="ghost" size="sm" aria-expanded={showInstructions} className="text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground">
        Install app
      </Button>
      {showInstructions && (
        <span role="status" className="absolute right-0 top-full z-50 mt-2 w-64 border border-border bg-card p-3 text-left text-xs leading-relaxed text-card-foreground shadow-md">
          {/iphone|ipad|ipod/i.test(navigator.userAgent)
            ? "On iPhone: tap Share, then “Add to Home Screen”."
            : "Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”."}
        </span>
      )}
    </span>
  );
}
