import { notFound } from 'next/navigation';
import { PictureCrosswordGame } from '@/components/picture-crossword-game';
import { PlaceholderGame } from '@/components/placeholder-game';
import { getGameBySlug, getTodaysChallenge } from '@/lib/challenges';

interface GameRuntimeProps {
  slug: string;
}

export async function GameRuntime({ slug }: GameRuntimeProps) {
  const game = getGameBySlug(slug);
  const challenge = await getTodaysChallenge(slug);

  if (!game || !challenge) {
    notFound();
  }

  return (
    <div className="container game-layout game-layout--solo">
      {challenge.type === 'picture-crossword' ? (
        <PictureCrosswordGame slug={slug} challenge={challenge} />
      ) : (
        <PlaceholderGame slug={slug} challenge={challenge} />
      )}
    </div>
  );
}
