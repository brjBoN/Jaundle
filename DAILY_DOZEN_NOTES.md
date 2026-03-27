# Daily Dozen game notes

## Where to edit the mock/fallback version

Open `data/mock.ts` and look for the `daily-dozen` challenge.

The structure is:

```ts
 dailyDozen: {
   pointsPerQuestion: 1,
   questions: [
     {
       id: 'dd-1',
       category: 'Movies',
       prompt: 'Your question here',
       answers: ['Accepted answer 1', 'Accepted answer 2'],
       hint: 'Optional hint',
     },
   ],
 }
```

- Change `category` to whatever category title you want.
- Change `prompt` to the question text.
- Put every accepted answer in the `answers` array.
- Add or remove objects in `questions` to use any number of categories.

## Where to edit the live Supabase version

Use the same JSON shape in the `payload` column for rows where:

- `slug = 'daily-dozen'`
- `type = 'daily-dozen'`

You can copy the example from:

- `supabase/seed.sql`
- `app/admin/page.tsx`

## Main files added/updated

- `components/daily-dozen-game.tsx`
- `types/index.ts`
- `data/mock.ts`
- `app/games/[slug]/page.tsx`
- `app/games/[slug]/archive/[date]/page.tsx`
- `supabase/schema.sql`
- `supabase/seed.sql`
