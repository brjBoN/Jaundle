import { gameDefinitions, mockDailyChallenges } from '@/data/mock';
import { getTodayInEastern } from '@/lib/date';
import { createClient } from '@/lib/supabase/server';
import type { ChallengeArchiveItem, DailyChallenge, DailyChallengeRow, GameDefinition } from '@/types';

function mapRowToChallenge(row: DailyChallengeRow): DailyChallenge {
  const baseChallenge: DailyChallenge = {
    date: row.challenge_date,
    title: row.title,
    description: row.description,
    rules: Array.isArray(row.rules) ? row.rules : [],
    estimatedMinutes: row.estimated_minutes,
    difficulty: row.difficulty,
    type: row.type,
  };

  if (row.type === 'picture-crossword') {
    return { ...baseChallenge, pictureCrossword: row.payload as DailyChallenge['pictureCrossword'] };
  }

  if (row.type === 'clue-ladder') {
    return { ...baseChallenge, clueLadder: row.payload as DailyChallenge['clueLadder'] };
  }

  if (row.type === 'category-sprint') {
    return { ...baseChallenge, categorySprint: row.payload as DailyChallenge['categorySprint'] };
  }

  return { ...baseChallenge, dailyDozen: row.payload as DailyChallenge['dailyDozen'] };
}

function getMockChallenge(slug: string, dateOverride?: string): DailyChallenge | null {
  const challenge = mockDailyChallenges[slug];

  if (!challenge) {
    return null;
  }

  return {
    ...challenge,
    date: dateOverride ?? challenge.date,
  };
}

function getMockArchive(slug: string): ChallengeArchiveItem[] {
  const challenge = mockDailyChallenges[slug];

  if (!challenge) {
    return [];
  }

  return [
    {
      date: challenge.date,
      title: challenge.title,
      description: challenge.description,
      estimatedMinutes: challenge.estimatedMinutes,
      difficulty: challenge.difficulty,
      type: challenge.type,
    },
  ];
}

export function getGames(): GameDefinition[] {
  return gameDefinitions;
}

export function getGameBySlug(slug: string): GameDefinition | undefined {
  return gameDefinitions.find((game) => game.slug === slug);
}

export async function getTodaysChallenge(slug: string): Promise<DailyChallenge | null> {
  return getChallengeByDate(slug, getTodayInEastern(), { fallbackToMockToday: true });
}

export async function getChallengeByDate(
  slug: string,
  challengeDate: string,
  options?: { fallbackToMockToday?: boolean },
): Promise<DailyChallenge | null> {
  const supabase = createClient();

  if (!supabase) {
    return getMockChallenge(slug, options?.fallbackToMockToday ? challengeDate : undefined);
  }

  const { data, error } = await supabase
    .from('daily_challenges')
    .select('challenge_date, title, description, rules, estimated_minutes, difficulty, type, payload')
    .eq('slug', slug)
    .eq('challenge_date', challengeDate)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error(`Unable to load challenge for ${slug} on ${challengeDate}`, error.message);
    return getMockChallenge(slug, options?.fallbackToMockToday ? challengeDate : undefined);
  }

  if (!data) {
    return getMockChallenge(slug, options?.fallbackToMockToday ? challengeDate : undefined);
  }

  return mapRowToChallenge(data as DailyChallengeRow);
}

export async function getChallengeArchive(slug: string): Promise<ChallengeArchiveItem[]> {
  const supabase = createClient();

  if (!supabase) {
    return getMockArchive(slug);
  }

  const { data, error } = await supabase
    .from('daily_challenges')
    .select('challenge_date, title, description, estimated_minutes, difficulty, type')
    .eq('slug', slug)
    .eq('status', 'published')
    .order('challenge_date', { ascending: false });

  if (error) {
    console.error(`Unable to load archive for ${slug}`, error.message);
    return getMockArchive(slug);
  }

  if (!data || data.length === 0) {
    return getMockArchive(slug);
  }

  return data.map((row) => ({
    date: row.challenge_date,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimated_minutes,
    difficulty: row.difficulty,
    type: row.type,
  })) as ChallengeArchiveItem[];
}
