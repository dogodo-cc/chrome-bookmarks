<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import zoomCanvas from '../components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from '../components/type.js';
// import { getInitialLayoutWithOverflow } from '../components/layout.js'

// const rowList = Array.from({ length: 100 }, (_, i) => ({
//   id: i,
//   value: `Item ${i}`,
//   left: 0,
//   top: 0,
//   width: 200,
//   height: 100
// }))
// const list = ref<IInfinityCanvasItem[]>(getInitialLayoutWithOverflow(rowList, 15000, 13000, window.innerWidth, window.innerHeight));

const debounceSync = useDebounceFn(() => {
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
}, 1000)


function update(index: number, data: ICard) {
  bookmarkFolders.value[index] = data;
  debounceSync();
}

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

          if (bookmarks.length > 0) {
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
const canvasWidth = 5000;
const canvasHeight = 3000;
onMounted(async () => {
  const list: GroundBookmark[] = (await loadBookmarks());
  bookmarkFolders.value = [];

  const storedPosition = (await chrome.storage.sync.get('position')).position ?? {} as Record<string, IInfinityCanvasItem>;

  for (const folder of list) {

    if (storedPosition[folder.id]) {
      bookmarkFolders.value.push(Object.assign(folder, storedPosition[folder.id]));
    } else {
      bookmarkFolders.value.push({
        ...folder,
        left: Math.random() * (canvasWidth - 200),
        top: Math.random() * (canvasHeight - 200),
        width: 200,
        height: 200
      });
    }

  }

});


</script>

<template>
  <zoomCanvas :list="bookmarkFolders" @update="update" :canvasWidth="canvasWidth" :canvasHeight="canvasHeight">
    <template #default="{ item }">
      <div class="card">
        {{ item.title }}
        <ul>
          <li v-for="o in item.bookmarks">
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

  background-color: aqua;
  color: red;
  user-select: none;
  overflow: auto;
}
</style>
