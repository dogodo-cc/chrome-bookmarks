<template>
    <div ref="root" class="infinity-canvas">
        <div class="frame" :style="transformStyle">
            <div class="item" v-for="i in 1000" :key="i">{{ i }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useElementBounding } from '@vueuse/core'
const props = defineProps({
    canvasWidth: {
        type: Number,
        required: false
    },
    canvasHeight: {
        type: Number,
        required: false
    }
})


const $root = useTemplateRef('root');
const { width: rootWidth, height: rootHeight } = useElementBounding($root);

// 如果没有指定画布大小，默认为容器的 3 倍
const canvasWidth = computed(() => props.canvasWidth || rootWidth.value * 3)
const canvasHeight = computed(() => props.canvasHeight || rootHeight.value * 3)

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
        return Math.min(3, Math.max(0.2, v));
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
    console.log(e.offsetX, e.offsetY, e)
    if (e.ctrlKey) {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const oldScale = scale.value;
        const newScale = limitScale(oldScale - delta * 0.01);

        if (newScale !== oldScale) {
            const radio = newScale / oldScale;
            // 计算因为缩放导致的偏移
            const _x = posX.value * radio - posX.value;
            const _y = posY.value * radio - posY.value;
            // 修正偏移 就可以达到以视觉中心缩放的效果
            posX.value = limitX(posX.value + _x, newScale);
            posY.value = limitY(posY.value + _y, newScale);
            scale.value = newScale;
        }
    } else {
        posX.value = limitX(posX.value - e.deltaX * 2, scale.value);
        posY.value = limitY(posY.value - e.deltaY * 2, scale.value);
    }
}


onMounted(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
})
onUnmounted(() => {
    window.removeEventListener('wheel', onWheel)
})

</script>

<style lang="css">
.infinity-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &::before,
    &::after {
        display: block;
        content: '';
        position: absolute;
        background-color: red;
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

.frame {
    position: absolute;
    transform-origin: center center;

    background: rgb(102, 102, 134) no-repeat center center;
    display: flex;
    flex-wrap: wrap;

    &::before,
    &::after {
        display: block;
        content: '';
        position: absolute;
        background-color: black;
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

    /* 强制启用 GPU 加速合成层 */
    /* will-change: transform; */

    & .item {
        box-sizing: border-box;
        text-align: center;
        width: 100px;
        height: 100px;
        line-height: 100px;
        border: 1px dashed #eee;
        font-size: 50px;
        font-family: Arial, Helvetica, sans-serif;
        color: white;
    }

}
</style>