<script setup lang="ts">
import { ref } from 'vue';
import zoomCanvas from './components/infinity-canvas.vue';
import type { IInfinityCanvasItem } from './components/type';

const list = ref<IInfinityCanvasItem[]>([
  {
    id: 1,
    width: 100,
    height: 100,
    left: 2000,
    top: 1500,
    value: 1,
  },
  {
    id: 2,
    width: 100,
    height: 100,
    left: 2200,
    top: 1500,
    value: 2,
  },
])

function update(data: IInfinityCanvasItem[]) {
  list.value = data;
}

function onInput(id: string | number, e: Event) {
  const item = list.value.find(i => i.id === id);
  if (item) {
    item.value = (e.target as HTMLInputElement)?.value
  }
}

</script>

<template>
  <zoomCanvas :list="list" @update="update" :canvasWidth="5000" :canvasHeight="3000">
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
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: aqua;
  font-size: 50px;
  color: red;
}
</style>
