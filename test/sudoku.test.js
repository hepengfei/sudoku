import test from "node:test";
import assert from "node:assert/strict";
import {
  candidatesFor,
  duplicateIndexes,
  isCompletedBoard,
  parseBoard,
  serializeBoard,
  solveBoard,
} from "../src/domain/sudoku.js";
import { allPuzzles } from "../src/domain/puzzles.js";

const solved = parseBoard(
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
);

test("棋盘解析和序列化可以往返", () => {
  const source = `53..7....
    6..195...
    .98....6.
    8...6...3
    4..8.3..1
    7...2...6
    .6....28.
    ...419..5
    ....8..79`;
  assert.equal(serializeBoard(parseBoard(source)), source.replace(/\s/g, ""));
  assert.throws(() => parseBoard("123"), /81/);
  assert.throws(() => parseBoard("x".repeat(81)), /81/);
});

test("分别识别行、列和宫内重复", () => {
  for (const pair of [
    [0, 1],
    [0, 9],
    [0, 10],
  ]) {
    const board = Array(81).fill(0);
    board[pair[0]] = 5;
    board[pair[1]] = 5;
    assert.deepEqual([...duplicateIndexes(board)].sort((a, b) => a - b), pair);
  }
});

test("候选数排除同行、同列和同宫数字", () => {
  const board = Array(81).fill(0);
  board[1] = 1;
  board[9] = 2;
  board[10] = 3;
  assert.deepEqual([...candidatesFor(board, 0)], [4, 5, 6, 7, 8, 9]);
});

test("完整棋盘校验", () => {
  assert.equal(isCompletedBoard(solved), true);
  const incomplete = [...solved];
  incomplete[0] = 0;
  assert.equal(isCompletedBoard(incomplete), false);
});

test("求解器区分无效、无解、唯一解和多解", () => {
  const invalid = Array(81).fill(0);
  invalid[0] = invalid[1] = 1;
  assert.equal(solveBoard(invalid).status, "invalid");

  const unsatisfiable = parseBoard(
    "12345678." +
      "........9" +
      ".........".repeat(7),
  );
  assert.equal(solveBoard(unsatisfiable).status, "unsatisfiable");

  const almostSolved = [...solved];
  almostSolved[0] = 0;
  assert.equal(solveBoard(almostSolved).status, "unique");
  assert.equal(solveBoard(Array(81).fill(0)).status, "multiple");
});

test("内置题目格式正确、答案匹配且解唯一", () => {
  for (const entry of allPuzzles()) {
    const puzzle = parseBoard(entry.puzzle);
    const solution = parseBoard(entry.solution);
    const result = solveBoard(puzzle);
    assert.equal(result.status, "unique", entry.id);
    assert.deepEqual(result.solutions[0], solution, entry.id);
  }
});
