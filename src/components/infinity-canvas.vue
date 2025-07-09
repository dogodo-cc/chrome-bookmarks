<template>
    <div ref="root" class="infinity-canvas" :class="{ 'show-line': showLine }">
        <div class="frame" :class="{ 'show-line': showLine }" :style="transformStyle">

            <CanvasItem :scale="scale" :index="i" v-for="(pos, i) in list" :key="i" :width="pos.width"
                :height="pos.height" :left="pos.left" :top="pos.top" @update="onMove">
                {{ i }}
            </CanvasItem>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useElementBounding } from '@vueuse/core'
// import useEllipseSpiralLayout from './use-spiral-layout'

import CanvasItem from './item.vue'
import useGridLayout from './use-grid-layout'
const props = defineProps({
    canvasWidth: {
        type: Number,
        required: false
    },
    canvasHeight: {
        type: Number,
        required: false
    },
    // 是否以鼠标位置为缩放中心
    focusMouse: {
        type: Boolean,
        default: true
    },
    scaleMax: {
        type: Number,
        default: 5
    },
    scaleMin: {
        type: Number,
        default: 0.2
    },
    showLine: {
        type: Boolean,
        default: false
    }
})


const $root = useTemplateRef('root');
const { width: rootWidth, height: rootHeight, x: rootLeft, y: rootTop } = useElementBounding($root);

// 如果没有指定画布大小，默认为容器的 3 倍
const canvasWidth = computed(() => props.canvasWidth ? Math.max(props.canvasWidth, rootWidth.value) : rootWidth.value * 3)
const canvasHeight = computed(() => props.canvasHeight ? Math.max(props.canvasHeight, rootHeight.value) : rootHeight.value * 3)

// 默认居中，方便计算 transform
const canvasLeft = computed(() => -(canvasWidth.value - rootWidth.value) / 2)
const canvasTop = computed(() => -(canvasHeight.value - rootHeight.value) / 2)

const scale = ref(1)
const posX = ref(0)
const posY = ref(0)

// -distance < v < distance
function limitX(v: number, scale: number) {
    const distance = (canvasWidth.value * scale - rootWidth.value) / 2;
    return Math.min(distance, Math.max(-distance, v));
}

function limitY(v: number, scale: number) {
    const distance = (canvasHeight.value * scale - rootHeight.value) / 2;
    return Math.min(distance, Math.max(-distance, v));
}

function limitScale(v: number) {
    const scaledWidth = canvasWidth.value * v;
    const scaledHeight = canvasHeight.value * v;

    // 如果缩小后，画布仍然比容器大，就允许
    const canShrinkX = scaledWidth >= rootWidth.value;
    const canShrinkY = scaledHeight >= rootHeight.value;

    if (canShrinkX && canShrinkY) {
        return Math.min(props.scaleMax, Math.max(props.scaleMin, v));
    }
    return scale.value;
}


const transformStyle = computed(() => ({
    transform: `translate3d(${posX.value}px, ${posY.value}px, 0) scale(${scale.value})`,
    width: canvasWidth.value + 'px',
    height: canvasHeight.value + 'px',
    left: canvasLeft.value + 'px',
    top: canvasTop.value + 'px',
}))

function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey) {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const oldScale = scale.value;
        const newScale = limitScale(oldScale - delta * 0.01);

        if (newScale !== oldScale) {
            const radio = newScale / oldScale;

            // 以视窗中心为缩放中心 (等于鼠标位于视窗中心点，没有偏移）
            let dx = 0;
            let dy = 0;

            // 以鼠标位置为缩放中心
            if (props.focusMouse) {
                // 计算出鼠标相对于原始缩放中心的偏移
                dx = e.clientX - (rootLeft.value + rootWidth.value / 2);
                dy = e.clientY - (rootTop.value + rootHeight.value / 2);
            }

            posX.value = limitX((posX.value - dx) * radio + dx, newScale);
            posY.value = limitY((posY.value - dy) * radio + dy, newScale);
            scale.value = newScale;
        }
    } else {
        posX.value = limitX(posX.value - e.deltaX * 2, scale.value);
        posY.value = limitY(posY.value - e.deltaY * 2, scale.value);
    }
}


onMounted(() => {
    $root.value?.addEventListener('wheel', onWheel, { passive: false })
})
onUnmounted(() => {
    $root.value?.removeEventListener('wheel', onWheel)
})



// 布局处理
const positions = useGridLayout({
    width: canvasWidth,
    height: canvasHeight,
    count: 100,
    // itemSize: 100,
    itemWidth: 100,
    itemHeight: 100,
    gap: 20
})

type IData = {
    id: number,
    width: number,
    height: number,
    left: number,
    top: number
}

const list = reactive<IData[]>([
    {
        id: 1,
        width: 100,
        height: 100,
        left: 2000,
        top: 1500,
    },
    {
        id: 2,
        width: 100,
        height: 100,
        left: 2200,
        top: 1500,
    },
])

function onMove(i: number, data: Partial<IData>) {
    list[i] = Object.assign(list[i], data)
}


</script>

<style lang="css">
.infinity-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .frame {
        position: absolute;
        transform-origin: center center;

        background: rgb(102, 102, 134) no-repeat center center;
        /* display: flex;
        flex-wrap: wrap; */

        .item {
            position: absolute;
            left: 0;
            top: 0;

            box-sizing: border-box;
            text-align: center;
            line-height: 100px;
            border: 1px dashed #eee;
            font-size: 50px;
            font-family: Arial, Helvetica, sans-serif;
            color: white;
            opacity: .7;
        }
    }
}

.show-line {

    &::before,
    &::after {
        display: block;
        content: '';
        position: absolute;
        background-color: #fff;
        z-index: 1;
    }

    &::before {
        top: calc(50% - 1px);
        left: 0;
        right: 0;
        height: 2px;
    }

    &::after {
        left: calc(50% - 1px);
        top: 0;
        bottom: 0;
        width: 2px;
    }
}
</style>