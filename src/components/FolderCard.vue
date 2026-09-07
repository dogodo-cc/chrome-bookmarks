<template>
  <div class="card">
    <div class="folder-title">
      <InlineRename
        class="folder-rename"
        :value="folder.title"
        empty-text="未命名文件夹"
        @save="(title) => handleRename(folder.id, title)"
      >
        <template #view="{ text, startEdit }">
          <span class="folder-title-text">{{ text }}</span>
          <button type="button" class="folder-rename-btn" title="重命名文件夹" @click.stop="startEdit">
            ✏️
          </button>
          <button type="button" class="folder-delete-btn" title="删除文件夹"
            @click.stop="handleRemoveFolder(folder.id)">
            🗑️
          </button>
        </template>
      </InlineRename>
    </div>
    <div class="bookmark-list-container">
      <VirtualList
        :list="folder.bookmarks"
        :item-height="30"
        @dragover.prevent
        @drop="handleDrop"
        :data-folder-id="folder.id"
        :data-index="String(getTargetIndex(folder))"
      >
        <template #default="{ data: bookmark }">
          <BookmarkItem
            :bookmark="bookmark"
            :folder-id="folder.id"
            @dragstart="handleDragstart"
            @rename="handleRename"
            @remove="handleRemove"
            @open="handleOpen"
          />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import VirtualList from './VirtualList.vue';
import BookmarkItem from './BookmarkItem.vue';
import InlineRename from './InlineRename.vue';

type BookmarkRow = {
  id: string | number;
  title?: string;
  url?: string;
  index?: number;
};

type FolderCardItem = {
  id: string;
  title: string;
  bookmarks: BookmarkRow[];
  left?: number;
  top?: number;
  width?: number;
  height?: number;
};

defineProps<{
  folder: FolderCardItem;
  getTargetIndex: (card: FolderCardItem) => number;
}>();

const emit = defineEmits<{
  dragstart: [event: DragEvent];
  drop: [event: DragEvent];
  rename: [id: string | number, nextTitle: string];
  remove: [id: string | number];
  'remove-folder': [id: string];
  open: [url: string];
}>();

function handleDrop(event: DragEvent) {
  emit('drop', event);
}

function handleDragstart(event: DragEvent) {
  emit('dragstart', event);
}

function handleRename(id: string | number, nextTitle: string) {
  emit('rename', id, nextTitle);
}

function handleRemove(id: string | number) {
  emit('remove', id);
}

function handleRemoveFolder(id: string) {
  emit('remove-folder', id);
}

function handleOpen(url: string) {
  emit('open', url);
}
</script>

<style scoped>
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
}

.folder-title {
  position: relative;
  height: var(--title-height);
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #ccc 30%, #ccc 70%, transparent);
  pointer-events: none;
}

.folder-rename {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.folder-title-text {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 600;
  color: #0077b6;
}

.folder-rename-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #0b7285;
  font-size: 12px;
  line-height: 1;
  opacity: 0;
}

.card:hover .folder-rename-btn,
.card:hover .folder-delete-btn {
  opacity: 1;
}

.folder-delete-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  opacity: 0;
}

.bookmark-list-container {
  height: calc(100% - var(--title-height));
}
</style>
