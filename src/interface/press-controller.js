export function createPressController({
  onShortPress,
  onLongPress,
  delay = 500,
  schedule = setTimeout,
  cancelSchedule = clearTimeout,
}) {
  let activePointerId = null;
  let timer = null;
  let longPressTriggered = false;

  function clearTimer() {
    if (timer === null) return;
    cancelSchedule(timer);
    timer = null;
  }

  return {
    start(pointerId) {
      if (activePointerId !== null) return false;
      activePointerId = pointerId;
      longPressTriggered = false;
      timer = schedule(() => {
        timer = null;
        longPressTriggered = true;
        onLongPress();
      }, delay);
      return true;
    },
    end(pointerId) {
      if (pointerId !== activePointerId) return null;
      clearTimer();
      activePointerId = null;
      if (longPressTriggered) return "long";
      onShortPress();
      return "short";
    },
    cancel(pointerId) {
      if (pointerId !== activePointerId) return false;
      clearTimer();
      activePointerId = null;
      longPressTriggered = false;
      return true;
    },
  };
}
