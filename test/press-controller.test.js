import test from "node:test";
import assert from "node:assert/strict";
import { createPressController } from "../src/interface/press-controller.js";

function createHarness() {
  const actions = [];
  let scheduled = null;
  const controller = createPressController({
    onShortPress: () => actions.push("short"),
    onLongPress: () => actions.push("long"),
    schedule(callback, delay) {
      scheduled = { callback, delay };
      return 1;
    },
    cancelSchedule() {
      scheduled = null;
    },
  });
  return {
    actions,
    controller,
    fireTimer() {
      const callback = scheduled.callback;
      scheduled = null;
      callback();
    },
    scheduled() {
      return scheduled;
    },
  };
}

test("指针在阈值前释放时只触发短按", () => {
  const harness = createHarness();
  assert.equal(harness.controller.start(1), true);
  assert.equal(harness.scheduled().delay, 500);
  assert.equal(harness.controller.end(1), "short");
  assert.deepEqual(harness.actions, ["short"]);
  assert.equal(harness.scheduled(), null);
});

test("到达阈值后释放时只触发一次长按", () => {
  const harness = createHarness();
  harness.controller.start(7);
  harness.fireTimer();
  assert.deepEqual(harness.actions, ["long"]);
  assert.equal(harness.controller.end(7), "long");
  assert.deepEqual(harness.actions, ["long"]);
});

test("取消或无关指针不会触发输入", () => {
  const harness = createHarness();
  harness.controller.start(3);
  assert.equal(harness.controller.end(4), null);
  assert.equal(harness.controller.cancel(3), true);
  assert.deepEqual(harness.actions, []);
  assert.equal(harness.scheduled(), null);
});
