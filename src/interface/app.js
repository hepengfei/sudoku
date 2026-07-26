import {
  createGame,
  elapsedSeconds,
  eraseCell,
  pauseGame,
  restoreGame,
  setValue,
  submitGame,
  toggleNote,
} from "../application/game.js";
import { DIFFICULTY_LABELS } from "../domain/puzzles.js";
import { createStorage } from "../infrastructure/storage.js";

const elements = {
  board: document.querySelector("#board"),
  difficulty: document.querySelector("#difficulty"),
  timer: document.querySelector("#timer"),
  mistakes: document.querySelector("#mistakes"),
  status: document.querySelector("#status"),
  numberPad: document.querySelector("#number-pad"),
  newGame: document.querySelector("#new-game"),
  submit: document.querySelector("#submit"),
  erase: document.querySelector("#erase"),
  historyButton: document.querySelector("#history-button"),
  historyDialog: document.querySelector("#history-dialog"),
  historyList: document.querySelector("#history-list"),
  closeHistory: document.querySelector("#close-history"),
  modes: [...document.querySelectorAll(".mode")],
};

const persistence = createStorage();
let game = restoreGame(persistence.loadActive()) ?? createGame();
let selectedIndex = game.puzzle.findIndex((value) => value === 0);
let inputMode = "value";
let completed = false;

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function save() {
  if (!completed) persistence.saveActive(pauseGame(game));
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
      elements.status.textContent = "";
      renderBoard();
    });
    elements.board.append(cell);
  });
  elements.difficulty.value = game.difficulty;
  elements.mistakes.textContent = game.mistakes;
}

function enterNumber(value) {
  if (completed || selectedIndex < 0) return;
  game =
    inputMode === "notes"
      ? toggleNote(game, selectedIndex, value)
      : setValue(game, selectedIndex, value);
  save();
  renderBoard();
}

function startNew(difficulty = elements.difficulty.value) {
  game = createGame(difficulty, game.puzzleId);
  selectedIndex = game.puzzle.findIndex((value) => value === 0);
  completed = false;
  elements.status.textContent = "";
  save();
  renderBoard();
}

function renderHistory() {
  const history = persistence.loadHistory();
  if (history.length === 0) {
    elements.historyList.innerHTML = '<p class="empty-history">还没有完成记录，慢慢来。</p>';
    return;
  }
  elements.historyList.replaceChildren(
    ...history.map((record) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const date = new Date(record.completedAt);
      item.innerHTML = `
        <div><strong>${DIFFICULTY_LABELS[record.difficulty]}</strong><span>${date.toLocaleString("zh-CN")}</span></div>
        <div><strong>${formatDuration(record.elapsedSeconds)}</strong><span>判错 ${record.mistakes} 次</span></div>
      `;
      return item;
    }),
  );
}

for (let value = 1; value <= 9; value += 1) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = value;
  button.addEventListener("click", () => enterNumber(value));
  elements.numberPad.append(button);
}

elements.modes.forEach((button) => {
  button.addEventListener("click", () => {
    inputMode = button.dataset.mode;
    elements.modes.forEach((mode) => mode.classList.toggle("active", mode === button));
  });
});

elements.erase.addEventListener("click", () => {
  if (completed || selectedIndex < 0) return;
  game = eraseCell(game, selectedIndex);
  save();
  renderBoard();
});
elements.newGame.addEventListener("click", () => startNew());
elements.difficulty.addEventListener("change", () => startNew(elements.difficulty.value));
elements.submit.addEventListener("click", () => {
  if (completed) return;
  const result = submitGame(game);
  game = result.game;
  if (result.correct) {
    const elapsed = elapsedSeconds(game);
    completed = true;
    persistence.addHistory({
      puzzleId: game.puzzleId,
      difficulty: game.difficulty,
      elapsedSeconds: elapsed,
      mistakes: game.mistakes,
      completedAt: new Date().toISOString(),
    });
    persistence.clearActive();
    elements.status.textContent = `回答正确 · 用时 ${formatDuration(elapsed)}`;
  } else {
    elements.status.textContent = "答案不正确，再检查一下吧。";
    save();
  }
  renderBoard();
});
elements.historyButton.addEventListener("click", () => {
  renderHistory();
  elements.historyDialog.showModal();
});
elements.closeHistory.addEventListener("click", () => elements.historyDialog.close());

document.addEventListener("keydown", (event) => {
  if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
  if (event.key === "Backspace" || event.key === "Delete") {
    game = eraseCell(game, selectedIndex);
    save();
    renderBoard();
  }
});
window.addEventListener("pagehide", save);

setInterval(() => {
  if (!completed) elements.timer.textContent = formatDuration(elapsedSeconds(game));
}, 1000);

renderBoard();
elements.timer.textContent = formatDuration(elapsedSeconds(game));
