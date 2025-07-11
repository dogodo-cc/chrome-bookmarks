<template>
    <!-- .prevent 会导致内部 input 无法获取焦点 -->
    <div class="infinity-canvas-item" @mousedown.stop.left="onMousedown" :style="style">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { IInfinityCanvasItem } from './type'

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
    scale: {
        type: Number,
        required: true
    }
})

const emits = defineEmits<{
    'update': [data: Partial<IInfinityCanvasItem>],
    'select': []
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

            const left = props.left + offsetX / props.scale;
            const top = props.top + offsetY / props.scale;

            emits('update', {
                left: left,
                top: top
            });

            startX = e.clientX;
            startY = e.clientY;
        },
        { signal }
    );
    window.addEventListener("mouseup", () => {
        controller.abort();
        if (Date.now() - startTime < 200) {
            emits('select');
        }
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