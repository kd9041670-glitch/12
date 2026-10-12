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

- Backend is an existing external Supabase project accessed only via the publishable key in `src/lib/wasl.ts`; never create tables/migrations or use service_role — schema is owned outside this repo.
- `/dashboard` is client-only (`ssr: false`) and gates on Auth + `wasl_admins` membership; the triple-click logo is only navigation, not security.