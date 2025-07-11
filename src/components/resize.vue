<template>
    <div class="resize" :style="style">
        <slot></slot>

        <div class="resize-box">
            <div class="dot" @mousedown.stop.left.self.prevent="onDotMousedown($event, dot.direction)"
                v-for="dot in dots" :key="dot.direction" :data-direction="dot.direction"
                :style="{ left: dot.left, top: dot.top, cursor: dot.cursor }"></div>
        </div>
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
    'update': [data: Partial<IInfinityCanvasItem>]
}>()

const style = computed(() => {
    return {
        transform: `translate3d(${props.left}px, ${props.top}px, 0)`,
        width: props.width + 'px',
        height: props.height + 'px',
        '--border-width': `${2 / props.scale}px`,
        '--area-size': `${26 / props.scale}px`,
        '--dot-size': `${10 / props.scale}px`
    }
})

// resieze
const halfSize = '(var(--area-size) / 2)';
const halfBorderWidth = '(var(--border-width) / 2)';

const left1 = `calc(${halfSize} * -1 - ${halfBorderWidth})`;
const left2 = `calc(50% - ${halfSize})`;
const left3 = `calc(100% - ${halfSize} + ${halfBorderWidth})`;

const top1 = left1;
const top2 = left2;
const top3 = left3;

const dots = [{
    cursor: 'nwse-resize',
    direction: 'left-top',
    left: left1,
    top: top1
},
{
    cursor: 'ns-resize',
    direction: 'top',
    left: left2,
    top: top1
},
{
    cursor: 'nesw-resize',
    direction: 'right-top',
    left: left3,
    top: top1
},
{
    cursor: 'ew-resize',
    direction: 'right',
    left: left3,
    top: top2,
},
{
    cursor: 'nwse-resize',
    direction: 'right-bottom',
    left: left3,
    top: top3,
},
{
    cursor: 'ns-resize',
    direction: 'bottom',
    left: left2,
    top: top3,
},
{
    cursor: 'nesw-resize',
    direction: 'left-bottom',
    left: left1,
    top: top3,
},
{
    cursor: 'ew-resize',
    direction: 'left',
    left: left1,
    top: top2,
}]

function onDotMousedown(e: MouseEvent, direction: string) {
    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;

    window.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
            const offsetX = (e.clientX - startX) / props.scale;
            const offsetY = (e.clientY - startY) / props.scale;

            switch (direction) {
                case 'left-top':
                    emits('update', {
                        height: props.height - offsetY,
                        top: props.top + offsetY,
                        width: props.width - offsetX,
                        left: props.left + offsetX
                    });
                    break;
                case 'top':
                    emits('update', {
                        height: props.height - offsetY,
                        top: props.top + offsetY
                    });
                    break;
                case 'right-top':
                    emits('update', {
                        height: props.height - offsetY,
                        top: props.top + offsetY,
                        width: props.width + offsetX,
                    });
                    break;
                case 'right':
                    emits('update', {
                        width: props.width + offsetX,
                    });
                    break;
                case 'right-bottom':
                    emits('update', {
                        width: props.width + offsetX,
                        height: props.height + offsetY
                    });
                    break;
                case 'bottom':
                    emits('update', {
                        height: props.height + offsetY
                    });
                    break;
                case 'left-bottom':
                    emits('update', {
                        width: props.width - offsetX,
                        left: props.left + offsetX,
                        height: props.height + offsetY,
                    });
                    break;
                case 'left':
                    emits('update', {
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
.resize {
    position: absolute;
}

.resize-box {
    position: absolute;

    inset: calc(var(--border-width) / 2 * -1);
    border: var(--border-width) solid blueviolet;

    .dot {
        position: absolute;
        width: var(--area-size);
        height: var(--area-size);

        &::after {
            position: absolute;
            display: block;
            content: '';
            width: var(--dot-size);
            height: var(--dot-size);
            left: calc((var(--area-size) - var(--dot-size)) / 2);
            top: calc((var(--area-size) - var(--dot-size)) / 2);
            background-color: #fff;
            border-radius: 50%;
        }

    }
}
</style>