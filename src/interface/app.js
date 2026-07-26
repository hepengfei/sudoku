import {
  clearCell,
  consumeInstructionDisplay,
  createGameFromPuzzle,
  elapsedSeconds,
  pauseGame,
  resetGame,
  restoreGame,
  submitGame,
  toggleNote,
  toggleValue,
} from "../application/game.js";
import {
  DIFFICULTY_LABELS,
  getPuzzleById,
  puzzlesForDifficulty,
} from "../domain/puzzles.js";
import { createStorage } from "../infrastructure/storage.js";
import { pageForPuzzle, PUZZLES_PER_PAGE } from "./directory-navigation.js";
import { createPressController } from "./press-controller.js";

const elements = {
  appShell: document.querySelector(".app-shell"),
  board: document.querySelector("#board"),
  gameMenu: document.querySelector("#game-menu"),
  gameInformation: document.querySelector("#game-information"),
  timer: document.querySelector("#timer"),
  bestTime: document.querySelector("#best-time"),
  status: document.querySelector("#status"),
  confirmation: document.querySelector("#confirmation"),
  confirmationTitle: document.querySelector("#confirmation-title"),
  confirmationMessage: document.querySelector("#confirmation-message"),
  confirmationCancel: document.querySelector("#confirmation-cancel"),
  confirmationConfirm: document.querySelector("#confirmation-confirm"),
  numberPad: document.querySelector("#number-pad"),
  reset: document.querySelector("#reset"),
  submit: document.querySelector("#submit"),
  puzzleTitle: document.querySelector("#puzzle-title"),
  backToDirectory: document.querySelector("#back-to-directory"),
  directoryView: document.querySelector("#directory-view"),
  gameView: document.querySelector("#game-view"),
  difficultyTabs: document.querySelector("#difficulty-tabs"),
  directorySummary: document.querySelector("#directory-summary"),
  puzzleList: document.querySelector("#puzzle-list"),
  pagination: document.querySelector("#pagination"),
};

const persistence = createStorage();
const LONG_PRESS_MILLISECONDS = 500;
const NUMBER_INPUT_HELP = "短按填写候选 · 长按确认数字";
let game = null;
let selectedIndex = -1;
let completed = false;
let selectedDifficulty = "easy";
let selectedPage = 1;
let directoryRenderVersion = 0;
let directoryScrollToTop = false;
let returnToPuzzleId = null;
let currentBestSeconds = null;
let statusTimeoutId = null;
let confirmationAction = null;
let confirmationPreviousFocus = null;
let instructionKnowledge = persistence.loadInstructionKnowledge();

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function formatCompletedAt(value) {
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
}

function save() {
  if (game && !completed) persistence.saveProgress(pauseGame(game));
}

function setStatus(message, duration = 0) {
  clearTimeout(statusTimeoutId);
  statusTimeoutId = null;
  elements.status.textContent = message;
  elements.status.hidden = !message;
  elements.gameInformation.hidden = Boolean(message);
  if (message && duration > 0) {
    statusTimeoutId = setTimeout(() => setStatus(""), duration);
  }
}

function showInstruction(message, control) {
  if (!game || instructionKnowledge[control]) return;
  const result = consumeInstructionDisplay(game);
  game = result.game;
  if (!result.shouldDisplay) return;
  save();
  setStatus(message, 5000);
}

function markInstructionLearned(control, message) {
  instructionKnowledge = persistence.markInstructionLearned(control);
  if (elements.status.textContent === message) setStatus("");
}

function closeConfirmation() {
  if (elements.confirmation.hidden) return;
  elements.confirmation.hidden = true;
  confirmationAction = null;
  confirmationPreviousFocus?.focus();
  confirmationPreviousFocus = null;
}

function showConfirmation({ title, message, confirmLabel, onConfirm }) {
  confirmationPreviousFocus = document.activeElement;
  confirmationAction = onConfirm;
  elements.confirmationTitle.textContent = title;
  elements.confirmationMessage.textContent = message;
  elements.confirmationConfirm.textContent = confirmLabel;
  elements.confirmation.hidden = false;
  elements.confirmationConfirm.focus();
}

function renderBoard() {
  elements.board.replaceChildren();
  game.board.forEach((value, index) => {
    const cell = document.createElement("button");
    const row = Math.floor(index / 9) + 1;
    const column = (index % 9) + 1;
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = index;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `第 ${row} 行第 ${column} 列${value ? `，数字 ${value}` : "，空格"}`);
    if (game.puzzle[index]) cell.classList.add("given");
    if (selectedIndex === index) cell.classList.add("selected");
    if (value) {
      cell.textContent = value;
    } else if (game.notes[index].length) {
      const notes = document.createElement("span");
      notes.className = "notes";
      for (let candidate = 1; candidate <= 9; candidate += 1) {
        const note = document.createElement("span");
        note.textContent = game.notes[index].includes(candidate) ? candidate : "";
        notes.append(note);
      }
      cell.append(notes);
    }
    cell.addEventListener("click", () => {
      selectedIndex = index;
      setStatus("");
      renderBoard();
    });
    elements.board.append(cell);
  });
  elements.puzzleTitle.textContent =
    `${DIFFICULTY_LABELS[game.difficulty]} · 第 ${game.puzzleNumber} 题`;
  elements.bestTime.textContent =
    currentBestSeconds === null ? "--:--" : formatDuration(currentBestSeconds);
}

function enterCandidate(value) {
  if (!game || completed || selectedIndex < 0) return;
  if (elements.status.textContent !== NUMBER_INPUT_HELP) setStatus("");
  game = toggleNote(game, selectedIndex, value);
  save();
  renderBoard();
}

function enterValue(value) {
  if (!game || completed || selectedIndex < 0) return;
  if (elements.status.textContent !== NUMBER_INPUT_HELP) setStatus("");
  game = toggleValue(game, selectedIndex, value);
  save();
  renderBoard();
}

function clearSelectedCell() {
  if (!game || completed || selectedIndex < 0) return;
  game = clearCell(game, selectedIndex);
  save();
  renderBoard();
}

function resetAllCells() {
  if (!game) return;
  if (completed) {
    const statistic = persistence.loadStatistics()[game.puzzleId];
    currentBestSeconds = statistic?.bestSeconds ?? null;
  }
  game = resetGame(game);
  selectedIndex = game.puzzle.findIndex((value) => value === 0);
  completed = false;
  setStatus("已清空全部，可以重新开始。", 5000);
  elements.timer.textContent = "00:00";
  save();
  renderBoard();
}

function submitCurrentGame() {
  if (!game || completed) return;
  const result = submitGame(game);
  game = result.game;
  if (result.correct) {
    const elapsed = elapsedSeconds(game);
    const completedAt = new Date().toISOString();
    completed = true;
    persistence.recordCompletion({
      puzzleId: game.puzzleId,
      elapsedSeconds: elapsed,
      completedAt,
    });
    currentBestSeconds =
      persistence.loadStatistics()[game.puzzleId]?.bestSeconds ?? elapsed;
    persistence.clearProgress(game.puzzleId);
    setStatus(`回答正确 · 用时 ${formatDuration(elapsed)}`);
  } else {
    setStatus("答案不正确，再检查一下吧。");
    save();
  }
  renderBoard();
}

async function openPuzzle(puzzleId, difficulty) {
  closeConfirmation();
  const puzzle = await getPuzzleById(puzzleId, difficulty);
  const saved = persistence.loadProgress(puzzleId);
  const statistic = persistence.loadStatistics()[puzzleId];
  game = restoreGame(saved) ?? createGameFromPuzzle(puzzle);
  currentBestSeconds = statistic?.bestSeconds ?? null;
  selectedIndex = game.puzzle.findIndex((value) => value === 0);
  completed = false;
  setStatus("");
  elements.directoryView.hidden = true;
  elements.gameView.hidden = false;
  elements.gameMenu.hidden = false;
  elements.puzzleTitle.hidden = false;
  save();
  renderBoard();
  elements.timer.textContent = formatDuration(elapsedSeconds(game));
  elements.appShell.scrollTo({ top: 0, behavior: "auto" });
}

function puzzleStatus(puzzleId, progress, statistics) {
  if (statistics[puzzleId]?.challengeCount > 0) return "已完成";
  if (progress[puzzleId]) return "进行中";
  return "未开始";
}

async function renderDirectory() {
  const renderVersion = ++directoryRenderVersion;
  const difficultyToRender = selectedDifficulty;
  elements.difficultyTabs.replaceChildren(
    ...Object.entries(DIFFICULTY_LABELS).map(([difficulty, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "tab";
      button.textContent = label;
      button.className = difficulty === selectedDifficulty ? "active" : "";
      button.setAttribute("aria-selected", String(difficulty === selectedDifficulty));
      button.addEventListener("click", () => {
        selectedDifficulty = difficulty;
        selectedPage = 1;
        directoryScrollToTop = true;
        returnToPuzzleId = null;
        void renderDirectory();
      });
      return button;
    }),
  );
  elements.directorySummary.innerHTML = '<p class="loading-message">正在翻阅题目…</p>';
  elements.puzzleList.replaceChildren();
  elements.pagination.replaceChildren();

  let puzzles;
  try {
    puzzles = await puzzlesForDifficulty(difficultyToRender);
  } catch {
    if (renderVersion === directoryRenderVersion) {
      elements.directorySummary.innerHTML =
        '<p class="loading-message">题库加载失败，请刷新后重试。</p>';
    }
    return;
  }
  if (renderVersion !== directoryRenderVersion) return;

  const progress = persistence.loadAllProgress();
  const statistics = persistence.loadStatistics();
  const completedCount = puzzles.filter(
    (puzzle) => statistics[puzzle.id]?.challengeCount > 0,
  ).length;
  const startedCount = puzzles.filter(
    (puzzle) => progress[puzzle.id] || statistics[puzzle.id]?.challengeCount > 0,
  ).length;

  elements.directorySummary.innerHTML = `
    <div><strong>${puzzles.length}</strong><span>总题数</span></div>
    <div><strong>${startedCount}</strong><span>已开始</span></div>
    <div><strong>${completedCount}</strong><span>已完成</span></div>
    <div><strong>${puzzles.length - completedCount}</strong><span>未完成</span></div>
    <p>完成 ${completedCount} / ${puzzles.length}</p>
  `;

  const pageCount = Math.ceil(puzzles.length / PUZZLES_PER_PAGE);
  selectedPage = Math.min(Math.max(selectedPage, 1), pageCount);
  const pageStart = (selectedPage - 1) * PUZZLES_PER_PAGE;
  const visiblePuzzles = puzzles.slice(pageStart, pageStart + PUZZLES_PER_PAGE);

  let returnTarget = null;
  const puzzleItems = visiblePuzzles.map((puzzle) => {
      const record = statistics[puzzle.id];
      const hasProgress = Boolean(progress[puzzle.id]);
      const status = puzzleStatus(puzzle.id, progress, statistics);
      const item = document.createElement("article");
      item.className = "puzzle-item";
      item.dataset.puzzleId = puzzle.id;
      if (puzzle.id === returnToPuzzleId) {
        item.classList.add("current-puzzle");
        returnTarget = item;
      }
      const action =
        status === "已完成"
          ? hasProgress
            ? "继续挑战"
            : "再次挑战"
          : status === "进行中"
            ? "继续"
            : "开始";
      item.innerHTML = `
        <div class="puzzle-identity">
          <span class="puzzle-number">${String(puzzle.number).padStart(2, "0")}</span>
          <span class="status-badge" data-status="${status}">${status}</span>
        </div>
        <dl>
          <div><dt>挑战次数</dt><dd>${record?.challengeCount ?? 0}</dd></div>
          <div><dt>最短用时</dt><dd>${record ? formatDuration(record.bestSeconds) : "—"}</dd></div>
          <div><dt>最佳完成时间</dt><dd>${record ? formatCompletedAt(record.bestCompletedAt) : "—"}</dd></div>
        </dl>
      `;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "puzzle-action";
      button.textContent = action;
      button.setAttribute("aria-label", `${action}${DIFFICULTY_LABELS[puzzle.difficulty]}第 ${puzzle.number} 题`);
      button.addEventListener("click", () => {
        void openPuzzle(puzzle.id, puzzle.difficulty);
      });
      item.append(button);
      return item;
    });
  elements.puzzleList.replaceChildren(...puzzleItems);

  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "上一页";
  previous.disabled = selectedPage === 1;
  previous.addEventListener("click", () => {
    selectedPage -= 1;
    directoryScrollToTop = true;
    returnToPuzzleId = null;
    void renderDirectory();
  });
  const pageLabel = document.createElement("span");
  pageLabel.textContent = `第 ${selectedPage} / ${pageCount} 页`;
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "下一页";
  next.disabled = selectedPage === pageCount;
  next.addEventListener("click", () => {
    selectedPage += 1;
    directoryScrollToTop = true;
    returnToPuzzleId = null;
    void renderDirectory();
  });
  elements.pagination.replaceChildren(previous, pageLabel, next);

  if (returnTarget) {
    returnToPuzzleId = null;
    requestAnimationFrame(() => {
      returnTarget.scrollIntoView({ block: "center", behavior: "auto" });
    });
  } else if (directoryScrollToTop) {
    directoryScrollToTop = false;
    requestAnimationFrame(() => {
      elements.directorySummary.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
}

function openDirectory() {
  const returningFromGame = !elements.gameView.hidden;
  closeConfirmation();
  save();
  elements.gameView.hidden = true;
  elements.gameMenu.hidden = true;
  elements.puzzleTitle.textContent = "题库";
  elements.puzzleTitle.hidden = false;
  elements.directoryView.hidden = false;
  if (game && returningFromGame) {
    selectedDifficulty = game.difficulty;
    selectedPage = pageForPuzzle(game.puzzleNumber);
    returnToPuzzleId = game.puzzleId;
  }
  void renderDirectory();
}

for (let value = 1; value <= 9; value += 1) {
  const button = document.createElement("button");
  const supportsPointerEvents = "PointerEvent" in window;
  const pressController = createPressController({
    delay: LONG_PRESS_MILLISECONDS,
    onShortPress: () => enterCandidate(value),
    onLongPress: () => {
      button.classList.remove("pressing");
      markInstructionLearned("number", NUMBER_INPUT_HELP);
      enterValue(value);
    },
  });

  const showNumberHelp = () => showInstruction(NUMBER_INPUT_HELP, "number");

  button.type = "button";
  button.textContent = value;
  button.setAttribute("aria-label", `${value}，短按候选，长按确定`);
  button.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || !pressController.start(event.pointerId)) return;
    event.preventDefault();
    showNumberHelp();
    button.classList.add("pressing");
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointerup", (event) => {
    const result = pressController.end(event.pointerId);
    if (result === null) return;
    event.preventDefault();
    button.classList.remove("pressing");
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
  });
  button.addEventListener("pointercancel", (event) => {
    if (!pressController.cancel(event.pointerId)) return;
    button.classList.remove("pressing");
  });
  button.addEventListener(
    "touchstart",
    (event) => {
      if (event.cancelable) event.preventDefault();
      if (supportsPointerEvents || event.touches.length !== 1 || !pressController.start("touch")) {
        return;
      }
      showNumberHelp();
      button.classList.add("pressing");
    },
    { passive: false },
  );
  button.addEventListener(
    "touchend",
    (event) => {
      if (event.cancelable) event.preventDefault();
      if (supportsPointerEvents || pressController.end("touch") === null) return;
      button.classList.remove("pressing");
    },
    { passive: false },
  );
  button.addEventListener(
    "touchcancel",
    (event) => {
      if (event.cancelable) event.preventDefault();
      if (supportsPointerEvents || !pressController.cancel("touch")) return;
      button.classList.remove("pressing");
    },
    { passive: false },
  );
  button.addEventListener("contextmenu", (event) => event.preventDefault());
  button.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    showNumberHelp();
    enterCandidate(value);
  });
  elements.numberPad.append(button);
}

elements.numberPad.addEventListener("selectstart", (event) => event.preventDefault());
elements.numberPad.addEventListener("dragstart", (event) => event.preventDefault());
elements.backToDirectory.addEventListener("click", openDirectory);

const resetSupportsPointerEvents = "PointerEvent" in window;
const resetPressController = createPressController({
  delay: LONG_PRESS_MILLISECONDS,
  onShortPress: clearSelectedCell,
  onLongPress: () => {
    elements.reset.classList.remove("pressing");
    markInstructionLearned(
      "clear",
      "短按清空单元格 · 长按清空全部",
    );
    showConfirmation({
      title: "清空全部",
      message: "确认清空本题的全部填写和候选，并重新计时吗？",
      confirmLabel: "清空全部",
      onConfirm: resetAllCells,
    });
  },
});

function showResetHelp() {
  showInstruction("短按清空单元格 · 长按清空全部", "clear");
}

elements.reset.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || !resetPressController.start(event.pointerId)) {
    return;
  }
  event.preventDefault();
  showResetHelp();
  elements.reset.classList.add("pressing");
  elements.reset.setPointerCapture(event.pointerId);
});
elements.reset.addEventListener("pointerup", (event) => {
  const result = resetPressController.end(event.pointerId);
  if (result === null) return;
  event.preventDefault();
  elements.reset.classList.remove("pressing");
  if (elements.reset.hasPointerCapture(event.pointerId)) {
    elements.reset.releasePointerCapture(event.pointerId);
  }
});
elements.reset.addEventListener("pointercancel", (event) => {
  if (!resetPressController.cancel(event.pointerId)) return;
  elements.reset.classList.remove("pressing");
});
elements.reset.addEventListener(
  "touchstart",
  (event) => {
    if (event.cancelable) event.preventDefault();
    if (
      resetSupportsPointerEvents ||
      event.touches.length !== 1 ||
      !resetPressController.start("reset-touch")
    ) {
      return;
    }
    showResetHelp();
    elements.reset.classList.add("pressing");
  },
  { passive: false },
);
elements.reset.addEventListener(
  "touchend",
  (event) => {
    if (event.cancelable) event.preventDefault();
    if (resetSupportsPointerEvents || resetPressController.end("reset-touch") === null) {
      return;
    }
    elements.reset.classList.remove("pressing");
  },
  { passive: false },
);
elements.reset.addEventListener(
  "touchcancel",
  (event) => {
    if (event.cancelable) event.preventDefault();
    if (
      resetSupportsPointerEvents ||
      !resetPressController.cancel("reset-touch")
    ) {
      return;
    }
    elements.reset.classList.remove("pressing");
  },
  { passive: false },
);
elements.reset.addEventListener("contextmenu", (event) => event.preventDefault());
elements.reset.addEventListener("click", (event) => {
  if (event.detail !== 0) return;
  showResetHelp();
  clearSelectedCell();
});

elements.submit.addEventListener("click", () => {
  if (!game || completed) return;
  showConfirmation({
    title: "提交检查",
    message: "确认提交当前答案进行检查吗？",
    confirmLabel: "提交检查",
    onConfirm: submitCurrentGame,
  });
});

elements.confirmationCancel.addEventListener("click", closeConfirmation);
elements.confirmationConfirm.addEventListener("click", () => {
  const action = confirmationAction;
  closeConfirmation();
  action?.();
});
elements.confirmation.addEventListener("click", (event) => {
  if (event.target === elements.confirmation) closeConfirmation();
});

document.addEventListener("keydown", (event) => {
  if (!elements.confirmation.hidden) {
    if (event.key === "Escape") closeConfirmation();
    return;
  }
  if (/^[1-9]$/.test(event.key)) enterCandidate(Number(event.key));
});
window.addEventListener("pagehide", save);

setInterval(() => {
  if (game && !completed && !elements.gameView.hidden) {
    elements.timer.textContent = formatDuration(elapsedSeconds(game));
  }
}, 1000);

void renderDirectory();
