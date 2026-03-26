import Link from 'next/link';
import type { DailyChallenge } from '@/types';

interface PlaceholderGameProps {
  slug: string;
  challenge: DailyChallenge;
}

export function PlaceholderGame({ slug, challenge }: PlaceholderGameProps) {
  return (
    <>
      <div className="panel">
        <div className="section-header">
          <div>
            <span className="kicker">Prototype stub</span>
            <h1>{challenge.title}</h1>
            <p className="section-copy">{challenge.description}</p>
          </div>
          <span className="badge">{challenge.difficulty}</span>
        </div>

        <div className="empty-state">
          <p>
            This route is wired up and ready, but the playable interaction for <strong>{challenge.title}</strong> is still a placeholder.
          </p>
          <p style={{ marginBottom: 0 }}>
            Use this file as the starting point for your next game mode after the hidden picture crossword is polished.
          </p>
        </div>

        <div className="button-row">
          <Link className="button" href={`/games/${slug}/results`}>
            View sample results page
          </Link>
          <Link className="button-secondary" href="/admin">
            Open admin stub
          </Link>
        </div>
      </div>

      <aside className="panel">
        <h2>Rules</h2>
        <div className="meta-list">
          {challenge.rules.map((rule) => (
            <div key={rule} className="meta-item">
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
