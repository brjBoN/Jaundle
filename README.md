# Daily Game Lab — Hidden Picture Crossword Starter

This version of the starter swaps the old trivia prototype for a custom crossword game with these rules:

- every word starts with one visible image clue
- revealing additional images lowers the score for that word
- the crossword grid is invisible at the start
- solving a word reveals that word's boxes and letters on the board

## What changed in this Supabase-ready version

- the app can now load today's challenge from Supabase
- a published archive page is included
- the project falls back to `data/mock.ts` until your Supabase table is ready
- `.env.example`, `supabase/schema.sql`, and `supabase/seed.sql` were added

## Main files to study

- `data/mock.ts` — local fallback puzzle content
- `lib/challenges.ts` — challenge fetching and Supabase fallback logic
- `lib/supabase/server.ts` — Supabase client setup
- `app/games/[slug]/archive/` — archive list and archive play pages
- `components/picture-crossword-game.tsx` — the main playable game
- `public/clues/` — sample SVG clue images

## Supabase setup

1. Copy `.env.example` to `.env.local`
2. Put in your publishable key from Supabase
3. In the Supabase SQL editor, run `supabase/schema.sql`
4. Insert at least one row with either the table editor or `supabase/seed.sql`
5. Run `npm install`
6. Run `npm run dev`

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wczlnqlmwbthbxglsmxw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-your-publishable-key
```

## Notes

- If Supabase is not configured yet, the app still works from `data/mock.ts`
- Public reads only work for rows where `status = 'published'`
- The archive page will show your mock challenge until you add database rows
