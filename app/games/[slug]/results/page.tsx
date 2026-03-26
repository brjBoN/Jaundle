import { notFound } from 'next/navigation';
import { ResultsClient } from '@/components/results-client';
import { getGameBySlug, getTodaysChallenge } from '@/lib/challenges';

export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  const challenge = await getTodaysChallenge(slug);

  if (!game || !challenge) {
    notFound();
  }

  return (
    <div className="container">
      <ResultsClient slug={slug} fallbackTitle={challenge.title} fallbackDate={challenge.date} />
    </div>
  );
}
