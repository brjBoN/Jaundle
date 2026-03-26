import Link from 'next/link';
import type { DailyChallenge, GameDefinition } from '@/types';

interface GameCardProps {
  game: GameDefinition;
  challenge: DailyChallenge | null;
}

export function GameCard({ game, challenge }: GameCardProps) {
  return (
    <article className="card">
      <div className="card-topline">
        <span className="badge badge--accent">{game.emoji} {game.name}</span>
        <span className="badge">{challenge?.estimatedMinutes ?? 0} min</span>
      </div>

      <h3>{challenge?.title ?? game.name}</h3>
      <p>{challenge?.description ?? game.shortDescription}</p>

      <div className="button-row">
        <Link href={`/games/${game.slug}`} className="button">
          Play today
        </Link>
        <Link href={`/games/${game.slug}/archive`} className="button-secondary">
          Browse archive
        </Link>
      </div>
    </article>
  );
}
