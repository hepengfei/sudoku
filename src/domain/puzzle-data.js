// 此文件由 scripts/import-puzzles.mjs 生成，请勿手工编辑。
// 固定抽样种子：sudoku-book-v1-2026-07-26
// 上游提交：d8c8ebaee0c08c412cfba96af1923dfa61c83317
export const PUZZLE_SOURCE = {"name":"Sudoku Exchange \"Puzzle Bank\"","url":"https://github.com/grantm/sudoku-exchange-puzzle-bank","revision":"d8c8ebaee0c08c412cfba96af1923dfa61c83317","seed":"sudoku-book-v1-2026-07-26","sampleSize":1000,"sourceCounts":{"easy":100000,"medium":352643,"hard":321592,"diabolical":119681}};

const LOADERS = {
  easy: () => import("./puzzle-data/easy.js").then((module) => module.default),
  medium: () => import("./puzzle-data/medium.js").then((module) => module.default),
  hard: () => import("./puzzle-data/hard.js").then((module) => module.default),
  diabolical: () => import("./puzzle-data/diabolical.js").then((module) => module.default),
};

const cache = new Map();

export function loadPuzzleData(difficulty) {
  const loader = LOADERS[difficulty];
  if (!loader) return Promise.reject(new Error("未知难度"));
  if (!cache.has(difficulty)) cache.set(difficulty, loader());
  return cache.get(difficulty);
}
