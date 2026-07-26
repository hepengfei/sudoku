import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  elapsedSeconds,
  eraseCell,
  restoreGame,
  setValue,
  submitGame,
  toggleNote,
} from "../src/application/game.js";

const fixedNow = () => 1_000_000;
const fixedRandom = () => 0;

test("给定数字不可修改或清除", () => {
  const game = createGame("easy", null, fixedNow, fixedRandom);
  const given = game.puzzle.findIndex(Boolean);
  assert.equal(setValue(game, given, 9), game);
  assert.equal(eraseCell(game, given), game);
});

test("数字和候选输入互斥，候选可以切换", () => {
  let game = createGame("easy", null, fixedNow, fixedRandom);
  const empty = game.puzzle.findIndex((value) => value === 0);
  game = toggleNote(game, empty, 3);
  assert.deepEqual(game.notes[empty], [3]);
  game = toggleNote(game, empty, 5);
  assert.deepEqual(game.notes[empty], [3, 5]);
  game = toggleNote(game, empty, 3);
  assert.deepEqual(game.notes[empty], [5]);
  game = setValue(game, empty, 8);
  assert.equal(game.board[empty], 8);
  assert.deepEqual(game.notes[empty], []);
});

test("恢复进度保留累计用时并从当前时间继续", () => {
  const game = createGame("easy", null, fixedNow, fixedRandom);
  const restored = restoreGame({ ...game, elapsedBeforeResume: 25 }, () => 2_000_000);
  assert.equal(elapsedSeconds(restored, () => 2_010_000), 35);
});

test("提交仅返回整体结果，错误提交累计次数", () => {
  let game = createGame("easy", null, fixedNow, fixedRandom);
  const wrong = submitGame(game);
  assert.deepEqual(Object.keys(wrong).sort(), ["correct", "game"]);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.game.mistakes, 1);

  game = { ...game, board: [...game.solution] };
  const correct = submitGame(game);
  assert.equal(correct.correct, true);
  assert.equal(correct.game.mistakes, 0);
});
