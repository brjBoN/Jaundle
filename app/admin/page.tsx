import { getGames, getTodaysChallenge } from '@/lib/challenges';
import { getSupabaseEnv } from '@/lib/supabase/config';

const starterPayload = `{
  "width": 7,
  "height": 7,
  "scoreStart": 10,
  "revealPenalty": 2,
  "minScorePerWord": 4,
  "entries": [
    {
      "id": "entry-1",
      "label": "Food image clue",
      "menuLabel": "Crisp fruit or pie filling",
      "helperText": "A familiar food word hidden in the puzzle.",
      "answer": "APPLE",
      "row": 1,
      "col": 1,
      "direction": "across",
      "category": "Food",
      "imageClues": [
        { "id": "apple-1", "src": "/clues/apple-1.svg", "alt": "A bright red fruit." },
        { "id": "apple-2", "src": "/clues/apple-2.svg", "alt": "A slice of pie." }
      ]
    }
  ]
}`;

export default async function AdminPage() {
  const games = getGames();
  const todayChallenge = await getTodaysChallenge('daily-crossword');
  const { isConfigured, url } = getSupabaseEnv();

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <div className="section-header">
        <div>
          <span className="kicker">Supabase setup</span>
          <h1>Prepare your challenge table</h1>
          <p className="section-copy">
            This page is still a stub, but the project is now wired to read published challenges from Supabase as soon as you add the table and rows.
          </p>
        </div>
      </div>

      <div className="game-layout" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <div className="panel">
          <h2>What to paste into Supabase</h2>
          <div className="callout" style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> {isConfigured ? 'Environment variables detected in the app.' : 'Add .env.local before expecting live Supabase reads.'}
            {url ? <div className="small" style={{ marginTop: '0.5rem' }}>{url}</div> : null}
          </div>

          <form className="form-grid">
            <div className="form-row">
              <label htmlFor="game">Game</label>
              <select id="game" className="select-input" defaultValue="daily-crossword">
                {games.map((game) => (
                  <option key={game.slug} value={game.slug}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="title">Challenge title</label>
              <input id="title" className="answer-input" defaultValue={todayChallenge?.title ?? 'Hidden Picture Crossword'} />
            </div>

            <div className="form-row">
              <label htmlFor="date">Publish date</label>
              <input id="date" className="answer-input" type="date" defaultValue={todayChallenge?.date} />
            </div>

            <div className="form-row">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="textarea"
                rows={4}
                defaultValue={todayChallenge?.description ?? 'Players solve a crossword by guessing words from partially revealed image clue packs.'}
              />
            </div>

            <div className="form-row">
              <label htmlFor="payload">Challenge JSON</label>
              <textarea
                id="payload"
                className="textarea"
                rows={18}
                defaultValue={todayChallenge?.pictureCrossword ? JSON.stringify(todayChallenge.pictureCrossword, null, 2) : starterPayload}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
