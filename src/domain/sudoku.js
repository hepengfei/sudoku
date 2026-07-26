export const BOARD_SIZE = 9;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export function parseBoard(serialized) {
  if (typeof serialized !== "string") {
    throw new TypeError("棋盘必须是字符串");
  }
  const normalized = serialized.replace(/\s/g, "");
  if (!/^[1-9.0]{81}$/.test(normalized)) {
    throw new Error("棋盘必须正好包含 81 个数字或空格占位符");
  }
  return [...normalized].map((value) => (value === "." || value === "0" ? 0 : Number(value)));
}

export function serializeBoard(board) {
  assertBoard(board);
  return board.map((value) => value || ".").join("");
}

export function assertBoard(board) {
  if (!Array.isArray(board) || board.length !== CELL_COUNT) {
    throw new Error("棋盘必须包含 81 个单元格");
  }
  if (board.some((value) => !Number.isInteger(value) || value < 0 || value > 9)) {
    throw new Error("单元格只能是 0 到 9 的整数");
  }
}

function unitsFor(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const column = index % BOARD_SIZE;
  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  const rowCells = Array.from({ length: 9 }, (_, offset) => row * 9 + offset);
  const columnCells = Array.from({ length: 9 }, (_, offset) => offset * 9 + column);
  const boxCells = Array.from(
    { length: 9 },
    (_, offset) => (boxRow + Math.floor(offset / 3)) * 9 + boxColumn + (offset % 3),
  );
  return [rowCells, columnCells, boxCells];
}

export function duplicateIndexes(board) {
  assertBoard(board);
  const duplicates = new Set();
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = board[index];
    if (!value) continue;
    for (const unit of unitsFor(index)) {
      if (unit.some((peer) => peer !== index && board[peer] === value)) {
        duplicates.add(index);
        break;
      }
    }
  }
  return duplicates;
}

export function candidatesFor(board, index) {
  assertBoard(board);
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
    throw new RangeError("单元格索引超出棋盘范围");
  }
  if (board[index] !== 0) return new Set();
  const used = new Set(unitsFor(index).flat().map((peer) => board[peer]).filter(Boolean));
  return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((value) => !used.has(value)));
}

export function isCompletedBoard(board) {
  assertBoard(board);
  return board.every(Boolean) && duplicateIndexes(board).size === 0;
}

export function solveBoard(board, limit = 2) {
  assertBoard(board);
  if (duplicateIndexes(board).size > 0) {
    return { status: "invalid", solutions: [] };
  }
  const working = [...board];
  const solutions = [];
  const rowMasks = Array(9).fill(0);
  const columnMasks = Array(9).fill(0);
  const boxMasks = Array(9).fill(0);
  const fullMask = 0b1111111110;

  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = working[index];
    if (!value) continue;
    const row = Math.floor(index / 9);
    const column = index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
    const bit = 1 << value;
    rowMasks[row] |= bit;
    columnMasks[column] |= bit;
    boxMasks[box] |= bit;
  }

  function search() {
    if (solutions.length >= limit) return;
    let target = -1;
    let targetMask = 0;
    let smallestChoiceCount = 10;
    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (working[index] !== 0) continue;
      const row = Math.floor(index / 9);
      const column = index % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
      const mask = fullMask & ~(rowMasks[row] | columnMasks[column] | boxMasks[box]);
      const choiceCount = countBits(mask);
      if (choiceCount === 0) return;
      if (choiceCount < smallestChoiceCount) {
        target = index;
        targetMask = mask;
        smallestChoiceCount = choiceCount;
        if (choiceCount === 1) break;
      }
    }
    if (target === -1) {
      solutions.push([...working]);
      return;
    }
    const row = Math.floor(target / 9);
    const column = target % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
    for (let value = 1; value <= 9; value += 1) {
      const bit = 1 << value;
      if (!(targetMask & bit)) continue;
      working[target] = value;
      rowMasks[row] |= bit;
      columnMasks[column] |= bit;
      boxMasks[box] |= bit;
      search();
      working[target] = 0;
      rowMasks[row] &= ~bit;
      columnMasks[column] &= ~bit;
      boxMasks[box] &= ~bit;
      if (solutions.length >= limit) return;
    }
  }

  search();
  const status =
    solutions.length === 0 ? "unsatisfiable" : solutions.length === 1 ? "unique" : "multiple";
  return { status, solutions };
}

function countBits(value) {
  let count = 0;
  let remaining = value;
  while (remaining) {
    remaining &= remaining - 1;
    count += 1;
  }
  return count;
}
