import test from "node:test";
import assert from "node:assert/strict";
import { createStorage } from "../src/infrastructure/storage.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("当前进度可以保存、读取和清除", () => {
  const persistence = createStorage(createMemoryStorage());
  const game = { version: 1, puzzleId: "easy-01" };
  persistence.saveActive(game);
  assert.deepEqual(persistence.loadActive(), game);
  persistence.clearActive();
  assert.equal(persistence.loadActive(), null);
});

test("完成历史按最新优先保存并限制为 100 条", () => {
  const persistence = createStorage(createMemoryStorage());
  for (let index = 0; index < 105; index += 1) {
    persistence.addHistory({ puzzleId: `puzzle-${index}` });
  }
  const history = persistence.loadHistory();
  assert.equal(history.length, 100);
  assert.equal(history[0].puzzleId, "puzzle-104");
  assert.equal(history[99].puzzleId, "puzzle-5");
});

test("损坏的本地数据会安全回退", () => {
  const storage = createMemoryStorage();
  storage.setItem("sudoku-notebook:active:v1", "{broken");
  storage.setItem("sudoku-notebook:history:v1", "{}");
  const persistence = createStorage(storage);
  assert.equal(persistence.loadActive(), null);
  assert.deepEqual(persistence.loadHistory(), []);
});
