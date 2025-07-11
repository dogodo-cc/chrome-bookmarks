<template>
    <div @wheel.prevent="onWheel" ref="root" class="infinity-canvas">
        <div class="infinity-canvas-frame" :style="transformStyle" @click.self="curentIndex = null">
            <resize v-if="curentItem" :width="curentItem.width" :height="curentItem.height" :left="curentItem.left"
                :top="curentItem.top" :scale="scale" @update="update(curentIndex!, $event)" />

            <CanvasItem :class="{ selected: i === curentIndex }" @select="() => curentIndex = i" :scale="scale"
                :index="i" v-for="(item, i) in list" :key="i" :width="item.width" :height="item.height"
                :left="item.left" :top="item.top" @update="update(i, $event)">
                <slot :item="item" />
            </CanvasItem>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useElementBounding } from '@vueuse/core'

import resize from './resize.vue'
import CanvasItem from './infinity-canvas-item.vue'
import type { IInfinityCanvasItem } from './type'

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
    list: {
        type: Array as () => IInfinityCanvasItem[],
        default: () => []
    }
})

const emits = defineEmits<{
    'update': [list: IInfinityCanvasItem[]],
}>()


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

// 选中逻辑
const curentIndex = ref<number | null>(null);
const curentItem = computed(() => {
    return curentIndex.value === null ? null : props.list[curentIndex.value];
});

// 通知父组件更新数据
function update(i: number, data: Partial<IInfinityCanvasItem>) {
    const list = [...props.list];
    Object.assign(list[i], data)
    emits('update', list);
}


</script>

<style lang="css">
.infinity-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .infinity-canvas-frame {
        position: absolute;
        transform-origin: center center;
        background: rgb(102, 102, 134) no-repeat center center;

        .resize {
            /* 确保不能操作选中的 item  */
            z-index: 9;
        }

        .infinity-canvas-item {
            &.selected {
                z-index: 10;
            }
        }
    }
}
</style>