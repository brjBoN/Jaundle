insert into public.daily_challenges (
  slug,
  challenge_date,
  title,
  description,
  rules,
  estimated_minutes,
  difficulty,
  type,
  status,
  payload
)
values (
  'daily-crossword',
  '2026-03-26',
  'Hidden Picture Crossword',
  'Pick a clue from the Across or Down list, inspect only that clue pack, and guess the answer without knowing its length. Correct guesses reveal the matching word on the board.',
  '[
    "Choose a clue from the Across or Down list to load its image clue pack.",
    "Each word starts with only one image visible.",
    "Reveal extra images only if you need them, because each extra image lowers the score for that word.",
    "The crossword board stays hidden until you solve a word correctly.",
    "Solved words reveal their boxes, letters, and clue numbers on the board."
  ]'::jsonb,
  6,
  'Medium',
  'picture-crossword',
  'published',
  $$
  {
    "width": 7,
    "height": 7,
    "scoreStart": 10,
    "revealPenalty": 2,
    "minScorePerWord": 4,
    "entries": [
      {
        "id": "entry-1",
        "label": "Food image clue",
        "menuLabel": "Crisp fruit or pie filling",
        "helperText": "A familiar food word hidden in the puzzle.",
        "answer": "APPLE",
        "row": 1,
        "col": 1,
        "direction": "across",
        "category": "Food",
        "imageClues": [
          { "id": "apple-1", "src": "/clues/apple-1.svg", "alt": "A bright red fruit." },
          { "id": "apple-2", "src": "/clues/apple-2.svg", "alt": "A slice of pie." },
          { "id": "apple-3", "src": "/clues/apple-3.svg", "alt": "Rows of orchard trees." },
          { "id": "apple-4", "src": "/clues/apple-4.svg", "alt": "A cup of juice." }
        ]
      },
      {
        "id": "entry-2",
        "label": "Animal image clue",
        "menuLabel": "Majestic bird of prey",
        "helperText": "Think of a large soaring bird.",
        "answer": "EAGLE",
        "row": 0,
        "col": 1,
        "direction": "down",
        "category": "Animal",
        "imageClues": [
          { "id": "eagle-1", "src": "/clues/eagle-1.svg", "alt": "A bird with wings spread." },
          { "id": "eagle-2", "src": "/clues/eagle-2.svg", "alt": "A feather." },
          { "id": "eagle-3", "src": "/clues/eagle-3.svg", "alt": "High mountains and open sky." },
          { "id": "eagle-4", "src": "/clues/eagle-4.svg", "alt": "A patriotic shield and stars." }
        ]
      },
      {
        "id": "entry-3",
        "label": "Nature image clue",
        "menuLabel": "Living thing with roots and leaves",
        "helperText": "Something you might water near a sunny window.",
        "answer": "PLANT",
        "row": 1,
        "col": 3,
        "direction": "down",
        "category": "Nature",
        "imageClues": [
          { "id": "plant-1", "src": "/clues/plant-1.svg", "alt": "A potted plant." },
          { "id": "plant-2", "src": "/clues/plant-2.svg", "alt": "A watering can." },
          { "id": "plant-3", "src": "/clues/plant-3.svg", "alt": "A sun and leaves." },
          { "id": "plant-4", "src": "/clues/plant-4.svg", "alt": "A fresh sprout." }
        ]
      },
      {
        "id": "entry-4",
        "label": "Occasion image clue",
        "menuLabel": "Scheduled happening",
        "helperText": "Tickets, dates, and a stage all point to this word.",
        "answer": "EVENT",
        "row": 1,
        "col": 5,
        "direction": "down",
        "category": "Occasion",
        "imageClues": [
          { "id": "event-1", "src": "/clues/event-1.svg", "alt": "A paper ticket." },
          { "id": "event-2", "src": "/clues/event-2.svg", "alt": "A calendar date." },
          { "id": "event-3", "src": "/clues/event-3.svg", "alt": "Confetti bursting." },
          { "id": "event-4", "src": "/clues/event-4.svg", "alt": "A microphone on a stage." }
        ]
      },
      {
        "id": "entry-5",
        "label": "Action image clue",
        "menuLabel": "Go away or depart",
        "helperText": "A movement word connected to travel and exits.",
        "answer": "LEAVE",
        "row": 3,
        "col": 1,
        "direction": "across",
        "category": "Action",
        "imageClues": [
          { "id": "leave-1", "src": "/clues/leave-1.svg", "alt": "A door opening." },
          { "id": "leave-2", "src": "/clues/leave-2.svg", "alt": "Packed luggage." },
          { "id": "leave-3", "src": "/clues/leave-3.svg", "alt": "Palm trees and a vacation scene." },
          { "id": "leave-4", "src": "/clues/leave-4.svg", "alt": "An airplane lifting off." }
        ]
      }
    ]
  }
  $$::jsonb
)
on conflict (slug, challenge_date) do update
set
  title = excluded.title,
  description = excluded.description,
  rules = excluded.rules,
  estimated_minutes = excluded.estimated_minutes,
  difficulty = excluded.difficulty,
  type = excluded.type,
  status = excluded.status,
  payload = excluded.payload,
  updated_at = now();
