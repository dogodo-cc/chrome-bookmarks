<template>
    <div ref="root" class="item" :style="style">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import useMousemove from './use-mousemove'

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
    },
    scale: {
        type: Number,
        required: true
    }
})

const emits = defineEmits<{
    'update': [id: number, data: {
        width: number,
        height: number,
        left: number,
        top: number,
    }]
}>()

const style = computed(() => {
    return {
        transform: `translate3d(${props.left}px, ${props.top}px, 0)`,
        width: props.width + 'px',
        height: props.height + 'px'
    }
})

const $root = useTemplateRef('root');

useMousemove($root, (x, y) => {
    const left = props.left + x / props.scale;
    const top = props.top + y / props.scale;

    emits('update', props.index, {
        width: props.width,
        height: props.height,
        left: left,
        top: top
    });
})

</script>