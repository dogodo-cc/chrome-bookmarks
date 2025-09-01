<script setup lang="ts">
import { ref } from 'vue';
import zoomCanvas from '../components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from '../components/type.js';
import { getInitialLayoutWithOverflow } from '../components/layout.js'
import VirtualList from '../components/virtual-list/index.vue';

const rowList = Array.from({ length: 2 }, (_, i) => ({
  id: i,
  value: `Item ${i}`,
  left: 0,
  top: 0,
  width: 200,
  height: 100,
  children: Array(100)
    .fill(true)
    .map((_, index) => {
      return {
        id: index + 1,
        text: `第${index + 1}条数据`,
      };
    })
}))
const list = ref<IInfinityCanvasItem[]>(getInitialLayoutWithOverflow(rowList, 15000, 13000, window.innerWidth, window.innerHeight));

function update(index: number, data: Partial<IInfinityCanvasItem>) {
  Object.assign(list.value[index], data);
}

</script>

<template>
  <zoomCanvas :list="list" @update="update" :canvasWidth="15000" :canvasHeight="13000">
    <template #default="{ item }">
      <div class="card">
        <VirtualList :list="item.children" :item-height="30">
          <template #default="{ data }">
            <div style="padding: 0 10px; border-bottom: 1px solid #eee; line-height: 30px;">
              {{ data.text }}
            </div>
          </template>
        </VirtualList>
      </div>
    </template>
  </zoomCanvas>
</template>

<style lang="css">
.card {
  width: 100%;
  height: 100%;


  background-color: aqua;
  font-size: 20px;
  color: #ccc;
  user-select: none;
}
</style>
