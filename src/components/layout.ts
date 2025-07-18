type ItemBase = { width: number; height: number };

export function getInitialLayoutWithOverflow<T extends ItemBase>(
  items: T[],
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number
): (T & { left: number; top: number })[] {
  if (items.length === 0) return [];

  const maxItemWidth = Math.max(...items.map((i) => i.width));
  const maxItemHeight = Math.max(...items.map((i) => i.height));
  const gapX = maxItemWidth * 0.2;
  const gapY = maxItemHeight * 0.2;

  const maxColsInViewport =
    Math.floor(viewportWidth / (maxItemWidth + gapX)) || 1;
  const maxRowsInViewport =
    Math.floor(viewportHeight / (maxItemHeight + gapY)) || 1;
  const maxItemsInViewport = maxColsInViewport * maxRowsInViewport;

  const maxColsInCanvas = Math.floor(canvasWidth / (maxItemWidth + gapX)) || 1;
  const maxRowsInCanvas =
    Math.floor(canvasHeight / (maxItemHeight + gapY)) || 1;
  const maxItemsInCanvas = maxColsInCanvas * maxRowsInCanvas;

  // 视口能容纳全部，直接网格布局撑满视口
  if (items.length <= maxItemsInViewport) {
    return gridLayout(
      items,
      canvasWidth,
      canvasHeight,
      maxColsInViewport,
      maxRowsInViewport,
      maxItemWidth,
      maxItemHeight,
      gapX,
      gapY
    );
  }

  // 视口撑不下，画布能放下，撑满画布
  if (items.length <= maxItemsInCanvas) {
    return gridLayout(
      items,
      canvasWidth,
      canvasHeight,
      maxColsInCanvas,
      maxRowsInCanvas,
      maxItemWidth,
      maxItemHeight,
      gapX,
      gapY
    );
  }

  // 超出画布容量，先撑满画布，剩余用黄金螺旋布局
  const firstPart = items.slice(0, maxItemsInCanvas);
  const overflowPart = items.slice(maxItemsInCanvas);

  const gridItems = gridLayout(
    firstPart,
    canvasWidth,
    canvasHeight,
    maxColsInCanvas,
    maxRowsInCanvas,
    maxItemWidth,
    maxItemHeight,
    gapX,
    gapY
  );

  // 黄金螺旋布局，起点设置在画布边缘附近，避免和网格重叠
  const spiralItems = goldenSpiralLayoutFromRadius(
    overflowPart,
    canvasWidth,
    canvasHeight,
    maxItemWidth,
    maxItemHeight,
    calculateMaxGridRadius(
      maxColsInCanvas,
      maxRowsInCanvas,
      maxItemWidth,
      maxItemHeight,
      gapX,
      gapY
    )
  );

  return [...gridItems, ...spiralItems];
}

// 原 grid 布局保持不变
function gridLayout<T extends ItemBase>(
  items: T[],
  canvasWidth: number,
  canvasHeight: number,
  maxCols: number,
  maxRows: number,
  maxItemWidth: number,
  maxItemHeight: number,
  gapX: number,
  gapY: number
): (T & { left: number; top: number })[] {
  const cols = Math.min(maxCols, items.length);
  const rows = Math.min(maxRows, Math.ceil(items.length / cols));

  const gridWidth = cols * (maxItemWidth + gapX) - gapX;
  const gridHeight = rows * (maxItemHeight + gapY) - gapY;

  const startX = Math.max(0, (canvasWidth - gridWidth) / 2);
  const startY = Math.max(0, (canvasHeight - gridHeight) / 2);

  return items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const left = startX + col * (maxItemWidth + gapX);
    const top = startY + row * (maxItemHeight + gapY);

    return { ...item, left, top };
  });
}

// 计算网格布局最大半径（用于螺旋起点）
function calculateMaxGridRadius(
  cols: number,
  rows: number,
  itemWidth: number,
  itemHeight: number,
  gapX: number,
  gapY: number
): number {
  const gridWidth = cols * (itemWidth + gapX) - gapX;
  const gridHeight = rows * (itemHeight + gapY) - gapY;

  return Math.sqrt((gridWidth / 2) ** 2 + (gridHeight / 2) ** 2);
}

// 黄金螺旋布局，起点从半径 rStart 开始
function goldenSpiralLayoutFromRadius<T extends ItemBase>(
  items: T[],
  canvasWidth: number,
  canvasHeight: number,
  maxItemWidth: number,
  maxItemHeight: number,
  rStart: number
): (T & { left: number; top: number })[] {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  const baseGap = Math.max(maxItemWidth, maxItemHeight) * 1.1;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996

  const maxRadius =
    Math.min(canvasWidth, canvasHeight) / 2 -
    Math.max(maxItemWidth, maxItemHeight);

  return items.map((item, i) => {
    const angle = i * goldenAngle;
    const r = Math.min(rStart + baseGap * Math.sqrt(i), maxRadius);

    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    const left = Math.max(
      0,
      Math.min(canvasWidth - item.width, x - item.width / 2)
    );
    const top = Math.max(
      0,
      Math.min(canvasHeight - item.height, y - item.height / 2)
    );

    return { ...item, left, top };
  });
}
