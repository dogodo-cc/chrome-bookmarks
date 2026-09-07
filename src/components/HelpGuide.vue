<template>
  <button type="button" class="help-trigger" title="操作指南" @click="visible = true">💡</button>

  <Teleport to="body">
    <div v-if="visible" class="help-overlay" @click.self="visible = false">
      <div class="help-dialog" role="dialog" aria-label="操作指南">
        <div class="help-header">
          <span class="help-title">操作指南</span>
          <button type="button" class="help-close" title="关闭" @click="visible = false">✕</button>
        </div>
        <ul class="help-list">
          <li v-for="guide in guides" :key="guide.action" class="help-item">
            <span class="help-action">{{ guide.action }}</span>
            <span class="help-desc">{{ guide.desc }}</span>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);

// 所有操作指南都收拢在这里，新增操作时只需补充一条
const guides = [
  { action: '双指捏合 / Ctrl + 滚轮', desc: '缩放画布' },
  { action: '双指上下左右滑动 / 滚轮', desc: '移动画布' },
  { action: '左键按住空白处拖动', desc: '框选卡片' },
  { action: '右键按住拖动', desc: '移动画布' },
  { action: '左键拖动卡片', desc: '移动卡片位置' },
  { action: '拖动卡片边缘 / 角落', desc: '调整卡片大小' },
  { action: '拖拽书签到其他文件夹', desc: '移动书签' },
  { action: '悬停卡片标题', desc: '重命名 / 删除文件夹' },
  { action: '悬停书签', desc: '重命名 / 删除书签' },
];
</script>

<style scoped>
.help-trigger {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 1000;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.help-trigger:hover {
  transform: scale(1.1);
}

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-dialog {
  width: 360px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  padding: 16px 20px 20px;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.help-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.help-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #999;
}

.help-close:hover {
  color: #333;
}

.help-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.help-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.help-item:last-child {
  border-bottom: 0;
}

.help-action {
  flex-shrink: 0;
  width: 160px;
  font-size: 13px;
  font-weight: 600;
  color: #0077b6;
}

.help-desc {
  font-size: 13px;
  color: #666;
}
</style>
