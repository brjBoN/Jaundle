'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { GameResult } from '@/types';

interface ResultsClientProps {
  slug: string;
  fallbackTitle: string;
  fallbackDate: string;
}

export function ResultsClient({ slug, fallbackTitle, fallbackDate }: ResultsClientProps) {
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`result:${slug}:${fallbackDate}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, [fallbackDate, slug]);

  const shareText = useMemo(() => {
    if (!result) {
      return `${fallbackTitle} — no result saved yet`;
    }

    return result.summary;
  }, [fallbackTitle, result]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
  }

  return (
    <div className="game-layout">
      <div className="panel">
        <span className="kicker">Results</span>
        <h1>{fallbackTitle}</h1>

        {result ? (
          <>
            <div className="stats-grid" style={{ marginTop: '1.25rem' }}>
              <div className="stat-card">
                <div className="stat-label">Score</div>
                <div className="stat-value">{result.score}/{result.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Summary</div>
                <div className="stat-value" style={{ fontSize: '1.15rem' }}>{result.summary}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value" style={{ fontSize: '1.15rem' }}>
                  {new Date(result.completedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="button-row">
              <button className="button" onClick={handleCopy}>
                Copy share text
              </button>
              <Link className="button-secondary" href={`/games/${slug}`}>
                Play again
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            No saved result was found for today yet. Play the game first, then come back here.
          </div>
        )}
      </div>
    </div>
  );
}
