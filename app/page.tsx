import Image from 'next/image';
import { GameCard } from '@/components/game-card';
import { getGames, getTodaysChallenge } from '@/lib/challenges';

export default async function HomePage() {
  const games = getGames();
  const challenges = await Promise.all(games.map(async (game) => [game.slug, await getTodaysChallenge(game.slug)] as const));
  const challengeBySlug = Object.fromEntries(challenges);

  return (
    <>
      <section className="hero hero--banner">
        <div className="container">
          <div className="hero-banner-card">
            <Image
              src="/banner.png"
              alt="Jaundle banner"
              fill
              priority
              className="hero-banner-image"
              sizes="(max-width: 1500px) 100vw, 1500px"
            />
          </div>
        </div>
      </section>

      <section className="section" id="today">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Today&apos;s games</h2>
              <p className="section-copy"></p>
            </div>
          </div>

          <div className="game-grid">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} challenge={challengeBySlug[game.slug] ?? null} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
