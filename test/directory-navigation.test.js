import test from "node:test";
import assert from "node:assert/strict";
import {
  pageForPuzzle,
  PUZZLES_PER_PAGE,
} from "../src/interface/directory-navigation.js";

test("返回题库时可以定位到题目所在分页", () => {
  assert.equal(PUZZLES_PER_PAGE, 50);
  assert.equal(pageForPuzzle(1), 1);
  assert.equal(pageForPuzzle(50), 1);
  assert.equal(pageForPuzzle(51), 2);
  assert.equal(pageForPuzzle(1000), 20);
});
