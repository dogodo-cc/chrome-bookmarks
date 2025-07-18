<template>
    <div class="infinity-canvas-item" @mousedown.stop.left="onMousedown" :style="style">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    left: {
        type: Number,
        required: true
    },
    top: {
        type: Number,
        required: true
    },
    index: {
        type: Number,
        required: true
    }
})

const emits = defineEmits<{
    'update:move': [index: number, x: number, y: number],
    'current-selected': [index: number]
}>()

const style = computed(() => {
    return {
        transform: `translate3d(${props.left}px, ${props.top}px, 0)`,
        width: props.width + 'px',
        height: props.height + 'px'
    }
})


function onMousedown(e: MouseEvent) {
    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;
    const startTime = Date.now();

    window.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
            const offsetX = e.clientX - startX;
            const offsetY = e.clientY - startY;

            emits('update:move', props.index, offsetX, offsetY);

            startX = e.clientX;
            startY = e.clientY;
        },
        { signal }
    );
    window.addEventListener("mouseup", () => {
        if (Date.now() - startTime < 200) {
            emits('current-selected', props.index);
        }
        controller.abort();
    }, { signal });
}
</script>
<style lang="css">
.infinity-canvas-item {
    position: absolute;
    left: 0;
    top: 0;
}
</style>