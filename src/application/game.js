import { CELL_COUNT, isCompletedBoard } from "../domain/sudoku.js";
import { getPuzzle } from "../domain/puzzles.js";

function emptyNotes() {
  return Array.from({ length: CELL_COUNT }, () => []);
}

export function createGame(difficulty = "easy", excludedId = null, now = Date.now, random) {
  const selected = getPuzzle(difficulty, excludedId, random);
  return {
    version: 1,
    puzzleId: selected.id,
    difficulty,
    puzzle: selected.puzzle,
    solution: selected.solution,
    board: [...selected.puzzle],
    notes: emptyNotes(),
    startedAt: now(),
    elapsedBeforeResume: 0,
    mistakes: 0,
  };
}

export function restoreGame(saved, now = Date.now) {
  if (
    !saved ||
    saved.version !== 1 ||
    !Array.isArray(saved.puzzle) ||
    !Array.isArray(saved.solution) ||
    !Array.isArray(saved.board) ||
    saved.board.length !== CELL_COUNT
  ) {
    return null;
  }
  return {
    ...saved,
    notes: Array.isArray(saved.notes) && saved.notes.length === CELL_COUNT ? saved.notes : emptyNotes(),
    startedAt: now(),
  };
}

export function elapsedSeconds(game, now = Date.now) {
  return game.elapsedBeforeResume + Math.floor((now() - game.startedAt) / 1000);
}

export function pauseGame(game, now = Date.now) {
  return { ...game, elapsedBeforeResume: elapsedSeconds(game, now), startedAt: now() };
}

export function setValue(game, index, value) {
  if (game.puzzle[index] !== 0) return game;
  const board = [...game.board];
  board[index] = value;
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

export function eraseCell(game, index) {
  if (game.puzzle[index] !== 0) return game;
  const board = [...game.board];
  const notes = game.notes.map((entry) => [...entry]);
  board[index] = 0;
  notes[index] = [];
  return { ...game, board, notes };
}

export function submitGame(game) {
  const correct =
    isCompletedBoard(game.board) && game.board.every((value, index) => value === game.solution[index]);
  return correct ? { game, correct } : { game: { ...game, mistakes: game.mistakes + 1 }, correct };
}
