import { useRef } from "react";

const THRESHOLD = 60;

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onOffsetChange,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onOffsetChange?: (offset: number) => void;
}): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);
  const lastDx = useRef(0);
  const tracking = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    lastDx.current = 0;
    tracking.current = true;
    onOffsetChange?.(0);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!tracking.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // Ignore vertical-dominant gestures
    if (Math.abs(dy) > Math.abs(dx)) {
      tracking.current = false;
      onOffsetChange?.(0);
      return;
    }

    lastDx.current = dx;
    onOffsetChange?.(dx);
  }

  function onTouchEnd() {
    if (!tracking.current) return;
    tracking.current = false;
    const dx = lastDx.current;
    onOffsetChange?.(0);

    if (dx < -THRESHOLD) {
      onSwipeLeft?.();
    } else if (dx > THRESHOLD) {
      onSwipeRight?.();
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
