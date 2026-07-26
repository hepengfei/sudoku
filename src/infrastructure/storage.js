const ACTIVE_KEY = "sudoku-notebook:active:v1";
const HISTORY_KEY = "sudoku-notebook:history:v1";

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function createStorage(storage = window.localStorage) {
  return {
    loadActive() {
      return readJson(storage, ACTIVE_KEY, null);
    },
    saveActive(game) {
      storage.setItem(ACTIVE_KEY, JSON.stringify(game));
    },
    clearActive() {
      storage.removeItem(ACTIVE_KEY);
    },
    loadHistory() {
      const history = readJson(storage, HISTORY_KEY, []);
      return Array.isArray(history) ? history : [];
    },
    addHistory(record) {
      const history = this.loadHistory();
      storage.setItem(HISTORY_KEY, JSON.stringify([record, ...history].slice(0, 100)));
    },
  };
}
