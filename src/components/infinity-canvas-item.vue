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
    let hasMoved = false;

    const handleMousemove = (event: MouseEvent) => {
        const offsetX = event.clientX - startX;
        const offsetY = event.clientY - startY;

        if (Math.abs(offsetX) > 3 || Math.abs(offsetY) > 3) {
            hasMoved = true;
        }

        emits('update:move', props.index, offsetX, offsetY);

        startX = event.clientX;
        startY = event.clientY;
    };

    const handleMouseup = () => {
        const duration = Date.now() - startTime;
        const isClick = !hasMoved && duration < 250;

        if (isClick) {
            emits('current-selected', props.index);
        }

        controller.abort();
    };

    window.addEventListener("mousemove", handleMousemove, { signal });
    window.addEventListener("mouseup", handleMouseup, { signal });
}
</script>
<style lang="css">
.infinity-canvas-item {
    position: absolute;
    left: 0;
    top: 0;
}
</style>