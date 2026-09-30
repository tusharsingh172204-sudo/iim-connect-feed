<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Club posting rights come from `club_logins` (email -> club) checked by `my_club_id()` in RLS; why: shared club logins, no client-side trust.
- Deadline emphasis is derived from remaining time as red (within 6h), orange (within 24h), and amber (tomorrow); why: urgency stays consistent across every view.
