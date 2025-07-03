import { ref, watchEffect, type Ref, unref } from "vue";

interface Point {
  x: number;
  y: number;
}

interface UseGridLayoutOptions {
  width: Ref<number> | number;
  height: Ref<number> | number;
  count: Ref<number> | number;
  itemWidth: number;
  itemHeight: number;
  gap?: number; // 可选：元素之间的间距
}

export default function useGridLayout(options: UseGridLayoutOptions) {
  const positions = ref<Point[]>([]);

  watchEffect(() => {
    const width = unref(options.width);
    const height = unref(options.height);
    const count = unref(options.count);
    const itemWidth = options.itemWidth;
    const itemHeight = options.itemHeight;
    const gap = options.gap ?? 10;

    // 计算画布可以容纳的最大列数和行数
    const maxCols = Math.floor(width / (itemWidth + gap));
    const maxRows = Math.floor(height / (itemHeight + gap));
    const maxCount = maxCols * maxRows;

    // 计算将网格整体挪到中心的偏移量
    const offsetx = (width - Math.min(count, maxCols) * (itemWidth + gap)) / 2;
    const offsety =
      (height -
        Math.min(Math.floor(count / maxCols), maxRows) * (itemHeight + gap)) /
      2;

    const result: Point[] = [];

    for (let i = 0; i < count; i++) {
      if (i > maxCount) {
        result.push({ x: -(width / 2), y: -(height / 2) });
      } else {
        const col = i % maxCols; // 列索引
        const row = Math.floor(i / maxCols); // 行索引

        const x = offsetx + col * (itemWidth + gap);
        const y = offsety + row * (itemHeight + gap);

        result.push({ x, y });
      }
    }

    positions.value = result;
  });

  return positions;
}
