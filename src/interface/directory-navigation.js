export const PUZZLES_PER_PAGE = 50;

export function pageForPuzzle(puzzleNumber) {
  return Math.ceil(puzzleNumber / PUZZLES_PER_PAGE);
}
