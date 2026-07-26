import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseBoard, serializeBoard, solveBoard } from "../src/domain/sudoku.js";

const sourceDirectory = process.argv[2];
const seed = process.argv[3] ?? "sudoku-book-v1";
const sourceRevision = process.argv[4] ?? "unknown";
const sampleSize = 1000;
const difficulties = ["easy", "medium", "hard", "diabolical"];

if (!sourceDirectory) {
  console.error(
    "用法：node scripts/import-puzzles.mjs <题库目录> [固定种子] [上游提交哈希]",
  );
  process.exit(1);
}

function createRandom(seedText) {
  let state = 2166136261;
  for (const character of seedText) {
    state ^= character.codePointAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function parseRecord(line, filename, lineNumber) {
  const match = line.match(/^([0-9a-f]{12})\s+([0-9]{81})\s+([0-9]+(?:\.[0-9]+)?)$/);
  if (!match) {
    throw new Error(`${filename}:${lineNumber} 不是有效题库记录`);
  }
  return { sourceHash: match[1], puzzle: match[2], rating: Number(match[3]) };
}

function sampleRecords(filename, difficulty) {
  const lines = readFileSync(filename, "utf8").trimEnd().split("\n");
  const random = createRandom(`${seed}:${difficulty}`);
  const sample = [];

  lines.forEach((line, index) => {
    const record = parseRecord(line, filename, index + 1);
    if (index < sampleSize) {
      sample.push(record);
      return;
    }
    const replacement = Math.floor(random() * (index + 1));
    if (replacement < sampleSize) sample[replacement] = record;
  });

  for (let index = sample.length - 1; index > 0; index -= 1) {
    const replacement = Math.floor(random() * (index + 1));
    [sample[index], sample[replacement]] = [sample[replacement], sample[index]];
  }
  return { sample, sourceCount: lines.length };
}

const imported = {};
const sourceCounts = {};
const seenHashes = new Set();
const seenPuzzles = new Set();

for (const difficulty of difficulties) {
  const filename = resolve(sourceDirectory, `${difficulty}.txt`);
  const { sample, sourceCount } = sampleRecords(filename, difficulty);
  sourceCounts[difficulty] = sourceCount;
  imported[difficulty] = sample.map((record, index) => {
    if (seenHashes.has(record.sourceHash)) throw new Error(`重复哈希：${record.sourceHash}`);
    if (seenPuzzles.has(record.puzzle)) throw new Error(`重复题面：${record.sourceHash}`);
    seenHashes.add(record.sourceHash);
    seenPuzzles.add(record.puzzle);

    const result = solveBoard(parseBoard(record.puzzle));
    if (result.status !== "unique") {
      throw new Error(`${difficulty} 第 ${index + 1} 题不是唯一解：${record.sourceHash}`);
    }
    return [
      record.sourceHash,
      record.puzzle.replaceAll("0", "."),
      serializeBoard(result.solutions[0]),
      record.rating,
    ];
  });
  console.log(`${difficulty}: 从 ${sourceCount} 题中导入 ${imported[difficulty].length} 题`);
}

const dataDirectory = resolve("src/domain/puzzle-data");
mkdirSync(dataDirectory, { recursive: true });

for (const difficulty of difficulties) {
  const dataLines = [
    "// 此文件由 scripts/import-puzzles.mjs 生成，请勿手工编辑。",
    `// 难度：${difficulty}；固定抽样种子：${seed}`,
    "export default [",
  ];
  for (const record of imported[difficulty]) {
    dataLines.push(`  ${JSON.stringify(record)},`);
  }
  dataLines.push("];", "");
  writeFileSync(resolve(dataDirectory, `${difficulty}.js`), dataLines.join("\n"));
}

const manifestLines = [
  "// 此文件由 scripts/import-puzzles.mjs 生成，请勿手工编辑。",
  `// 固定抽样种子：${seed}`,
  `// 上游提交：${sourceRevision}`,
  "export const PUZZLE_SOURCE = " +
    JSON.stringify({
      name: 'Sudoku Exchange "Puzzle Bank"',
      url: "https://github.com/grantm/sudoku-exchange-puzzle-bank",
      revision: sourceRevision,
      seed,
      sampleSize,
      sourceCounts,
    }) +
    ";",
  "",
  "const LOADERS = {",
];

for (const difficulty of difficulties) {
  manifestLines.push(
    `  ${difficulty}: () => import("./puzzle-data/${difficulty}.js").then((module) => module.default),`,
  );
}
manifestLines.push(
  "};",
  "",
  "const cache = new Map();",
  "",
  "export function loadPuzzleData(difficulty) {",
  "  const loader = LOADERS[difficulty];",
  '  if (!loader) return Promise.reject(new Error("未知难度"));',
  "  if (!cache.has(difficulty)) cache.set(difficulty, loader());",
  "  return cache.get(difficulty);",
  "}",
  "",
);

writeFileSync(resolve("src/domain/puzzle-data.js"), manifestLines.join("\n"));
console.log("已生成四个按难度拆分的数据文件，共 4000 题。");
