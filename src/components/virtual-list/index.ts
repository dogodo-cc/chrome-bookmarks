/**
 * 本方案与常规虚拟列表的实现最大的不同在于：
 *  - 常规虚拟列表是一次性获取了所有数据。内存占用随着数据总量上升而上升
 *  - 本方案是‘按需预获取’一定数量的数据。‘按需’是为了节省内存占用，‘预获取’是为了滚动的顺畅性。内存占用小且不随着数据总量上升而上升
 *
 * 假设我的数据是 100W 条
 * 容器可视高度最多显示 20 条数据
 * 那么预先获取 2000 条数据（可根据实际情况动态调整）
 */

const list = Array(10000)
  .fill(true)
  .map((_, index) => {
    return {
      id: index + 1,
      text: `第${index + 1}条数据`,
    };
  });

class VirtualListManage {
  constructor() {
    return this;
  }

  preloadedCount = 50; // 预获取的条数（向前 & 向后）
  screenHeight = 10; // 容器高度
  total = 10; // 服务器总条数
  items = []; // 按需预获取到的项目列表
  itemHeight = 60; // 项目高度(一致)
  scrollTop = 0; // 滚动距离
  fetchStartIndex = 0; // 预获取的数组起始索引
  fetchEndIndex = 0; // 预获取的数组结束索引

  timerId: number | null = null;

  init(screenHeight = 100, itemHeight = 10) {
    this.screenHeight = screenHeight;
    this.itemHeight = itemHeight;
  }

  get totalHeight() {
    return this.total * this.itemHeight;
  }

  get translateY() {
    return this.scrollTop - (this.scrollTop % this.itemHeight);
  }

  // 列表开始渲染的索引
  get startIndex() {
    return Math.floor(this.scrollTop / this.itemHeight);
  }

  // 需要渲染几条数据
  get showListCount() {
    return Math.ceil(this.screenHeight / this.itemHeight);
  }

  // 最终渲染的数据
  get showList() {
    const { startIndex, fetchStartIndex, showListCount, items } = this;
    const index = startIndex - fetchStartIndex;
    const showList = items.slice(index, index + showListCount + 1); // +1 因为 Array.slice() endIndex 不包括;
    return showList.length
      ? showList
      : Array(showListCount)
          .fill(1)
          .map((_, i) => ({ id: i + 1, text: "is scrolling..." }));
  }

  getFetchIndex() {
    const start = Math.max(0, this.startIndex - this.preloadedCount);
    const end = Math.min(
      this.total,
      this.startIndex + this.showListCount + this.preloadedCount
    );
    return [start, end];
  }

  // TODO: 需要 throttle
  fetchItem() {
    const [fetchStartIndex, fetchEndIndex] = this.getFetchIndex();
    // 模拟异步获取数据
    this.timerId && window.clearTimeout(this.timerId);
    this.timerId = window.setTimeout(() => {
      this.total = list.length;
      this.items = list.slice(fetchStartIndex, fetchEndIndex);
      this.fetchStartIndex = fetchStartIndex;
      this.fetchEndIndex = fetchEndIndex;
      console.log("fetchItem");
    }, 100);
  }

  handleScroll(e: Event) {
    requestAnimationFrame(() => {
      const { scrollTop } = e.target as HTMLElement;

      if (scrollTop + this.screenHeight > this.totalHeight) {
        console.log("无效滚动");
        return;
      }
      this.scrollTop = scrollTop;

      const isColse2start =
        this.startIndex < this.fetchStartIndex + this.preloadedCount / 2;
      const isClose2end =
        this.startIndex + this.showListCount >
        this.fetchEndIndex - this.preloadedCount / 2;

      if (isColse2start && this.fetchStartIndex) {
        this.fetchItem();
      } else if (isClose2end && this.fetchEndIndex !== this.total) {
        this.fetchItem();
      }
    });
  }
}

export default VirtualListManage;
