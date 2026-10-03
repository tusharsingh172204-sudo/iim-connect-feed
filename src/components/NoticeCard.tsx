import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { KIND_LABEL, fmtDue, timeLeft, urgencyLevel, type Club, type Notice } from "@/lib/board";
import { Button } from "@/components/ui/button";

export function NoticeCard({
  notice, club, starred, onToggleStar, urgent, actions,
}: {
  notice: Notice;
  club?: Club | undefined;
  starred: boolean;
  onToggleStar?: () => void;
  urgent?: boolean | undefined;
  actions?: React.ReactNode;
}) {
  return (
    <article className={cn("group border-b border-border bg-card p-5 transition-colors hover:bg-background sm:p-6", urgent && notice.due_at && "border-l-2", urgent && notice.due_at && urgencyLevel(notice.due_at) === "urgent" && "border-l-urgent", urgent && notice.due_at && urgencyLevel(notice.due_at) === "warning" && "border-l-warning", urgent && notice.due_at && urgencyLevel(notice.due_at) === "watch" && "border-l-watch")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
          <span>{club?.name ?? "Club"}</span>
          <span aria-hidden="true">·</span>
          <span className={cn(
            "rounded-sm bg-muted px-1.5 py-0.5 text-foreground",
            notice.kind === "deadline" && "text-urgent",
            notice.kind === "extension" && "text-warning",
            notice.kind === "notice" && "text-success",
            notice.kind === "timeline" && "text-info",
          )}>{KIND_LABEL[notice.kind]}</span>
        </div>
        {onToggleStar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleStar}
            aria-label={starred ? "Remove from my tracker" : "Add to my tracker"}
            className="-m-2 h-8 w-8"
          >
            <Star className={cn(starred ? "fill-watch text-watch" : "text-muted-foreground")} />
          </Button>
        )}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug sm:text-xl">{notice.title}</h3>
      {notice.body && <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{notice.body}</p>}
      {notice.link && (
        <a href={notice.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-info underline">
          Open link →
        </a>
      )}
      {notice.due_at && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[11px]">
          <span>Due {fmtDue(notice.due_at)}</span>
          <span className={cn("font-semibold", urgent && urgencyLevel(notice.due_at) === "urgent" && "text-urgent", urgent && urgencyLevel(notice.due_at) === "warning" && "text-warning", urgent && urgencyLevel(notice.due_at) === "watch" && "text-watch-foreground")}>
            {timeLeft(notice.due_at)}
          </span>
        </div>
      )}
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </article>
  );
}
