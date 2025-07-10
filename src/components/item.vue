<template>
    <div ref="root" class="item" :style="style">
        <slot></slot>

        <div class="resize-box">
            <div @mousedown.stop.left.self.prevent="onMousedown" v-for="dot in dots" :key="dot.cursor" class="dot"
                :data-cursor="dot.cursor" :data-direction="dot.direction"
                :style="{ left: dot.left, top: dot.top, cursor: dot.cursor }"></div>
        </div>
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
        width?: number,
        height?: number,
        left?: number,
        top?: number,
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

// resieze

const dots = [{
    cursor: 'nwse-resize',
    direction: 'left-top',
    left: '-13px',
    top: '-13px',
},
{
    cursor: 'ns-resize',
    direction: 'top',
    left: 'calc(50% - 13px)',
    top: '-13px',
},
{
    cursor: 'nesw-resize',
    direction: 'right-top',
    left: 'calc(100% - 13px)',
    top: '-13px',
},
{
    cursor: 'ew-resize',
    direction: 'right',
    left: 'calc(100% - 13px)',
    top: 'calc(50% - 13px)',
},
{
    cursor: 'nwse-resize',
    direction: 'right-bottom',
    left: 'calc(100% - 13px)',
    top: 'calc(100% - 13px)',
},
{
    cursor: 'ns-resize',
    direction: 'bottom',
    left: 'calc(50% - 13px)',
    top: 'calc(100% - 13px)',
},
{
    cursor: 'nesw-resize',
    direction: 'left-bottom',
    left: '-13px',
    top: 'calc(100% - 13px)',
},
{
    cursor: 'ew-resize',
    direction: 'left',
    left: '-13px',
    top: 'calc(50% - 13px)',
}]

function onMousedown(e: MouseEvent) {
    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;

    const direction = (e.target as HTMLElement)?.dataset.direction;

    window.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
            const offsetX = (e.clientX - startX) / props.scale;
            const offsetY = (e.clientY - startY) / props.scale;

            switch (direction) {
                case 'left-top':
                    emits('update', props.index, {
                        height: props.height - offsetY,
                        top: props.top + offsetY,
                        width: props.width - offsetX,
                        left: props.left + offsetX
                    });
                    break;
                case 'top':
                    emits('update', props.index, {
                        height: props.height - offsetY,
                        top: props.top + offsetY
                    });
                    break;
                case 'right-top':
                    emits('update', props.index, {
                        height: props.height - offsetY,
                        top: props.top + offsetY,
                        width: props.width + offsetX,
                    });
                    break;
                case 'right':
                    emits('update', props.index, {
                        width: props.width + offsetX,
                    });
                    break;
                case 'right-bottom':
                    emits('update', props.index, {
                        width: props.width + offsetX,
                        height: props.height + offsetY
                    });
                    break;
                case 'bottom':
                    emits('update', props.index, {
                        height: props.height + offsetY
                    });
                    break;
                case 'left-bottom':
                    emits('update', props.index, {
                        width: props.width - offsetX,
                        left: props.left + offsetX,
                        height: props.height + offsetY,
                    });
                    break;
                case 'left':
                    emits('update', props.index, {
                        width: props.width - offsetX,
                        left: props.left + offsetX,
                    });
                    break;
                default:
                    break;
            }

            startX = e.clientX;
            startY = e.clientY;
        },
        { signal }
    );
    window.addEventListener("mouseup", () => controller.abort(), { signal });
}

</script>

<style lang="css">
.resize-box {
    position: absolute;
    inset: -2px;
    border: 2px solid blueviolet;

    .dot {
        position: absolute;
        width: 26px;
        height: 26px;

        &::after {
            position: absolute;
            display: block;
            content: '';
            width: 10px;
            height: 10px;
            left: 8px;
            top: 8px;
            background-color: #fff;
            border-radius: 50%;
        }

    }
}
</style>