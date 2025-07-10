import type { MaybeComputedElementRef } from "@vueuse/core";
import { useEventListener } from "@vueuse/core";

/**
 * 监听鼠标拖动元素的事件
 *
 * @param target - DOM 元素或 Ref
 * @param onMove - 鼠标拖动时回调 (offsetX, offsetY, e?: MouseEvent) => void
 */
export default function useMousemove(
  target: MaybeComputedElementRef<HTMLElement | null>,
  onMove: (offsetX: number, offsetY: number, e?: MouseEvent) => void
) {
  useEventListener(target, "mousedown", (e: MouseEvent) => {
    if (e.button !== 0) return; // 仅限左键拖动
    e.preventDefault();
    // e.stopPropagation();

    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;

    window.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        const offsetX = e.clientX - startX;
        const offsetY = e.clientY - startY;

        onMove(offsetX, offsetY, e);

        startX = e.clientX;
        startY = e.clientY;
      },
      { signal }
    );
    window.addEventListener("mouseup", () => controller.abort(), { signal });
  });
}
