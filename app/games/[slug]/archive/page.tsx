import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChallengeArchive, getGameBySlug } from '@/lib/challenges';
import { formatDisplayDate } from '@/lib/date';

export default async function ArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const archive = await getChallengeArchive(slug);

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <div className="section-header">
        <div>
          <span className="kicker">Archive</span>
          <h1>{game.name}</h1>
          <p className="section-copy"></p>
        </div>
      </div>

      <div className="archive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {archive.map((item) => (
          <article className="card" key={item.date}>
            <div className="card-topline">
              <span className="badge badge--accent">{item.difficulty}</span>
              <span className="badge">{item.estimatedMinutes} min</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="copy-muted small">{formatDisplayDate(item.date)}</p>
            <div className="button-row">
              <Link className="button" href={`/games/${slug}/archive/${item.date}`}>
                Play this puzzle
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
