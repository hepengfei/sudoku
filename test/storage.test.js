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

test("每道题的进度可以独立保存、读取和清除", () => {
  const persistence = createStorage(createMemoryStorage());
  const first = { version: 2, puzzleId: "easy-01" };
  const second = { version: 2, puzzleId: "medium-01" };
  persistence.saveProgress(first);
  persistence.saveProgress(second);
  assert.deepEqual(persistence.loadProgress(first.puzzleId), first);
  assert.deepEqual(persistence.loadProgress(second.puzzleId), second);
  persistence.clearProgress(first.puzzleId);
  assert.equal(persistence.loadProgress(first.puzzleId), null);
  assert.deepEqual(Object.keys(persistence.loadAllProgress()), [second.puzzleId]);
});

test("正确挑战累积次数且仅在更快时更新最佳记录", () => {
  const persistence = createStorage(createMemoryStorage());
  persistence.recordCompletion({
    puzzleId: "easy-01",
    elapsedSeconds: 90,
    completedAt: "2026-07-01T10:00:00.000Z",
  });
  persistence.recordCompletion({
    puzzleId: "easy-01",
    elapsedSeconds: 120,
    completedAt: "2026-07-02T10:00:00.000Z",
  });
  persistence.recordCompletion({
    puzzleId: "easy-01",
    elapsedSeconds: 70,
    completedAt: "2026-07-03T10:00:00.000Z",
  });
  assert.deepEqual(persistence.loadStatistics()["easy-01"], {
    challengeCount: 3,
    bestSeconds: 70,
    bestCompletedAt: "2026-07-03T10:00:00.000Z",
  });
});

test("v1 单题进度与完成历史会迁移且不会重复累加", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    "sudoku-notebook:active:v1",
    JSON.stringify({ version: 1, puzzleId: "medium-01", board: [] }),
  );
  storage.setItem(
    "sudoku-notebook:history:v1",
    JSON.stringify([
      {
        puzzleId: "easy-01",
        elapsedSeconds: 95,
        completedAt: "2026-07-01T10:00:00.000Z",
      },
      {
        puzzleId: "easy-01",
        elapsedSeconds: 80,
        completedAt: "2026-07-02T10:00:00.000Z",
      },
    ]),
  );
  const first = createStorage(storage);
  assert.equal(first.loadProgress("medium-01").version, 1);
  assert.deepEqual(first.loadStatistics()["easy-01"], {
    challengeCount: 2,
    bestSeconds: 80,
    bestCompletedAt: "2026-07-02T10:00:00.000Z",
  });
  const second = createStorage(storage);
  assert.equal(second.loadStatistics()["easy-01"].challengeCount, 2);
});

test("损坏的新旧本地数据会安全回退", () => {
  const storage = createMemoryStorage();
  storage.setItem("sudoku-notebook:active:v1", "{broken");
  storage.setItem("sudoku-notebook:history:v1", "{}");
  storage.setItem("sudoku-notebook:progress:v2", "[]");
  storage.setItem("sudoku-notebook:statistics:v2", "{broken");
  const persistence = createStorage(storage);
  assert.deepEqual(persistence.loadAllProgress(), {});
  assert.deepEqual(persistence.loadStatistics(), {});
});
