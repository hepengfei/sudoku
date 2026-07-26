import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("题库标题与应用名称共用顶部标题行", () => {
  const markup = readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8",
  );

  assert.match(
    markup,
    /<h1>数独本<\/h1>\s*<span class="header-puzzle-title" id="puzzle-title">题库<\/span>/,
  );
  assert.doesNotMatch(markup, /directory-heading/);
  assert.doesNotMatch(markup, /一本留在这台设备上的数独书/);
});

test("题库统计合并到固定底部分页栏", () => {
  const app = readFileSync(
    new URL("../src/interface/app.js", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );

  assert.match(app, /pagination-summary/);
  assert.match(app, /总题数 <strong>\$\{puzzles\.length\}/);
  assert.match(app, /已完成 <strong>\$\{completedCount\}/);
  assert.doesNotMatch(app, /<span>已开始<\/span>/);
  assert.doesNotMatch(app, /<span>未完成<\/span>/);
  assert.match(styles, /\.pagination\s*\{[\s\S]*position:\s*fixed/);
});

test("题目卡片使用完成记录文案和未完成状态", () => {
  const markup = readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const app = readFileSync(
    new URL("../src/interface/app.js", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );

  assert.match(markup, /<span role="columnheader">完成次数<\/span>/);
  assert.match(markup, /<span role="columnheader">最快用时<\/span>/);
  assert.match(markup, /<span role="columnheader">最快纪录时间<\/span>/);
  assert.doesNotMatch(app, /<dt>/);
  assert.match(app, /const EMPTY_FASTEST_TIME = "--:--"/);
  assert.match(app, /const EMPTY_FASTEST_RECORDED_AT = "--年--月--日 --:--"/);
  assert.match(app, /return "未完成"/);
  assert.doesNotMatch(app, /return "进行中"/);
  assert.match(styles, /\.status-badge\[data-status="未完成"\]/);
});

test("题库与做题区使用相同宽度和连续网格清单", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.game-layout,\s*\.directory-view\s*\{[\s\S]*width:\s*min\(670px,\s*100%\)/);
  assert.match(styles, /\.puzzle-list-header,\s*\.puzzle-item\s*\{[\s\S]*grid-template-columns:\s*var\(--puzzle-columns\)/);
  assert.match(styles, /\.puzzle-list-header\s*\{[\s\S]*position:\s*sticky/);
  assert.match(styles, /\.puzzle-list\s*\{[\s\S]*border:\s*2px solid var\(--ink\)/);
  assert.match(styles, /\.pagination\s*\{[\s\S]*bottom:\s*0/);
  assert.match(styles, /padding:\s*3px 5px max\(3px,\s*env\(safe-area-inset-bottom\)\)/);
});

test("难度选择使用宫格样式且切换时不主动滚动", () => {
  const app = readFileSync(
    new URL("../src/interface/app.js", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.difficulty-tabs\s*\{[\s\S]*border:\s*2px solid var\(--ink\)/);
  assert.match(styles, /grid-template-columns:\s*repeat\(5,\s*1fr\)/);
  assert.match(styles, /\.difficulty-tabs button \+ button\s*\{[\s\S]*border-left:\s*1px solid var\(--ink\)/);
  assert.doesNotMatch(
    app,
    /selectedDifficulty = difficulty;[\s\S]{0,120}directoryScrollToTop = true/,
  );
});

test("底部分页栏与题目表头使用相同基础高度", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /--puzzle-bar-height:\s*38px/);
  assert.match(styles, /\.puzzle-list-header\s*\{[\s\S]*min-height:\s*var\(--puzzle-bar-height\)/);
  assert.match(styles, /\.pagination\s*\{[\s\S]*min-height:\s*var\(--puzzle-bar-height\)/);
  assert.match(styles, /\.pagination button\s*\{[\s\S]*font-size:\s*0\.68rem/);
});

test("数独棋盘始终使用九个等高行", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const boardRule = styles.match(/\.board\s*\{(?<declarations>[^}]+)\}/)?.groups
    ?.declarations;
  assert.match(boardRule, /grid-template-rows:\s*repeat\(9,\s*minmax\(0,\s*1fr\)\)/);
});

test("候选数字始终使用三乘三等高网格", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const notesRule = styles.match(/\.notes\s*\{(?<declarations>[^}]+)\}/)?.groups
    ?.declarations;
  assert.match(notesRule, /grid-template-columns:\s*repeat\(3,\s*1fr\)/);
  assert.match(notesRule, /grid-template-rows:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
});

test("输入区使用左右三乘一操作键和中央三乘三数字键", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const controlsRule = styles.match(
    /\.control-grid\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;
  const numberPadRule = styles.match(
    /\.number-pad\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;
  const sideActionRule = styles.match(
    /\.side-action\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;

  assert.match(controlsRule, /grid-template-columns:\s*repeat\(3,/);
  assert.match(numberPadRule, /grid-template-columns:\s*repeat\(3,/);
  assert.match(numberPadRule, /grid-template-rows:\s*repeat\(3,/);
  assert.match(sideActionRule, /aspect-ratio:\s*3\s*\/\s*1/);
});

test("桌面做题区会按可用视口高度缩放", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const desktopRule = styles.match(
    /@media \(min-width:\s*761px\)\s*\{\s*\.game-layout,\s*\.directory-view\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;

  assert.match(
    desktopRule,
    /width:\s*min\(670px,\s*100%,\s*calc\(69\.23dvh\s*-\s*124px\)\)/,
  );
});

test("用时信息和临时提示共用无内部分隔线的一乘九信息条", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const stripRule = styles.match(
    /\.game-info-strip\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;

  assert.match(stripRule, /aspect-ratio:\s*9\s*\/\s*1/);
  assert.doesNotMatch(stripRule, /background-image/);
});

test("清空全部和提交检查使用覆盖棋盘的确认层", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const confirmationRule = styles.match(
    /\.board-confirmation\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;
  const actionsRule = styles.match(
    /\.confirmation-actions\s*\{(?<declarations>[^}]+)\}/,
  )?.groups?.declarations;

  assert.match(confirmationRule, /position:\s*absolute/);
  assert.match(confirmationRule, /inset:\s*0/);
  assert.match(actionsRule, /grid-template-columns:\s*repeat\(2,\s*1fr\)/);
});

test("页面滚动限制在应用容器内并禁止越过内容边界", () => {
  const styles = readFileSync(
    new URL("../src/interface/styles.css", import.meta.url),
    "utf8",
  );
  const bodyRule = styles.match(/body\s*\{(?<declarations>[^}]+)\}/)?.groups
    ?.declarations;
  const shellRule = styles.match(/\.app-shell\s*\{(?<declarations>[^}]+)\}/)?.groups
    ?.declarations;

  assert.match(bodyRule, /position:\s*fixed/);
  assert.match(bodyRule, /overflow:\s*hidden/);
  assert.match(shellRule, /overflow-y:\s*auto/);
  assert.match(shellRule, /overscroll-behavior-y:\s*none/);
});
