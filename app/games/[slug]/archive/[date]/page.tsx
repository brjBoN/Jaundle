import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PictureCrosswordGame } from '@/components/picture-crossword-game';
import { PlaceholderGame } from '@/components/placeholder-game';
import { getChallengeByDate, getGameBySlug } from '@/lib/challenges';
import { formatDisplayDate } from '@/lib/date';

export default async function ArchiveChallengePage({ params }: { params: Promise<{ slug: string; date: string }> }) {
  const { slug, date } = await params;
  const game = getGameBySlug(slug);
  const challenge = await getChallengeByDate(slug, date);

  if (!game || !challenge) {
    notFound();
  }

  return (
    <>
      <div className="container" style={{ paddingTop: '1rem' }}>
        <div className="button-row" style={{ marginTop: 0 }}>
          <Link href={`/games/${slug}/archive`} className="button-secondary">
            Back to archive
          </Link>
          <span className="badge">{formatDisplayDate(challenge.date)}</span>
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
