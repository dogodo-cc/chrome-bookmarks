import { ref, watchEffect, type Ref, unref } from "vue";

interface Point {
  x: number;
  y: number;
}

interface UseSpiralLayoutOptions {
  width: Ref<number> | number;
  height: Ref<number> | number;
  count: Ref<number> | number;
  itemSize: number; // 元素尺寸（用于边界计算）
  startAngle?: number;
}

export default function useEllipseSpiralLayout(
  options: UseSpiralLayoutOptions
) {
  const positions = ref<Point[]>([]);

  watchEffect(() => {
    const width = unref(options.width);
    const height = unref(options.height);
    const count = unref(options.count);
    const itemSize = options.itemSize;
    const cx = width / 2;
    const cy = height / 2;

    const rx = (width - itemSize) / 2;
    const ry = (height - itemSize) / 2;
    const goldenAngle = Math.PI * (137.5 / 180); // ≈ 2.39996 rad

    const result: Point[] = [];

    for (let i = 0; i < count; i++) {
      const t = Math.sqrt(i / (count - 1)); // 0 → 1，非线性
      const theta = i * goldenAngle;

      const x = cx + rx * t * Math.cos(theta);
      const y = cy + ry * t * Math.sin(theta);

      result.push({ x, y });
    }

    positions.value = result;
  });

  return positions;
}
