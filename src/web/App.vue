<script setup lang="ts">
import { ref } from 'vue';
import zoomCanvas from '../components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from '../components/type.js';
import { getInitialLayoutWithOverflow } from '../components/layout.js'

const rowList = Array.from({ length: 100 }, (_, i) => ({
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

function onInput(id: string | number, e: Event) {
  const item = list.value.find(i => i.id === id);
  if (item) {
    item.value = (e.target as HTMLInputElement)?.value
  }
}

</script>

<template>
  <zoomCanvas :list="list" @update="update" :canvasWidth="15000" :canvasHeight="13000">
    <template #default="{ item }">
      <div class="card">
        {{ item.value }}
        <input :name="item.id" :value="item.value" @input="onInput(item.id, $event)" type="text" />
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
  color: red;
  user-select: none;
}
</style>
