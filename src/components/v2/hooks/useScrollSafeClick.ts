import { useRef, type TouchEvent } from 'react';

/** Prevents click from firing when user was scrolling/dragging */
export function useScrollSafeClick() {
  const startX = useRef(0);
  const startY = useRef(0);
  const moved = useRef(false);
  const handlers = {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      moved.current = false;
    },
    onTouchMove: (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX.current);
      const dy = Math.abs(e.touches[0].clientY - startY.current);
      if (dx > 8 || dy > 8) moved.current = true;
    },
  };
  const wasScroll = () => moved.current;
  return { handlers, wasScroll };
}
