export type GameType = 'picture-crossword' | 'clue-ladder' | 'category-sprint';

export interface ImageClue {
  id: string;
  src: string;
  alt: string;
}

export interface PictureCrosswordEntry {
  id: string;
  label: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  category?: string;
  menuLabel?: string;
  helperText?: string;
  imageClues: ImageClue[];
}

export interface PictureCrosswordConfig {
  width: number;
  height: number;
  scoreStart: number;
  revealPenalty: number;
  minScorePerWord: number;
  entries: PictureCrosswordEntry[];
}

export interface ClueLadderChallenge {
  answer: string;
  clues: string[];
  category: string;
}

export interface CategorySprintChallenge {
  prompt: string;
  answers: string[];
  category: string;
}

export interface DailyChallenge {
  date: string;
  title: string;
  description: string;
  rules: string[];
  estimatedMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: GameType;
  pictureCrossword?: PictureCrosswordConfig;
  clueLadder?: ClueLadderChallenge;
  categorySprint?: CategorySprintChallenge;
}

export interface GameDefinition {
  slug: string;
  name: string;
  shortDescription: string;
  type: GameType;
  emoji: string;
}

export interface GameResult {
  slug: string;
  date: string;
  title: string;
  score: number;
  total: number;
  summary: string;
  completedAt: string;
}

export interface ChallengeArchiveItem {
  date: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: DailyChallenge['difficulty'];
  type: GameType;
}

export interface DailyChallengeRow {
  challenge_date: string;
  title: string;
  description: string;
  rules: string[];
  estimated_minutes: number;
  difficulty: DailyChallenge['difficulty'];
  type: GameType;
  payload: PictureCrosswordConfig | ClueLadderChallenge | CategorySprintChallenge;
}
