const LEGACY_ACTIVE_KEY = "sudoku-notebook:active:v1";
const LEGACY_HISTORY_KEY = "sudoku-notebook:history:v1";
const PROGRESS_KEY = "sudoku-notebook:progress:v2";
const STATISTICS_KEY = "sudoku-notebook:statistics:v2";
const MIGRATION_KEY = "sudoku-notebook:migrated:v2";

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readObject(storage, key) {
  const value = readJson(storage, key, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function completionStatistics(records) {
  const statistics = {};
  for (const record of records) {
    if (!record?.puzzleId || !Number.isFinite(record.elapsedSeconds)) continue;
    const current = statistics[record.puzzleId] ?? { challengeCount: 0 };
    const isBest =
      !Number.isFinite(current.bestSeconds) || record.elapsedSeconds < current.bestSeconds;
    statistics[record.puzzleId] = {
      challengeCount: current.challengeCount + 1,
      bestSeconds: isBest ? record.elapsedSeconds : current.bestSeconds,
      bestCompletedAt: isBest ? record.completedAt : current.bestCompletedAt,
    };
  }
  return statistics;
}

export function createStorage(storage = window.localStorage) {
  function migrateLegacyData() {
    if (storage.getItem(MIGRATION_KEY) !== null) return;
    const progress = readObject(storage, PROGRESS_KEY);
    const legacyActive = readJson(storage, LEGACY_ACTIVE_KEY, null);
    if (legacyActive?.puzzleId && !progress[legacyActive.puzzleId]) {
      progress[legacyActive.puzzleId] = legacyActive;
      storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }

    const statistics = readObject(storage, STATISTICS_KEY);
    const legacyHistory = readJson(storage, LEGACY_HISTORY_KEY, []);
    const migrated = completionStatistics(Array.isArray(legacyHistory) ? legacyHistory : []);
    for (const [puzzleId, record] of Object.entries(migrated)) {
      if (!statistics[puzzleId]) statistics[puzzleId] = record;
    }
    storage.setItem(STATISTICS_KEY, JSON.stringify(statistics));
    storage.setItem(MIGRATION_KEY, "true");
  }

  migrateLegacyData();

  return {
    loadProgress(puzzleId) {
      return readObject(storage, PROGRESS_KEY)[puzzleId] ?? null;
    },
    loadAllProgress() {
      return readObject(storage, PROGRESS_KEY);
    },
    saveProgress(game) {
      const progress = readObject(storage, PROGRESS_KEY);
      progress[game.puzzleId] = game;
      storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    },
    clearProgress(puzzleId) {
      const progress = readObject(storage, PROGRESS_KEY);
      delete progress[puzzleId];
      storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    },
    loadStatistics() {
      return readObject(storage, STATISTICS_KEY);
    },
    recordCompletion(record) {
      const statistics = readObject(storage, STATISTICS_KEY);
      const current = statistics[record.puzzleId] ?? { challengeCount: 0 };
      const isBest =
        !Number.isFinite(current.bestSeconds) || record.elapsedSeconds < current.bestSeconds;
      statistics[record.puzzleId] = {
        challengeCount: current.challengeCount + 1,
        bestSeconds: isBest ? record.elapsedSeconds : current.bestSeconds,
        bestCompletedAt: isBest ? record.completedAt : current.bestCompletedAt,
      };
      storage.setItem(STATISTICS_KEY, JSON.stringify(statistics));
      return statistics[record.puzzleId];
    },
  };
}
