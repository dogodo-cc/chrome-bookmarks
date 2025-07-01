<script setup lang="ts">
import { onMounted } from 'vue';
import zoomCanvas from './components/zoomCanvas.vue';



onMounted(() => {
  console.log('app mounted', window.innerWidth, window.innerHeight);
});
</script>

<template>
  <!-- <zoomCanvas :canvasWidth="1763" :canvasHeight="708" /> -->
  <zoomCanvas />
</template>

<style></style>
