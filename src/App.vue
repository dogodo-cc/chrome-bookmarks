<script setup lang="ts">
import { onMounted } from 'vue';
import zoomCanvas from './components/infinity-canvas.vue';



onMounted(() => {
  console.log('app mounted', window.innerWidth, window.innerHeight);
});
</script>

<template>
  <zoomCanvas :canvasWidth="5000" :canvasHeight="3000" />
  <!-- <zoomCanvas /> -->
</template>

<style></style>
