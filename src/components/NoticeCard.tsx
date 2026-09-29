import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { KIND_LABEL, fmtDue, timeLeft, type Club, type Notice } from "@/lib/board";

export function NoticeCard({
  notice, club, starred, onToggleStar, urgent, actions,
}: {
  notice: Notice;
  club?: Club;
  starred: boolean;
  onToggleStar?: () => void;
  urgent?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <article className={cn("border-2 border-foreground bg-card p-4", urgent && "border-urgent")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
          <span className="bg-foreground px-1.5 py-0.5 text-background">{club?.name ?? "Club"}</span>
          <span className={cn(
            "border border-foreground px-1.5 py-0.5",
            notice.kind === "deadline" && "border-urgent text-urgent",
            notice.kind === "extension" && "bg-highlight",
          )}>{KIND_LABEL[notice.kind]}</span>
        </div>
        {onToggleStar && (
          <button
            onClick={onToggleStar}
            aria-label={starred ? "Remove from my tracker" : "Add to my tracker"}
            className="-m-1 p-1"
          >
            <Star className={cn("h-5 w-5", starred ? "fill-urgent text-urgent" : "text-foreground")} />
          </button>
        )}
      </div>
      <h3 className="mt-3 text-lg leading-tight sm:text-xl">{notice.title}</h3>
      {notice.body && <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{notice.body}</p>}
      {notice.link && (
        <a href={notice.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold underline">
          Open link →
        </a>
      )}
      {notice.due_at && (
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-foreground pt-2 font-mono text-xs">
          <span>Due {fmtDue(notice.due_at)}</span>
          <span className={cn("font-semibold", urgent && "bg-urgent px-1.5 text-urgent-foreground")}>
            {timeLeft(notice.due_at)}
          </span>
        </div>
      )}
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </article>
  );
}
