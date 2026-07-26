import { parseBoard } from "./sudoku.js";

const PUZZLES = {
  easy: [
    {
      id: "easy-01",
      puzzle: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
      solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    },
    {
      id: "easy-02",
      puzzle: "..3.2.6..9..3.5..1..18.64....81.29..7.......8..67.82....26.95..8..2.3..9..5.1.3..",
      solution: "483921657967345821251876493548132976729564138136798245372689514814253769695417382",
    },
  ],
  medium: [
    {
      id: "medium-01",
      puzzle: "2...8.3...6..7..84.3.5..2.9...1.54.8.........4.27.6...3.1..7.4.72..4..6...4.1...3",
      solution: "245981376169273584837564219976125438513498627482736951391657842728349165654812793",
    },
    {
      id: "medium-02",
      puzzle: ".2.6.8...58...97......4....37....5..6.......4..8....13....2......98...36...3.6.9.",
      solution: "123678945584239761967145328372461589691583274458792613836924157219857436745316892",
    },
  ],
  hard: [
    {
      id: "hard-01",
      puzzle: "1....7.9..3..2...8..96..5....53..9...1..8...26....4...3......1..4......7..7...3..",
      solution: "162857493534129678789643521475312986913586742628794135356478219241935867897261354",
    },
    {
      id: "hard-02",
      puzzle: "8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..",
      solution: "812753649943682175675491283154237896369845721287169534521974368438526917796318452",
    },
  ],
};

export const DIFFICULTY_LABELS = { easy: "简单", medium: "中等", hard: "困难" };

export function getPuzzle(difficulty, excludedId = null, random = Math.random) {
  const collection = PUZZLES[difficulty];
  if (!collection) throw new Error("未知难度");
  const candidates = collection.filter((item) => item.id !== excludedId);
  const source = candidates.length > 0 ? candidates : collection;
  const selected = source[Math.floor(random() * source.length)];
  return {
    ...selected,
    puzzle: parseBoard(selected.puzzle),
    solution: parseBoard(selected.solution),
  };
}

export function allPuzzles() {
  return Object.entries(PUZZLES).flatMap(([difficulty, puzzles]) =>
    puzzles.map((puzzle) => ({ ...puzzle, difficulty })),
  );
}
