import { CELL_COUNT, isCompletedBoard } from "../domain/sudoku.js";
import { getPuzzle } from "../domain/puzzles.js";

function emptyNotes() {
  return Array.from({ length: CELL_COUNT }, () => []);
}

export async function createGame(
  difficulty = "easy",
  excludedId = null,
  now = Date.now,
  random,
) {
  const selected = await getPuzzle(difficulty, excludedId, random);
  return createGameFromPuzzle(selected, now);
}

export function createGameFromPuzzle(selected, now = Date.now) {
  return {
    version: 2,
    puzzleId: selected.id,
    difficulty: selected.difficulty,
    puzzleNumber: selected.number ?? 1,
    puzzle: selected.puzzle,
    solution: selected.solution,
    board: [...selected.puzzle],
    notes: emptyNotes(),
    startedAt: now(),
    elapsedBeforeResume: 0,
    mistakes: 0,
    instructionDisplayCount: 0,
  };
}

export function restoreGame(saved, now = Date.now) {
  if (
    !saved ||
    ![1, 2].includes(saved.version) ||
    !Array.isArray(saved.puzzle) ||
    !Array.isArray(saved.solution) ||
    !Array.isArray(saved.board) ||
    saved.board.length !== CELL_COUNT
  ) {
    return null;
  }
  return {
    ...saved,
    version: 2,
    puzzleNumber: saved.puzzleNumber ?? 1,
    notes: Array.isArray(saved.notes) && saved.notes.length === CELL_COUNT ? saved.notes : emptyNotes(),
    instructionDisplayCount: Number.isInteger(saved.instructionDisplayCount)
      ? Math.max(0, saved.instructionDisplayCount)
      : 0,
    startedAt: now(),
  };
}

export function elapsedSeconds(game, now = Date.now) {
  return game.elapsedBeforeResume + Math.floor((now() - game.startedAt) / 1000);
}

export function pauseGame(game, now = Date.now) {
  return { ...game, elapsedBeforeResume: elapsedSeconds(game, now), startedAt: now() };
}

export function resetGame(game, now = Date.now) {
  return {
    ...game,
    board: [...game.puzzle],
    notes: emptyNotes(),
    startedAt: now(),
    elapsedBeforeResume: 0,
    mistakes: 0,
    instructionDisplayCount: 0,
  };
}

export function consumeInstructionDisplay(game, limit = 10) {
  if (["hard", "diabolical"].includes(game.difficulty)) {
    return { game, shouldDisplay: false };
  }
  const count = game.instructionDisplayCount ?? 0;
  if (count >= limit) return { game, shouldDisplay: false };
  return {
    game: { ...game, instructionDisplayCount: count + 1 },
    shouldDisplay: true,
  };
}

export function clearCell(game, index) {
  if (game.puzzle[index] !== 0) return game;
  const board = [...game.board];
  board[index] = 0;
  const notes = game.notes.map((entry, noteIndex) =>
    noteIndex === index ? [] : [...entry],
  );
  return { ...game, board, notes };
}

export function toggleValue(game, index, value) {
  if (game.puzzle[index] !== 0) return game;
  const board = [...game.board];
  board[index] = board[index] === value ? 0 : value;
  const notes = game.notes.map((entry, noteIndex) => (noteIndex === index ? [] : [...entry]));
  return { ...game, board, notes };
}

export function toggleNote(game, index, value) {
  if (game.puzzle[index] !== 0 || game.board[index] !== 0) return game;
  const notes = game.notes.map((entry) => [...entry]);
  notes[index] = notes[index].includes(value)
    ? notes[index].filter((candidate) => candidate !== value)
    : [...notes[index], value].sort();
  return { ...game, notes };
}

export function submitGame(game) {
  const correct =
    isCompletedBoard(game.board) && game.board.every((value, index) => value === game.solution[index]);
  return correct ? { game, correct } : { game: { ...game, mistakes: game.mistakes + 1 }, correct };
}
