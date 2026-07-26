export function createConsecutiveClickController({
  requiredClicks = 3,
  maximumInterval = 700,
  onTrigger,
}) {
  let target = null;
  let clickCount = 0;
  let lastClickAt = null;

  function reset(nextTarget = null) {
    target = nextTarget;
    clickCount = 0;
    lastClickAt = null;
  }

  return {
    register(targetId, { selected, at = Date.now() }) {
      if (!selected) {
        reset(targetId);
        return false;
      }
      if (
        target !== targetId ||
        lastClickAt === null ||
        at < lastClickAt ||
        at - lastClickAt > maximumInterval
      ) {
        target = targetId;
        clickCount = 0;
      }
      clickCount += 1;
      lastClickAt = at;
      if (clickCount < requiredClicks) return false;
      reset();
      onTrigger(targetId);
      return true;
    },
    reset,
  };
}
