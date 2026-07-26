import test from "node:test";
import assert from "node:assert/strict";
import {
  clearCell,
  consumeInstructionDisplay,
  createGame,
  elapsedSeconds,
  resetGame,
  restoreGame,
  submitGame,
  toggleNote,
  toggleValue,
} from "../src/application/game.js";

const fixedNow = () => 1_000_000;
const fixedRandom = () => 0;

test("给定数字不可修改", async () => {
  const game = await createGame("easy", null, fixedNow, fixedRandom);
  const given = game.puzzle.findIndex(Boolean);
  assert.equal(toggleValue(game, given, 9), game);
});

test("短按语义切换候选数字", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  const empty = game.puzzle.findIndex((value) => value === 0);
  game = toggleNote(game, empty, 3);
  assert.deepEqual(game.notes[empty], [3]);
  game = toggleNote(game, empty, 5);
  assert.deepEqual(game.notes[empty], [3, 5]);
  game = toggleNote(game, empty, 3);
  assert.deepEqual(game.notes[empty], [5]);
});

test("长按语义填写、替换或取消确定数字，并清除候选", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  const empty = game.puzzle.findIndex((value) => value === 0);
  game = toggleNote(game, empty, 5);
  game = toggleValue(game, empty, 8);
  assert.equal(game.board[empty], 8);
  assert.deepEqual(game.notes[empty], []);
  game = toggleValue(game, empty, 3);
  assert.equal(game.board[empty], 3);
  game = toggleValue(game, empty, 3);
  assert.equal(game.board[empty], 0);
});

test("恢复进度保留累计用时并从当前时间继续", async () => {
  const game = await createGame("easy", null, fixedNow, fixedRandom);
  const restored = restoreGame({ ...game, elapsedBeforeResume: 25 }, () => 2_000_000);
  assert.equal(elapsedSeconds(restored, () => 2_010_000), 35);
});

test("清空重做会保留给定数字并重置填写、候选、用时和判错次数", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  const firstEmpty = game.puzzle.findIndex((value) => value === 0);
  const secondEmpty = game.puzzle.findIndex(
    (value, index) => value === 0 && index !== firstEmpty,
  );
  game = toggleValue(game, firstEmpty, 8);
  game = toggleNote(game, secondEmpty, 3);
  game = { ...game, elapsedBeforeResume: 25, mistakes: 2 };

  const reset = resetGame(game, () => 2_000_000);

  assert.deepEqual(reset.board, reset.puzzle);
  assert.ok(reset.notes.every((notes) => notes.length === 0));
  assert.equal(reset.elapsedBeforeResume, 0);
  assert.equal(reset.startedAt, 2_000_000);
  assert.equal(reset.mistakes, 0);
  assert.equal(reset.puzzleId, game.puzzleId);
});

test("清空单元格只清除当前格的填写或候选", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  const firstEmpty = game.puzzle.findIndex((value) => value === 0);
  const secondEmpty = game.puzzle.findIndex(
    (value, index) => value === 0 && index !== firstEmpty,
  );
  game = toggleValue(game, firstEmpty, 8);
  game = toggleNote(game, secondEmpty, 3);

  const valueCleared = clearCell(game, firstEmpty);
  assert.equal(valueCleared.board[firstEmpty], 0);
  assert.deepEqual(valueCleared.notes[secondEmpty], [3]);

  const notesCleared = clearCell(valueCleared, secondEmpty);
  assert.deepEqual(notesCleared.notes[secondEmpty], []);

  const given = game.puzzle.findIndex(Boolean);
  assert.equal(clearCell(game, given), game);
});

test("每局只在前十次按键时显示操作说明", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  for (let count = 1; count <= 10; count += 1) {
    const result = consumeInstructionDisplay(game);
    assert.equal(result.shouldDisplay, true);
    assert.equal(result.game.instructionDisplayCount, count);
    game = result.game;
  }

  const exhausted = consumeInstructionDisplay(game);
  assert.equal(exhausted.shouldDisplay, false);
  assert.equal(exhausted.game, game);

  const reset = resetGame(game);
  assert.equal(reset.instructionDisplayCount, 0);
  assert.equal(consumeInstructionDisplay(reset).shouldDisplay, true);

  const hard = { ...reset, difficulty: "hard" };
  const diabolical = { ...reset, difficulty: "diabolical" };
  assert.equal(consumeInstructionDisplay(hard).shouldDisplay, false);
  assert.equal(consumeInstructionDisplay(hard).game, hard);
  assert.equal(consumeInstructionDisplay(diabolical).shouldDisplay, false);
  assert.equal(consumeInstructionDisplay(diabolical).game, diabolical);
});

test("提交仅返回整体结果，错误提交累计次数", async () => {
  let game = await createGame("easy", null, fixedNow, fixedRandom);
  const wrong = submitGame(game);
  assert.deepEqual(Object.keys(wrong).sort(), ["correct", "game"]);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.game.mistakes, 1);

  game = { ...game, board: [...game.solution] };
  const correct = submitGame(game);
  assert.equal(correct.correct, true);
  assert.equal(correct.game.mistakes, 0);
});
