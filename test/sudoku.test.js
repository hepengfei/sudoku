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
import {
  allPuzzles,
  DIFFICULTY_LABELS,
  PUZZLE_SOURCE,
  puzzlesForDifficulty,
} from "../src/domain/puzzles.js";

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

test("内置题目格式正确、答案匹配且解唯一", async () => {
  for (const entry of await allPuzzles()) {
    const result = solveBoard(entry.puzzle);
    assert.equal(result.status, "unique", entry.id);
    assert.deepEqual(result.solutions[0], entry.solution, entry.id);
  }
});

test("四个难度各包含 1000 道不重复题目", async () => {
  assert.deepEqual(DIFFICULTY_LABELS, {
    easy: "简单",
    medium: "中等",
    hard: "困难",
    diabolical: "地狱",
  });
  const puzzles = await allPuzzles();
  assert.equal(puzzles.length, 4000);
  assert.equal(new Set(puzzles.map((entry) => entry.id)).size, 4000);
  assert.equal(new Set(puzzles.map((entry) => serializeBoard(entry.puzzle))).size, 4000);
  for (const difficulty of Object.keys(DIFFICULTY_LABELS)) {
    assert.equal((await puzzlesForDifficulty(difficulty)).length, 1000);
  }
});

test("难度评分与上游四档映射一致", async () => {
  assert.equal(PUZZLE_SOURCE.sampleSize, 1000);
  assert.equal(PUZZLE_SOURCE.seed, "sudoku-book-v1-2026-07-26");
  assert.ok((await puzzlesForDifficulty("easy")).every((entry) => entry.rating < 1.5));
  assert.ok(
    (await puzzlesForDifficulty("medium")).every(
      (entry) => entry.rating >= 1.5 && entry.rating < 2.5,
    ),
  );
  assert.ok(
    (await puzzlesForDifficulty("hard")).every(
      (entry) => entry.rating >= 2.5 && entry.rating < 5,
    ),
  );
  assert.ok(
    (await puzzlesForDifficulty("diabolical")).every((entry) => entry.rating >= 5),
  );
});
