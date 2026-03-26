import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PictureCrosswordGame } from '@/components/picture-crossword-game';
import { PlaceholderGame } from '@/components/placeholder-game';
import { getGameBySlug, getTodaysChallenge } from '@/lib/challenges';

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  const challenge = await getTodaysChallenge(slug);

  if (!game || !challenge) {
    notFound();
  }

  return (
    <>
      <div className="container" style={{ paddingTop: '1rem' }}>
        <div className="button-row" style={{ marginTop: 0 }}>
          <Link href={`/games/${slug}/archive`} className="button-secondary">
            Browse archive
          </Link>
          <Link href={`/games/${slug}/results`} className="button-secondary">
            View saved result
          </Link>
        </div>
      </div>

      <div className="container game-layout game-layout--solo">
        {challenge.type === 'picture-crossword' ? (
          <PictureCrosswordGame slug={slug} challenge={challenge} />
        ) : (
          <PlaceholderGame slug={slug} challenge={challenge} />
        )}
      </div>
    </>
  );
}
