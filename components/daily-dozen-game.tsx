'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { DailyChallenge, DailyDozenAnswerPart, DailyDozenQuestion, GameResult } from '@/types';

interface DailyDozenGameProps {
  slug: string;
  challenge: DailyChallenge;
}

type TileStatus = 'open' | 'correct' | 'incorrect';
type TileState = Record<string, { status: TileStatus; submissions: string[]; foundAnswers: string[] }>;
type DraftState = Record<string, string>;
type ProgressState = Record<string, { foundPartIds: string[]; foundAnswers: string[]; submissions: string[] }>;
type ModalNotice = { kind: 'success' | 'error'; message: string };

function normalizeAnswer(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getQuestionAnswerParts(question: DailyDozenQuestion): DailyDozenAnswerPart[] {
  const configuredParts = question.answerParts?.length
    ? question.answerParts
    : question.parts?.length
      ? question.parts
      : null;

  if (configuredParts) {
    return configuredParts.map((part, index) => ({
      ...part,
      id: part.id || `${question.id}-part-${index + 1}`,
      displayAnswer: part.displayAnswer ?? part.answers[0] ?? `Answer ${index + 1}`,
    }));
  }

  return [
    {
      id: `${question.id}-single-answer`,
      answers: question.answers ?? [],
      displayAnswer: question.answers?.[0] ?? 'Answer',
    },
  ];
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function buildShareRows(questions: DailyDozenQuestion[], tileState: TileState, columns = 3): string[] {
  const cells = questions.map((question) => {
    const status = tileState[question.id]?.status ?? 'open';
    if (status === 'correct') {
      return '🟩';
    }

    if (status === 'incorrect') {
      return '🟥';
    }

    return '⬛';
  });

  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(cells.slice(index, index + columns).join(''));
  }

  return rows;
}

export function DailyDozenGame({ slug, challenge }: DailyDozenGameProps) {
  const config = challenge.dailyDozen;

  if (!config) {
    return (
      <div className="panel">
        <h1>{challenge.title}</h1>
        <p className="section-copy">
          This category challenge is missing its configuration in <code>data/mock.ts</code>.
        </p>
      </div>
    );
  }

  const questions = config.questions;
  const pointsPerQuestion = config.pointsPerQuestion ?? 1;
  const guessesAllowed = config.guessesAllowed ?? questions.length;
  const initialDrafts = Object.fromEntries(questions.map((question) => [question.id, ''])) as DraftState;
  const defaultSelectedQuestionId = questions[0]?.id ?? '';
  const resultStorageKey = `result:${slug}:${challenge.date}`;

  const [tileState, setTileState] = useState<TileState>({});
  const [drafts, setDrafts] = useState<DraftState>(initialDrafts);
  const [progressState, setProgressState] = useState<ProgressState>({});
  const [selectedQuestionId, setSelectedQuestionId] = useState(defaultSelectedQuestionId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [modalNotice, setModalNotice] = useState<ModalNotice | null>(null);

  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId) ?? null;
  const selectedQuestionParts = selectedQuestion ? getQuestionAnswerParts(selectedQuestion) : [];
  const selectedProgress = selectedQuestion
    ? progressState[selectedQuestion.id] ?? { foundPartIds: [], foundAnswers: [], submissions: [] }
    : { foundPartIds: [], foundAnswers: [], submissions: [] };
  const answeredQuestions = questions.filter((question) => {
    const status = tileState[question.id]?.status;
    return status === 'correct' || status === 'incorrect';
  });
  const correctCount = answeredQuestions.filter((question) => tileState[question.id]?.status === 'correct').length;
  const incorrectCount = answeredQuestions.filter((question) => tileState[question.id]?.status === 'incorrect').length;
  const answeredCount = answeredQuestions.length;
  const guessesRemaining = Math.max(guessesAllowed - answeredCount, 0);
  const score = correctCount * pointsPerQuestion;
  const totalPossible = questions.length * pointsPerQuestion;
  const isGameOver = guessesRemaining === 0 || answeredCount === questions.length;
  const tileColumns = 3;
  const shareRows = useMemo(() => buildShareRows(questions, tileState, tileColumns), [questions, tileState]);
  const shareText = useMemo(
    () => `${challenge.title} ${score}/${totalPossible}\n${shareRows.join('\n')}`,
    [challenge.title, score, shareRows, totalPossible],
  );

  useEffect(() => {
    if (isGameOver) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isGameOver]);

  useEffect(() => {
    const stored = localStorage.getItem(resultStorageKey);
    setIsSaved(Boolean(stored));
  }, [resultStorageKey]);

  useEffect(() => {
    if (isGameOver && selectedQuestionId) {
      setIsModalOpen(false);
    }
  }, [isGameOver, selectedQuestionId]);

  function buildResult(): GameResult {
    return {
      slug,
      date: challenge.date,
      title: challenge.title,
      score,
      total: totalPossible,
      summary: shareText,
      completedAt: new Date().toISOString(),
    };
  }

  function saveResult() {
    if (!isGameOver) {
      return;
    }

    localStorage.setItem(resultStorageKey, JSON.stringify(buildResult()));
    setIsSaved(true);
  }

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setCopyStatus('copied');
    window.setTimeout(() => {
      setCopyStatus('idle');
    }, 1800);
  }

  function openQuestion(questionId: string) {
    setSelectedQuestionId(questionId);
    setIsModalOpen(true);
    setModalNotice(null);
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalNotice(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedQuestion || isGameOver) {
      return;
    }

    const existingStatus = tileState[selectedQuestion.id]?.status;
    if (existingStatus === 'correct' || existingStatus === 'incorrect') {
      return;
    }

    const guess = (drafts[selectedQuestion.id] ?? '').trim();
    if (!guess) {
      setModalNotice({ kind: 'error', message: 'Type an answer before submitting.' });
      return;
    }

    const answerParts = getQuestionAnswerParts(selectedQuestion);
    const currentProgress = progressState[selectedQuestion.id] ?? {
      foundPartIds: [],
      foundAnswers: [],
      submissions: [],
    };
    const normalizedGuess = normalizeAnswer(guess);
    const matchedPart = answerParts.find(
      (part) =>
        !currentProgress.foundPartIds.includes(part.id) &&
        part.answers.some((answer) => normalizeAnswer(answer) === normalizedGuess),
    );

    if (!matchedPart) {
      const incorrectSubmissions = [...currentProgress.submissions, guess];
      setTileState((current) => ({
        ...current,
        [selectedQuestion.id]: {
          status: 'incorrect',
          submissions: incorrectSubmissions,
          foundAnswers: currentProgress.foundAnswers,
        },
      }));
      setProgressState((current) => {
        const next = { ...current };
        delete next[selectedQuestion.id];
        return next;
      });
      closeModal();
      return;
    }

    const displayAnswer = matchedPart.displayAnswer ?? matchedPart.answers[0] ?? guess;
    const nextFoundPartIds = [...currentProgress.foundPartIds, matchedPart.id];
    const nextFoundAnswers = [...currentProgress.foundAnswers, displayAnswer];
    const nextSubmissions = [...currentProgress.submissions, guess];

    if (nextFoundPartIds.length === answerParts.length) {
      setTileState((current) => ({
        ...current,
        [selectedQuestion.id]: {
          status: 'correct',
          submissions: nextSubmissions,
          foundAnswers: nextFoundAnswers,
        },
      }));
      setProgressState((current) => {
        const next = { ...current };
        delete next[selectedQuestion.id];
        return next;
      });
      setDrafts((current) => ({
        ...current,
        [selectedQuestion.id]: '',
      }));
      closeModal();
      return;
    }

    setProgressState((current) => ({
      ...current,
      [selectedQuestion.id]: {
        foundPartIds: nextFoundPartIds,
        foundAnswers: nextFoundAnswers,
        submissions: nextSubmissions,
      },
    }));
    setDrafts((current) => ({
      ...current,
      [selectedQuestion.id]: '',
    }));
    setModalNotice({
      kind: 'success',
      message: `${nextFoundPartIds.length} of ${answerParts.length} answers found. Enter the next one.`,
    });
  }

  return (
    <div className="daily-dozen-page">
      <div className="daily-dozen-background" aria-hidden="true">
        <div className="daily-dozen-stars" />
        <div className="daily-dozen-floor" />
      </div>

      <div className="daily-dozen-stage">
        <div className="daily-dozen-wordmark-wrap" aria-label={`${challenge.title} title treatment`}>
          <div className="daily-dozen-wordmark">
            <span className="daily-dozen-wordmark__small">The Daily</span>
            <span className="daily-dozen-wordmark__large">Dozen</span>
            <span className="daily-dozen-wordmark__small">Trivia</span>
          </div>
        </div>

        <div className="daily-dozen-board-shell">
          <div className="daily-dozen-board-grid" style={{ gridTemplateColumns: `repeat(${tileColumns}, minmax(0, 1fr))` }}>
            {questions.map((question, index) => {
              const state = tileState[question.id];
              const status = state?.status ?? 'open';

              return (
                <button
                  key={question.id}
                  type="button"
                  className={`daily-dozen-tile daily-dozen-tile--${status}`}
                  onClick={() => openQuestion(question.id)}
                  disabled={isGameOver && status === 'open'}
                >
                  <span className="daily-dozen-tile__number">{index + 1}</span>
                  <span className="daily-dozen-tile__label">{question.category}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="daily-dozen-scorebar">
          <div className="daily-dozen-scorecard daily-dozen-scorecard--wide">
            <div className="daily-dozen-scorecard__value">{guessesRemaining}</div>
            <div className="daily-dozen-scorecard__label">Guesses Remaining</div>
          </div>

          <div className="daily-dozen-scorecard daily-dozen-scorecard--timer">
            <div className="daily-dozen-scorecard__value">{formatElapsed(elapsedSeconds)}</div>
            <div className="daily-dozen-scorecard__label">Elapsed</div>
          </div>

          <div className="daily-dozen-scorecard">
            <div className="daily-dozen-scorecard__value">{correctCount}</div>
            <div className="daily-dozen-scorecard__label">Correct</div>
          </div>

          <div className="daily-dozen-scorecard">
            <div className="daily-dozen-scorecard__value">{incorrectCount}</div>
            <div className="daily-dozen-scorecard__label">Incorrect</div>
          </div>
        </div>

        <div className="daily-dozen-actions">
          <Link href={`/games/${slug}/archive`} className="daily-dozen-pill-link">
            Archive
          </Link>
          <Link href={`/games/${slug}/results`} className="daily-dozen-pill-link">
            Saved Result
          </Link>
        </div>

        <div className="daily-dozen-helptext">Tap a category square, answer once, and watch the board fill in green or red.</div>

        {isGameOver ? (
          <div className="daily-dozen-finish-panel">
            <div className="daily-dozen-finish-panel__title">Round Complete</div>
            <div className="daily-dozen-finish-panel__score">
              Score: {score}/{totalPossible}
            </div>
            <div className="daily-dozen-finish-panel__grid">{shareRows.map((row) => <span key={row}>{row}</span>)}</div>

            <div className="daily-dozen-finish-panel__actions">
              <button type="button" className="button daily-dozen-finish-panel__button" onClick={saveResult}>
                {isSaved ? 'Score Saved' : 'Save Score'}
              </button>
              <button type="button" className="button-secondary daily-dozen-finish-panel__button" onClick={copyShareText}>
                {copyStatus === 'copied' ? 'Copied' : 'Copy Share Text'}
              </button>
              <Link href={`/games/${slug}/results`} className="daily-dozen-pill-link daily-dozen-pill-link--inline">
                View Saved Result
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {isModalOpen && selectedQuestion ? (
        <div className="daily-dozen-modal" role="dialog" aria-modal="true" aria-labelledby="daily-dozen-question-title">
          <div className="daily-dozen-modal__card">
            <button type="button" className="daily-dozen-modal__close" onClick={closeModal} aria-label="Close question">
              ×
            </button>

            <div className="daily-dozen-modal__eyebrow">
              Category {questions.findIndex((question) => question.id === selectedQuestion.id) + 1}
            </div>
            <h2 id="daily-dozen-question-title" className="daily-dozen-modal__title">
              {selectedQuestion.category}
            </h2>

            {selectedQuestion.image ? (
              <div className="daily-dozen-modal__image-wrap">
                <img
                  src={selectedQuestion.image.src}
                  alt={selectedQuestion.image.alt}
                  className="daily-dozen-modal__image"
                />
              </div>
            ) : null}

            {selectedQuestion.audio ? (
              <div className="daily-dozen-modal__audio-wrap">
                {selectedQuestion.audio.label ? (
                  <p className="daily-dozen-modal__audio-label">{selectedQuestion.audio.label}</p>
                ) : null}
                <audio
                  controls
                  preload="none"
                  className="daily-dozen-modal__audio"
                  src={selectedQuestion.audio.src}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : null}

            <p className="daily-dozen-modal__prompt">{selectedQuestion.prompt}</p>
            {selectedQuestion.hint ? <p className="daily-dozen-modal__hint">Hint: {selectedQuestion.hint}</p> : null}

            {selectedQuestionParts.length > 1 ? (
              <div className="daily-dozen-modal__progress">
                <div className="daily-dozen-modal__progress-copy">
                  {selectedProgress.foundPartIds.length} of {selectedQuestionParts.length} required answers found.
                  Submit answers one at a time. One wrong answer marks the whole question incorrect.
                </div>
                {selectedProgress.foundAnswers.length > 0 ? (
                  <div className="daily-dozen-answer-pill-row">
                    {selectedProgress.foundAnswers.map((answer) => (
                      <span key={answer} className="daily-dozen-answer-pill">
                        {answer}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(() => {
              const state = tileState[selectedQuestion.id];
              const status = state?.status ?? 'open';
              const acceptedAnswers = selectedQuestionParts.map((part) => part.displayAnswer ?? part.answers[0]).filter(Boolean);

              if (status === 'correct' || status === 'incorrect') {
                return (
                  <div className={`daily-dozen-modal__result daily-dozen-modal__result--${status}`}>
                    <div className="daily-dozen-modal__result-title">{status === 'correct' ? 'Correct' : 'Incorrect'}</div>
                    <div>
                      {state.submissions.length > 1 ? 'Your submissions: ' : 'Your submission: '}
                      {state.submissions.join(', ')}
                    </div>
                    {status === 'incorrect' && state.foundAnswers.length > 0 ? (
                      <div>Found before miss: {state.foundAnswers.join(', ')}</div>
                    ) : null}
                    <div>
                      {acceptedAnswers.length > 1 ? 'Required answers: ' : 'Accepted answer: '}
                      {acceptedAnswers.join(', ')}
                    </div>
                  </div>
                );
              }

              return (
                <form className="daily-dozen-modal__form" onSubmit={handleSubmit}>
                  <label htmlFor="daily-dozen-answer" className="daily-dozen-modal__label">
                    {selectedQuestionParts.length > 1 ? 'Enter one answer' : 'Your answer'}
                  </label>
                  <input
                    id="daily-dozen-answer"
                    className="answer-input daily-dozen-modal__input"
                    value={drafts[selectedQuestion.id] ?? ''}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [selectedQuestion.id]: event.target.value,
                      }))
                    }
                    placeholder={selectedQuestionParts.length > 1 ? 'Type one answer' : 'Type your guess'}
                    autoComplete="off"
                    autoFocus
                  />

                  {modalNotice ? (
                    <div className={`daily-dozen-modal__notice daily-dozen-modal__notice--${modalNotice.kind}`}>
                      {modalNotice.message}
                    </div>
                  ) : null}

                  <div className="daily-dozen-modal__actions">
                    <button type="submit" className="button daily-dozen-modal__submit">
                      Submit answer
                    </button>
                    <button type="button" className="button-secondary daily-dozen-modal__secondary" onClick={closeModal}>
                      Back to board
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
