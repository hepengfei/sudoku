import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
