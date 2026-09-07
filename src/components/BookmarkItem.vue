<template>
  <div
    class="bookmark-item"
    @mousedown.stop
    @dragstart="onDragstart"
    :title="bookmark.title"
    :data-id="String(bookmark.id)"
    :data-index="String(bookmark.index)"
    :data-folder-id="String(folderId)"
  >
    <img
      :src="faviconUrl"
      alt="logo"
      @error="onImgError"
    >

    <InlineRename
      class="bookmark-title"
      :value="bookmark.title"
      empty-text="未命名书签"
      @save="(title) => handleRename(bookmark.id, title)"
    >
      <template #view="{ text, startEdit }">
        <a v-if="bookmark.url?.startsWith('http')" :href="bookmark.url" target="_blank" @click.stop>
          {{ text }}
        </a>
        <a v-else href="#" @click.prevent="handleOpen(bookmark.url)">
          {{ text }}
        </a>
        <div title="重命名" class="rename" @click.stop="startEdit">
          ✏️
        </div>
      </template>
    </InlineRename>

    <div title="删除" class="remove" @click.stop="handleRemove(bookmark.id)">
      ❌
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue';
import InlineRename from './InlineRename.vue';

type BookmarkItemData = {
  id: string | number;
  title?: string;
  url?: string;
  index?: number;
};

const props = defineProps<{
  bookmark: BookmarkItemData;
  folderId: string;
}>();

const emit = defineEmits<{
  dragstart: [event: DragEvent];
  rename: [id: string | number, nextTitle: string];
  remove: [id: string | number];
  open: [url: string];
}>();

const faviconUrl = computed(() => {
  const raw = props.bookmark.url || '';
  if (!raw) return '';
  try {
    const host = new URL(raw).hostname;
    return `https://favicon.im/${host}?s=64`;
  } catch {
    return '';
  }
});

function onDragstart(event: DragEvent) {
  emit('dragstart', event);
}

function onImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><rect width="18" height="18" rx="9" fill="#e0e0e0"/><text x="9" y="13" font-size="11" text-anchor="middle" fill="#888">?</text></svg>'
  );
}

function handleRename(id: string | number, nextTitle: string) {
  emit('rename', id, nextTitle);
}

function handleRemove(id: string | number) {
  emit('remove', id);
}

function handleOpen(url?: string) {
  if (!url) return;
  emit('open', url);
}
</script>

<style scoped>
.bookmark-item {
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
}

.bookmark-item img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 8px;
}

.bookmark-title {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
}

.bookmark-item a {
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
}

.bookmark-item a:hover {
  background-color: rgba(0, 119, 182, 0.1);
  color: #0077b6;
  text-decoration: none;
}

.bookmark-item .rename,
.bookmark-item .remove {
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  display: none;
}

.bookmark-item .rename {
  color: #0b7285;
}

.bookmark-item .remove {
  color: #ff4d4f;
}

.bookmark-item:hover .rename,
.bookmark-item:hover .remove {
  display: flex;
}
</style>
