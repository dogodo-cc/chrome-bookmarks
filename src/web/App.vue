<script setup lang="ts">
import { ref } from 'vue';
import zoomCanvas from '../components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from '../components/type.js';
import { getInitialLayoutWithOverflow } from '../components/layout.js'
import VirtualList from '../components/virtual-list/VirtualList.vue';

const rowList = Array.from({ length: 2 }, (_, i) => ({
  id: i,
  value: `Item ${i}`,
  left: 0,
  top: 0,
  width: 200,
  height: 100
}))
const list = ref<IInfinityCanvasItem[]>(getInitialLayoutWithOverflow(rowList, 15000, 13000, window.innerWidth, window.innerHeight));

function update(index: number, data: Partial<IInfinityCanvasItem>) {
  Object.assign(list.value[index], data);
}


</script>

<template>
  <zoomCanvas :list="list" @update="update" :canvasWidth="15000" :canvasHeight="13000">
    <template #default="{ item }">
      <div class="card" @wheel.stop>
        <VirtualList />
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
