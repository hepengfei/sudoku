import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseBoard, serializeBoard, solveBoard } from "../src/domain/sudoku.js";

const sourceDirectory = process.argv[2];
const selection = process.argv[3] ?? "sudoku-book-v2-givens-desc";
const sourceRevision = process.argv[4] ?? "unknown";
const sampleSize = 1000;
const beginnerMinimumGivens = 40;
const difficultyPlans = [
  {
    difficulty: "beginner",
    source: "easy",
    include: (record) => record.givens >= beginnerMinimumGivens,
  },
  {
    difficulty: "easy",
    source: "easy",
    include: (record) => record.givens < beginnerMinimumGivens,
  },
  { difficulty: "medium", source: "medium", include: () => true },
  { difficulty: "hard", source: "hard", include: () => true },
  { difficulty: "diabolical", source: "diabolical", include: () => true },
];
const difficulties = difficultyPlans.map(({ difficulty }) => difficulty);

if (!sourceDirectory) {
  console.error(
    "用法：node scripts/import-puzzles.mjs <题库目录> [选择规则版本] [上游提交哈希]",
  );
  process.exit(1);
}

function countGivens(puzzle) {
  return [...puzzle].filter((value) => value !== "0").length;
}

function parseRecord(line, filename, lineNumber) {
  const match = line.match(/^([0-9a-f]{12})\s+([0-9]{81})\s+([0-9]+(?:\.[0-9]+)?)$/);
  if (!match) {
    throw new Error(`${filename}:${lineNumber} 不是有效题库记录`);
  }
  return {
    sourceHash: match[1],
    puzzle: match[2],
    rating: Number(match[3]),
    givens: countGivens(match[2]),
  };
}

function selectRecords(filename, include) {
  const lines = readFileSync(filename, "utf8").trimEnd().split("\n");
  const candidates = lines
    .map((line, index) => parseRecord(line, filename, index + 1))
    .filter(include)
    .sort((left, right) => {
      if (left.givens !== right.givens) return right.givens - left.givens;
      if (left.sourceHash < right.sourceHash) return -1;
      if (left.sourceHash > right.sourceHash) return 1;
      return 0;
    });
  if (candidates.length < sampleSize) {
    throw new Error(`${filename} 只有 ${candidates.length} 道题符合筛选条件`);
  }
  return {
    sample: candidates.slice(0, sampleSize),
    sourceCount: lines.length,
    candidateCount: candidates.length,
  };
}

const imported = {};
const sourceCounts = {};
const candidateCounts = {};
const seenHashes = new Set();
const seenPuzzles = new Set();

for (const { difficulty, source, include } of difficultyPlans) {
  const filename = resolve(sourceDirectory, `${source}.txt`);
  const { sample, sourceCount, candidateCount } = selectRecords(filename, include);
  sourceCounts[source] = sourceCount;
  candidateCounts[difficulty] = candidateCount;
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
  console.log(
    `${difficulty}: 从 ${candidateCount}/${sourceCount} 道候选题中导入 ${imported[difficulty].length} 题`,
  );
}

const dataDirectory = resolve("src/domain/puzzle-data");
mkdirSync(dataDirectory, { recursive: true });

for (const difficulty of difficulties) {
  const dataLines = [
    "// 此文件由 scripts/import-puzzles.mjs 生成，请勿手工编辑。",
    `// 难度：${difficulty}；选择规则版本：${selection}`,
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
  `// 选择规则版本：${selection}`,
  `// 上游提交：${sourceRevision}`,
  "export const PUZZLE_SOURCE = " +
    JSON.stringify({
      name: 'Sudoku Exchange "Puzzle Bank"',
      url: "https://github.com/grantm/sudoku-exchange-puzzle-bank",
      revision: sourceRevision,
      selection,
      sampleSize,
      beginnerMinimumGivens,
      sourceCounts,
      candidateCounts,
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
console.log("已生成五个按难度拆分的数据文件，共 5000 题。");
