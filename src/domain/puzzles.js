import { parseBoard } from "./sudoku.js";
import { loadPuzzleData, PUZZLE_SOURCE } from "./puzzle-data.js";

export { PUZZLE_SOURCE };

export const DIFFICULTY_LABELS = {
  beginner: "入门",
  easy: "简单",
  medium: "中等",
  hard: "困难",
  diabolical: "地狱",
};

function hydratePuzzle(record, difficulty, number) {
  const [sourceHash, puzzle, solution, rating] = record;
  return {
    id: `sudoku-exchange-${sourceHash}`,
    sourceHash,
    difficulty,
    number,
    rating,
    puzzle: parseBoard(puzzle),
    solution: parseBoard(solution),
  };
}

export async function getPuzzle(difficulty, excludedId = null, random = Math.random) {
  const collection = await loadPuzzleData(difficulty);
  const candidates = collection.filter(
    (record) => `sudoku-exchange-${record[0]}` !== excludedId,
  );
  const source = candidates.length > 0 ? candidates : collection;
  const selected = source[Math.floor(random() * source.length)];
  return hydratePuzzle(selected, difficulty, collection.indexOf(selected) + 1);
}

export async function allPuzzles() {
  const entries = await Promise.all(
    Object.keys(DIFFICULTY_LABELS).map(async (difficulty) => [
      difficulty,
      await loadPuzzleData(difficulty),
    ]),
  );
  return entries.flatMap(([difficulty, puzzles]) =>
    puzzles.map((puzzle, index) => hydratePuzzle(puzzle, difficulty, index + 1)),
  );
}

export async function puzzlesForDifficulty(difficulty) {
  const puzzles = await loadPuzzleData(difficulty);
  return puzzles.map((puzzle, index) => hydratePuzzle(puzzle, difficulty, index + 1));
}

export async function getPuzzleById(puzzleId, difficulty) {
  const puzzles = await loadPuzzleData(difficulty);
  const index = puzzles.findIndex(
    (record) => `sudoku-exchange-${record[0]}` === puzzleId,
  );
  if (index !== -1) return hydratePuzzle(puzzles[index], difficulty, index + 1);
  throw new Error("未知题目");
}
