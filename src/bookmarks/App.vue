<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import zoomCanvas from '../components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from '../components/type.d.ts';

// 定义画布的宽度和高度
const canvasWidth = 10000;
const canvasHeight = 8000;


function update(index: number, data: Partial<IInfinityCanvasItem>) {
  Object.assign(bookmarkFolders.value[index], data);
  debounceUpdate();
}


// 同步位置信息到 Chrome 存储 （不宜太频繁）
const debounceUpdate = useDebounceFn(() => {
  const data = Object.fromEntries(
    bookmarkFolders.value.map(item => [
      item.id,
      {
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height
      }
    ])
  );
  chrome.storage.sync.set({ position: data });
}, 200)


// 画布的初始位置和缩放比例
const initPosX = ref<number | undefined>(undefined);
const initPosY = ref<number | undefined>(undefined);
const initScale = ref<number | undefined>(undefined);
const onUpdateTransform = useDebounceFn((scale: number, posX: number, posY: number) => {
  chrome.storage.sync.set({ transform: { scale, posX, posY } });
}, 500)


type GroundBookmark = {
  id: string;
  title: string;
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
}

type ICard = GroundBookmark & IInfinityCanvasItem;

const bookmarkFolders = ref<ICard[]>([]);
const loadBookmarks = () => {
  return new Promise<GroundBookmark[]>((resolve) => {
    chrome.bookmarks.getTree((nodes) => {
      const folders: GroundBookmark[] = []

      const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.children) {
          // 如果是文件夹，收集其中的书签
          const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = []
          node.children.forEach((child: chrome.bookmarks.BookmarkTreeNode) => {
            if (child.url && !child.children) {
              bookmarks.push(child)
            } else {
              processNode(child)
            }
          })

          // 根文件夹的 id 为 '0'
          if (node.id !== '0') {
            folders.push({
              id: node.id,
              title: node.title || '未命名文件夹',
              bookmarks
            })
          }
        }
      }

      processNode(nodes[0]);
      resolve(folders);
    })
  });
}

onMounted(async () => {

  chrome.storage.sync.get('transform', (result) => {
    const { scale = 1, posX = 0, posY = 0 } = result.transform || {};
    initPosX.value = posX;
    initPosY.value = posY;
    initScale.value = scale;
  });

  getBoookmarks();
});

async function getBoookmarks() {
  const list: GroundBookmark[] = (await loadBookmarks());
  const storedPosition = (await chrome.storage.sync.get('position')).position ?? {} as Record<string, IInfinityCanvasItem>;

  const _list = []
  for (const folder of list) {
    if (storedPosition[folder.id]) {
      _list.push(Object.assign(folder, storedPosition[folder.id]));
    } else {
      _list.push({
        ...folder,
        left: canvasWidth / 2 - Math.random() * window.innerWidth * (Math.random() > 0.5 ? 1 : -1),
        top: canvasHeight / 2 - Math.random() * window.innerHeight * (Math.random() > 0.5 ? 1 : -1),
        width: 500,
        height: 400
      });
    }
  }
  bookmarkFolders.value = _list;
}

// 妥善处理卡片的滚轮事件 决定是否传递给画布
function onCardWhell(e: WheelEvent) {
  if (e.ctrlKey) {
    // 让画布响应缩放
    return;
  }
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget as HTMLElement;
    const isAtTop = scrollTop === 0 && e.deltaY < 0;
    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1 && e.deltaY > 0;

    // 如果已经到顶部或底部，且滚动方向是“继续滚动”的方向，则不阻止冒泡
    if (isAtTop || isAtBottom) {
      return;
    }
    // 阻止冒泡，防止触发画布的滚动事件
    e.stopPropagation();
  }
}

function onDragstart(e: DragEvent) {
  const target = e.currentTarget as HTMLElement;
  const id = target.dataset.id;
  const folderId = target.dataset.folderId;
  const index = target.dataset.index;
  e.dataTransfer?.setData('text/plain', JSON.stringify({
    id,
    folderId,
    index
  }))
}

function getLi(e: EventTarget | null): HTMLElement | null {
  if (!e) return null;
  if (e instanceof HTMLElement && e.tagName === 'LI') {
    return e;
  }
  if (e instanceof HTMLElement && e.parentElement) {
    return getLi(e.parentElement);
  }
  return null;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const ele = e.currentTarget as HTMLElement;
  const data = e.dataTransfer?.getData('text/plain');
  if (!data) return;

  const { id, index, folderId } = JSON.parse(data);

  const targetFolderId = ele.dataset.folderId ?? -1;
  let targetIndex = ele.dataset.index ?? -1;

  if (ele !== e.target) {
    // 如果拖动到的不是当前元素，获取目标元素的索引
    targetIndex = getLi(e.target)?.dataset.index ?? -1;
  }

  if (targetFolderId === -1 || targetIndex === -1) {
    // 如果目标文件夹或索引无效，直接返回
    return;
  }

  if (Number(index) === Number(targetIndex) && folderId === targetFolderId) {
    // 如果拖动的书签和目标位置相同，则不进行任何操作
    return;
  }

  chrome.bookmarks.move(id, {
    parentId: targetFolderId,
    index: targetIndex ? parseInt(targetIndex as string, 10) : 0
  }, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    getBoookmarks();
  });
}


function getTargetIndex(card: ICard): number {
  if (!Array.isArray(card.bookmarks) || card.bookmarks.length === 0) {
    // 如果没有书签，返回 0
    return 0;
  }
  return Math.max(...card.bookmarks.map((b: chrome.bookmarks.BookmarkTreeNode) => b.index ?? 0)) + 1;
}

</script>

<template>
  <!-- v-if="initScale" 是为了确保得到缓存的数据，让画布的初始偏移从 props 中获取 -->
  <zoomCanvas v-if="initScale" :list="bookmarkFolders" @update="update" @update:transform="onUpdateTransform"
    :canvasWidth="canvasWidth" :canvasHeight="canvasHeight" :init-pos-x="initPosX" :init-pos-y="initPosY"
    :init-scale="initScale">
    <template #default="{ item }">
      <div class="card">
        <h3>{{ item.title }}</h3>
        <ul @wheel="onCardWhell" @drop="onDrop" @dragover.prevent :data-folder-id="item.id"
          :data-index="getTargetIndex(item as ICard)">
          <li @mousedown.stop @dragstart="onDragstart" v-for="o in item.bookmarks" :key="o.id" :title="o.title"
            :data-id="o.id" :data-index="o.index" :data-folder-id="item.id">
            <img :src="`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(o.url)}`" alt="logo">
            <a :href="o.url" target="_blank">{{ o.title || '未命名书签' }}</a>
          </li>
        </ul>
      </div>
    </template>
  </zoomCanvas>
</template>

<style lang="css">
.card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  background: linear-gradient(135deg, #f0f9ff, #e0f7fa);
  color: #333;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  user-select: none;
  overflow: hidden;
  padding: 0 16px 16px;

  --title-height: 40px;

  h3 {
    position: relative;
    margin: 0;
    height: var(--title-height);
    line-height: var(--title-height);
    font-size: 18px;
    font-weight: 600;
    text-align: center;
    color: #0077b6;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, #ccc 30%, #ccc 70%, transparent);
      pointer-events: none;
    }
  }

  ul {
    height: calc(100% - var(--title-height));
    overflow-y: auto;
    padding: 8px 0 0;
    margin: 0;
  }

  li {
    list-style: none;
    padding: 0;
    display: flex;
    align-items: center;

    img {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      margin-right: 8px;
    }

    a {
      width: 100%;
      display: block;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      text-decoration: none;
      font-size: 14px;
      color: #444;
      padding: 6px 8px;
      border-radius: 6px;
      transition: background 0.2s, color 0.2s;

      &:hover {
        background-color: rgba(0, 119, 182, 0.1);
        color: #0077b6;
        text-decoration: none;
      }
    }
  }

  li+li {
    margin-top: 4px;
  }
}
</style>
