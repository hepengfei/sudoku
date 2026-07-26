import test from "node:test";
import assert from "node:assert/strict";
import { createConsecutiveClickController } from "../src/interface/consecutive-click-controller.js";

test("单元格选中后连续点击三次才触发开发者功能", () => {
  const triggered = [];
  const controller = createConsecutiveClickController({
    onTrigger: (index) => triggered.push(index),
  });

  assert.equal(controller.register(80, { selected: false, at: 0 }), false);
  assert.equal(controller.register(80, { selected: true, at: 100 }), false);
  assert.equal(controller.register(80, { selected: true, at: 200 }), false);
  assert.equal(controller.register(80, { selected: true, at: 300 }), true);
  assert.deepEqual(triggered, [80]);
});

test("超时或切换单元格会重新计算连续点击", () => {
  const triggered = [];
  const controller = createConsecutiveClickController({
    maximumInterval: 700,
    onTrigger: (index) => triggered.push(index),
  });

  controller.register(79, { selected: false, at: 0 });
  controller.register(79, { selected: true, at: 100 });
  controller.register(79, { selected: true, at: 900 });
  controller.register(80, { selected: false, at: 950 });
  controller.register(80, { selected: true, at: 1000 });
  controller.register(80, { selected: true, at: 1100 });
  assert.equal(controller.register(80, { selected: true, at: 1200 }), true);
  assert.deepEqual(triggered, [80]);
});
