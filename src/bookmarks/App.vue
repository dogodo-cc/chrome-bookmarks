<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import InfinityCanvas from '../components/infinity-canvas.vue';
import FolderCard from '../components/FolderCard.vue';
import type { IInfinityCanvasItem } from '../components/type.d.ts';

// 定义画布的宽度和高度
const canvasWidth = 10000;
const canvasHeight = 8000;


function update(index: number, data: Partial<IInfinityCanvasItem>) {
  const item = bookmarkFolders.value[index];
  if (!item) return;

  Object.assign(item, data);
  dirtyPositionIds.add(item.id);
  debounceUpdate();
}


// 同步位置信息到 Chrome 存储 （不宜太频繁）
const debounceUpdate = useDebounceFn(() => {
  if (!dirtyPositionIds.size) {
    return;
  }

  const nextPosition = { ...positionCache.value };

  for (const id of dirtyPositionIds) {
    const item = bookmarkFolders.value.find((folder) => folder.id === id);
    if (!item) continue;

    nextPosition[id] = {
      left: item.left,
      top: item.top,
      width: item.width,
      height: item.height
    };
  }

  positionCache.value = nextPosition;
  dirtyPositionIds.clear();

  chrome.storage.sync.set({ position: nextPosition }).catch((e) => {
    console.error('Error saving position:', e);
    chrome.storage.local.set({ position: nextPosition });
  });
}, 100)


// 画布的初始位置和缩放比例
const initPosX = ref<number | undefined>(undefined);
const initPosY = ref<number | undefined>(undefined);
const initScale = ref<number | undefined>(undefined);
const onUpdateTransform = useDebounceFn((scale: number, posX: number, posY: number) => {
  chrome.storage.sync.set({ transform: { scale, posX, posY } }).catch((e) => {
    console.error('Error saving transform:', e);
    chrome.storage.local.set({ transform: { scale, posX, posY } });
  });
}, 500)


type GroundBookmark = {
  id: string;
  title: string;
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
}

type ICard = GroundBookmark & IInfinityCanvasItem;

const bookmarkFolders = ref<ICard[]>([]);
const positionCache = ref<Record<string, IInfinityCanvasItem>>({});
const dirtyPositionIds = new Set<string>();

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

  chrome.storage.sync.get('transform').then((result) => {
    const { scale = 1, posX = 0, posY = 0 } = result.transform || {};
    initPosX.value = posX;
    initPosY.value = posY;
    initScale.value = scale;
  }).catch((e) => {
    console.error('Error loading transform from sync:', e);
    chrome.storage.local.get('transform').then((result) => {
      const { scale = 1, posX = 0, posY = 0 } = result.transform || {};
      initPosX.value = posX;
      initPosY.value = posY;
      initScale.value = scale;
    });
  });

  getBookmarks();
});

async function getBookmarks() {
  const list: GroundBookmark[] = (await loadBookmarks());
  const storedPosition = (await chrome.storage.sync.get('position')).position ?? (await chrome.storage.local.get('position')).position ?? {} as Record<string, IInfinityCanvasItem>;
  positionCache.value = storedPosition;

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

  e.dataTransfer?.setDragImage(target, target.offsetWidth / 2, target.offsetHeight / 2);
}

function getLi(e: EventTarget | null): HTMLElement | null {
  if (!e) return null;
  if (e instanceof HTMLElement && e.className === 'bookmark-item') {
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
    getBookmarks();
  });
}


function getTargetIndex(card: ICard): number {
  if (!Array.isArray(card.bookmarks) || card.bookmarks.length === 0) {
    // 如果没有书签，返回 0
    return 0;
  }

  let maxIndex = 0;
  for (const bookmark of card.bookmarks) {
    const index = bookmark.index ?? 0;
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex + 1;
}


function renameNode(id: string | number, nextTitle: string) {
  const normalizedTitle = nextTitle.trim();
  if (!normalizedTitle) return;

  chrome.bookmarks.update(String(id), { title: normalizedTitle }, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    getBookmarks();
  });
}

function removeBookmark(id: string | number) {
  if (confirm("确定要删除这个书签吗？")) {
    chrome.bookmarks.remove(String(id), () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      getBookmarks();
    });
  }
}

function removeFolder(id: string | number) {
  if (confirm("确定要删除这个文件夹吗？其中的所有书签和子文件夹都会被删除。")) {
    // removeTree 会连同子节点一起删除，remove 只能删空文件夹
    chrome.bookmarks.removeTree(String(id), () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      getBookmarks();
    });
  }
}


function go2otherUrl(url: string) {
  chrome.tabs.create({ url });
}
</script>

<template>
  <InfinityCanvas v-if="initScale" :list="bookmarkFolders" @update="update" @update:transform="onUpdateTransform"
    :canvasWidth="canvasWidth" :canvasHeight="canvasHeight" :init-pos-x="initPosX" :init-pos-y="initPosY"
    :init-scale="initScale">
    <template #default="{ item }">
      <FolderCard
        :folder="item as any"
        :get-target-index="(card: any) => getTargetIndex(card as ICard)"
        @dragstart="onDragstart"
        @drop="onDrop"
        @rename="renameNode"
        @remove="removeBookmark"
        @remove-folder="removeFolder"
        @open="go2otherUrl"
      />
    </template>
  </InfinityCanvas>
</template>

<style lang="css"></style>
