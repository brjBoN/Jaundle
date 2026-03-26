'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailyChallenge, PictureCrosswordConfig, PictureCrosswordEntry } from '@/types';

interface PictureCrosswordGameProps {
  slug: string;
  challenge: DailyChallenge;
}

type SolvedState = Record<string, { points: number; visibleImages: number }>;
type GuessState = Record<string, string>;
type VisibleState = Record<string, number>;
type FeedbackState = Record<string, string>;

type CrosswordIndex = {
  occupiedCells: Set<string>;
  startNumberByPosition: Map<string, number>;
  numberByEntryId: Record<string, number>;
  entriesByDirection: Record<'across' | 'down', PictureCrosswordEntry[]>;
  orderedEntries: PictureCrosswordEntry[];
  entryIdsByCell: Map<string, string[]>;
};

function normalizeGuess(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getEntryCells(entry: PictureCrosswordEntry) {
  return entry.answer.split('').map((letter, index) => ({
    row: entry.row + (entry.direction === 'down' ? index : 0),
    col: entry.col + (entry.direction === 'across' ? index : 0),
    letter,
  }));
}

function getVisibleScore(config: PictureCrosswordConfig, visibleImages: number): number {
  return Math.max(config.minScorePerWord, config.scoreStart - (visibleImages - 1) * config.revealPenalty);
}

function buildCrosswordIndex(config: PictureCrosswordConfig): CrosswordIndex {
  const occupiedCells = new Set<string>();
  const startersByPosition = new Map<string, PictureCrosswordEntry[]>();
  const entryIdsByCell = new Map<string, string[]>();

  for (const entry of config.entries) {
    const startKey = `${entry.row}-${entry.col}`;
    const existing = startersByPosition.get(startKey) ?? [];
    existing.push(entry);
    startersByPosition.set(startKey, existing);

    for (const cell of getEntryCells(entry)) {
      const cellKey = `${cell.row}-${cell.col}`;
      occupiedCells.add(cellKey);
      const cellEntries = entryIdsByCell.get(cellKey) ?? [];
      cellEntries.push(entry.id);
      entryIdsByCell.set(cellKey, cellEntries);
    }
  }

  const startNumberByPosition = new Map<string, number>();
  const numberByEntryId: Record<string, number> = {};
  let number = 1;

  for (let row = 0; row < config.height; row += 1) {
    for (let col = 0; col < config.width; col += 1) {
      const key = `${row}-${col}`;
      const starters = startersByPosition.get(key);
      if (!starters || starters.length === 0) continue;
      startNumberByPosition.set(key, number);
      for (const entry of starters) {
        numberByEntryId[entry.id] = number;
      }
      number += 1;
    }
  }

  const orderedEntries = [...config.entries].sort((a, b) => {
    const n = numberByEntryId[a.id] - numberByEntryId[b.id];
    if (n !== 0) return n;
    if (a.direction === b.direction) return 0;
    return a.direction === 'across' ? -1 : 1;
  });

  return {
    occupiedCells,
    startNumberByPosition,
    numberByEntryId,
    entriesByDirection: {
      across: orderedEntries.filter((entry) => entry.direction === 'across'),
      down: orderedEntries.filter((entry) => entry.direction === 'down'),
    },
    orderedEntries,
    entryIdsByCell,
  };
}

function nextUnsolvedEntryId(entries: PictureCrosswordEntry[], currentId: string, solved: SolvedState): string | null {
  if (entries.length === 0) return null;
  const currentIndex = entries.findIndex((entry) => entry.id === currentId);
  for (let offset = 1; offset <= entries.length; offset += 1) {
    const candidate = entries[(Math.max(currentIndex, 0) + offset) % entries.length];
    if (!solved[candidate.id]) return candidate.id;
  }
  return null;
}

export function PictureCrosswordGame({ slug, challenge }: PictureCrosswordGameProps) {
  const config = challenge.pictureCrossword;

  if (!config) {
    return (
      <div className="panel">
        <h1>{challenge.title}</h1>
        <p className="section-copy">This crossword challenge is missing its configuration in <code>data/mock.ts</code>.</p>
      </div>
    );
  }

  const crosswordConfig = config;
  const index = useMemo(() => buildCrosswordIndex(crosswordConfig), [crosswordConfig]);
  const entries = index.orderedEntries;
  const initialSelectedId = entries[0]?.id ?? '';
  const initialGuesses = Object.fromEntries(entries.map((entry) => [entry.id, ''])) as GuessState;
  const initialVisibleImages = Object.fromEntries(entries.map((entry) => [entry.id, 1])) as VisibleState;

  const [selectedEntryId, setSelectedEntryId] = useState(initialSelectedId);
  const [guesses, setGuesses] = useState<GuessState>(initialGuesses);
  const [visibleImages, setVisibleImages] = useState<VisibleState>(initialVisibleImages);
  const [solved, setSolved] = useState<SolvedState>({});
  const [feedback, setFeedback] = useState<FeedbackState>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);

  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? entries[0] ?? null;
  const solvedCount = Object.keys(solved).length;
  const allSolved = entries.length > 0 && solvedCount === entries.length;
  const score = Object.values(solved).reduce((sum, item) => sum + item.points, 0);
  const totalPossible = entries.length * crosswordConfig.scoreStart;

  const revealedCellMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      if (!solved[entry.id]) continue;
      for (const cell of getEntryCells(entry)) {
        map.set(`${cell.row}-${cell.col}`, cell.letter);
      }
    }
    return map;
  }, [entries, solved]);

  const solvedEntryIdsByCell = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of entries) {
      if (!solved[entry.id]) continue;
      for (const cell of getEntryCells(entry)) {
        const key = `${cell.row}-${cell.col}`;
        const ids = map.get(key) ?? [];
        ids.push(entry.id);
        map.set(key, ids);
      }
    }
    return map;
  }, [entries, solved]);

  const activeWordCells = useMemo(() => {
    if (!selectedEntry) return new Set<string>();
    return new Set(getEntryCells(selectedEntry).map((cell) => `${cell.row}-${cell.col}`));
  }, [selectedEntry]);

  const currentGuess = selectedEntry ? guesses[selectedEntry.id] ?? '' : '';
  const currentVisible = selectedEntry ? visibleImages[selectedEntry.id] ?? 1 : 1;
  const currentSolved = selectedEntry ? solved[selectedEntry.id] : undefined;
  const currentFeedback = selectedEntry ? feedback[selectedEntry.id] ?? '' : '';
  const activeNumber = selectedEntry ? index.numberByEntryId[selectedEntry.id] : null;
  const currentScore = selectedEntry ? getVisibleScore(crosswordConfig, currentVisible) : crosswordConfig.scoreStart;

  const displayedImageClues = selectedEntry
    ? (currentSolved ? selectedEntry.imageClues : selectedEntry.imageClues.slice(0, currentVisible))
    : [];
  const displayedImageCount = displayedImageClues.length;

  useEffect(() => {
    if (!expandedImage) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExpandedImage(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [expandedImage]);

  function handleSelectEntry(entryId: string) {
    setSelectedEntryId(entryId);
  }

  function handleUpdateGuess(value: string) {
    if (!selectedEntry) return;
    setGuesses((current) => ({ ...current, [selectedEntry.id]: value }));
  }

  function handleRevealNextImage() {
    if (!selectedEntry || solved[selectedEntry.id]) return;
    setVisibleImages((current) => ({
      ...current,
      [selectedEntry.id]: Math.min(selectedEntry.imageClues.length, (current[selectedEntry.id] ?? 1) + 1),
    }));
    setFeedback((current) => ({ ...current, [selectedEntry.id]: '' }));
  }

  function handleSubmitGuess() {
    if (!selectedEntry || solved[selectedEntry.id]) return;
    const guess = guesses[selectedEntry.id] ?? '';

    if (!normalizeGuess(guess)) {
      setFeedback((current) => ({ ...current, [selectedEntry.id]: 'Type a guess before submitting.' }));
      return;
    }

    if (normalizeGuess(guess) === normalizeGuess(selectedEntry.answer)) {
      const visibleCount = visibleImages[selectedEntry.id] ?? 1;
      const points = getVisibleScore(crosswordConfig, visibleCount);
      const nextSolved: SolvedState = {
        ...solved,
        [selectedEntry.id]: { points, visibleImages: visibleCount },
      };

      setSolved(nextSolved);
      setGuesses((current) => ({ ...current, [selectedEntry.id]: selectedEntry.answer }));
      setFeedback((current) => ({
        ...current,
        [selectedEntry.id]: `Correct — ${selectedEntry.answer} revealed for ${points} points.`,
      }));

      const nextId = nextUnsolvedEntryId(entries, selectedEntry.id, nextSolved);
      if (nextId) {
        setSelectedEntryId(nextId);
      }
      return;
    }

    setFeedback((current) => ({
      ...current,
      [selectedEntry.id]: 'Not quite. Reveal another image or try a different guess.',
    }));
  }

  function handleResetPuzzle() {
    setSelectedEntryId(initialSelectedId);
    setGuesses(initialGuesses);
    setVisibleImages(initialVisibleImages);
    setSolved({});
    setFeedback({});
    setIsFinishing(false);
  }

  function handleFinishPuzzle() {
    if (!allSolved) return;
    setIsFinishing(true);

    const result = {
      slug,
      date: challenge.date,
      title: challenge.title,
      score,
      total: totalPossible,
      summary: `${challenge.title} — ${score}/${totalPossible} points, ${solvedCount}/${entries.length} words solved`,
      completedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(`result:${slug}:${challenge.date}`, JSON.stringify(result));
      window.localStorage.setItem(`answers:${slug}:${challenge.date}`, JSON.stringify({ guesses, solved, visibleImages }));
      window.location.href = `/games/${slug}/results`;
    } catch (error) {
      console.error('Unable to save result locally', error);
      setIsFinishing(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="section-header">
  <div>
    <span className="kicker">Today&apos;s challenge</span>
    <h1>{challenge.title}</h1>
  </div>
</div>

<div className="crossword-summary-row">
  <div className="summary-chip"><span className="summary-label">Score</span><strong>{score} / {totalPossible}</strong></div>
  <div className="summary-chip"><span className="summary-label">Solved</span><strong>{solvedCount} / {entries.length}</strong></div>
</div>

        <div className="crossword-play-layout">
          <div className="crossword-top-layout">
            <section className="crossword-main-column">
              <div className="crossword-board-wrap crossword-board-wrap--new">
                <div className="crossword-board crossword-board--new" style={{ gridTemplateColumns: `repeat(${crosswordConfig.width}, minmax(0, 1fr))` }}>
                  {Array.from({ length: crosswordConfig.height * crosswordConfig.width }).map((_, cellIndex) => {
                    const row = Math.floor(cellIndex / crosswordConfig.width);
                    const col = cellIndex % crosswordConfig.width;
                    const key = `${row}-${col}`;
                    const letter = revealedCellMap.get(key);
                    const startNumber = index.startNumberByPosition.get(key);
                    const entryIdsAtCell = index.entryIdsByCell.get(key) ?? [];
                    const solvedIdsAtCell = solvedEntryIdsByCell.get(key) ?? [];
                    const hasRevealedCell = Boolean(letter);
                    const isStartCellForSelectedEntry = selectedEntry ? selectedEntry.row === row && selectedEntry.col === col : false;
                    const isPartOfSelectedSolvedEntry = Boolean(currentSolved) && activeWordCells.has(key) && hasRevealedCell;
                    const selectableEntryId = isStartCellForSelectedEntry
                      ? selectedEntry?.id
                      : entryIdsAtCell.find((entryId) => solved[entryId]) ?? entryIdsAtCell[0] ?? null;

                    return (
                      <button
                        key={key}
                        type="button"
                        className={[
                          'crossword-cell',
                          'crossword-cell--new',
                          hasRevealedCell ? 'crossword-cell--revealed' : 'crossword-cell--hidden',
                          startNumber ? 'crossword-cell--start' : '',
                          selectableEntryId ? 'crossword-cell--clickable' : '',
                          isPartOfSelectedSolvedEntry ? 'crossword-cell--active' : '',
                          solvedIdsAtCell.length > 1 ? 'crossword-cell--intersection' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => {
                          if (selectableEntryId) {
                            handleSelectEntry(selectableEntryId);
                          }
                        }}
                        aria-label={typeof startNumber === 'number' ? `Clue ${startNumber}` : hasRevealedCell ? `Revealed crossword cell ${letter}` : 'Hidden crossword cell'}
                      >
                        {typeof startNumber === 'number' ? (
                          <span className={[
                            'crossword-start-number',
                            isStartCellForSelectedEntry ? 'crossword-start-number--selected' : '',
                            hasRevealedCell ? 'crossword-start-number--on-revealed' : '',
                          ].filter(Boolean).join(' ')}>{startNumber}</span>
                        ) : null}
                        {letter ? (
                          <span className={[
                            'crossword-letter',
                            typeof startNumber === 'number' ? 'crossword-letter--with-number' : '',
                          ].filter(Boolean).join(' ')}>{letter}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {revealedCellMap.size === 0 ? <div className="crossword-board-note">Boxes stay hidden until you solve a clue. The numbered markers show where each answer begins.</div> : null}
              </div>
            </section>

            {selectedEntry ? (
              <section className={[
                'selected-clue-panel',
                'selected-clue-panel--side',
                currentSolved ? 'selected-clue-panel--solved' : '',
              ].filter(Boolean).join(' ')}>
                <div className="selected-clue-topline">
  <div>
    <div className="selected-clue-meta">
      <span className="badge badge--accent">{selectedEntry.direction}</span>
      <span className="selected-clue-number">{activeNumber}.</span>
    </div>

    <p className="section-copy" style={{ marginTop: 8 }}>
      {selectedEntry.helperText ?? selectedEntry.label ?? 'Guess the word from the clue images.'}
    </p>
  </div>

  <span className="badge">
    {currentSolved ? `${currentSolved.points} pts` : `${currentScore} pts now`}
  </span>
</div>

                <div className="clue-image-grid clue-image-grid--selected">
                  {displayedImageClues.map((clue) => (
                    <button
                      key={clue.id}
                      type="button"
                      className="clue-image-button"
                      onClick={() => setExpandedImage({ src: clue.src, alt: clue.alt })}
                      aria-label={`Expand image clue: ${clue.alt}`}
                    >
                      <img src={clue.src} alt={clue.alt} className="clue-image" />
                    </button>
                  ))}
                </div>

                <div className="clue-pack-meta">
                  <span>{displayedImageCount} / {selectedEntry.imageClues.length} images available</span>
                  <span>{currentSolved ? `${currentSolved.points} points locked in` : `${currentScore} points if solved now`}</span>
                </div>

                {currentSolved ? <p className="copy-muted clue-image-unlock-note">Solved words unlock the full clue image set without changing your score.</p> : null}

                <div className="guess-row">
                  <input
                    className="answer-input"
                    type="text"
                    value={currentGuess}
                    onChange={(event) => handleUpdateGuess(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSubmitGuess();
                      }
                    }}
                    placeholder="Type your guess"
                    disabled={Boolean(currentSolved)}
                  />
                  <button type="button" className="button" onClick={handleSubmitGuess} disabled={Boolean(currentSolved)}>
                    {currentSolved ? 'Solved' : 'Guess'}
                  </button>
                </div>

                <div className="button-row button-row--compact">
                  {currentSolved ? (
                    <span className="copy-muted">All clue images are now unlocked for review.</span>
                  ) : (
                    <button type="button" className="button-secondary" onClick={handleRevealNextImage} disabled={currentVisible >= selectedEntry.imageClues.length}>
                      {currentVisible >= selectedEntry.imageClues.length ? 'All images revealed' : 'Reveal another image'}
                    </button>
                  )}
                  <span className={`feedback-text ${currentSolved ? 'feedback-text--success' : ''}`}>{currentFeedback}</span>
                </div>
              </section>
            ) : null}
          </div>

          <section className="crossword-clue-browser">
            <div className="clue-nav-header clue-nav-header--browser">
              <h3>All clues</h3>
              <span className="copy-muted">Pick a clue below</span>
            </div>

            <aside className="crossword-clue-sidebar">
            {(['across', 'down'] as const).map((direction) => (
              <section key={direction} className="clue-nav-section">
                <div className="clue-nav-header">
                  <h3>{direction === 'across' ? 'Across' : 'Down'}</h3>
                  <span className="copy-muted">Select a clue</span>
                </div>
                <div className="clue-nav-list">
                  {index.entriesByDirection[direction].map((entry) => {
                    const entryNumber = index.numberByEntryId[entry.id];
                    const entrySolved = solved[entry.id];
                    const isSelected = selectedEntry?.id === entry.id;
                    const imagesShown = visibleImages[entry.id] ?? 1;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={['clue-nav-item', isSelected ? 'clue-nav-item--selected' : '', entrySolved ? 'clue-nav-item--solved' : ''].filter(Boolean).join(' ')}
                        onClick={() => handleSelectEntry(entry.id)}
                      >
                        <span className="clue-nav-number">{entryNumber}.</span>
                        <span className="clue-nav-copy">
                          <strong>{entry.menuLabel ?? entry.label}</strong>
                          <span>{entrySolved ? `Solved · ${entrySolved.points} pts` : `${imagesShown}/${entry.imageClues.length} images shown`}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            </aside>
          </section>

          <div className="button-row" style={{ marginTop: 0 }}>
            <button type="button" className="button" onClick={handleFinishPuzzle} disabled={!allSolved || isFinishing}>{isFinishing ? 'Saving…' : 'Finish puzzle'}</button>
            <button type="button" className="button-secondary" onClick={handleResetPuzzle}>Reset puzzle</button>
            <span className="copy-muted">{allSolved ? "All words solved. Save today's result." : 'Solve every clue in the list to finish the puzzle.'}</span>
          </div>
        </div>
      </div>

      {expandedImage ? (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image clue"
          onClick={() => setExpandedImage(null)}
        >
          <div className="image-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="image-lightbox__close"
              onClick={() => setExpandedImage(null)}
              aria-label="Close expanded image"
            >
              ×
            </button>
            <img src={expandedImage.src} alt={expandedImage.alt} className="image-lightbox__image" />
          </div>
        </div>
      ) : null}
    </>
  );
}
