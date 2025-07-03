<template>
    <div ref="root" class="item" @mousedown="onMousedown" :style="style">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    scale: {
        type: Number,
        required: true
    }
})

const emits = defineEmits<{
    'update': [x: number, y: number, index: number]
}>()

const style = computed(() => {
    return { transform: `translate3d(${props.x}px, ${props.y}px, 0)` }
})

function onMousedown(e: MouseEvent) {
    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;


    window.addEventListener('mousemove', (e: MouseEvent) => {
        const x = props.x + (e.clientX - startX) / props.scale;
        const y = props.y + (e.clientY - startY) / props.scale;

        emits('update', x, y, props.id);

        startX = e.clientX;
        startY = e.clientY;
    }, { signal });

    window.addEventListener('mouseup', () => controller.abort(), { signal });
}
</script>