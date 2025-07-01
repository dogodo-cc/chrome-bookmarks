<template>
    <div ref="root" class="zoom-container">
        <div ref="frame" class="frame" :style="transformStyle">
            <div class="item" v-for="i in 1000" :key="i">{{ i }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue'
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


function limitX(v: number, scale: number) {
    const distance = (canvasWidth.value * scale - rootWidth.value) / 2;
    // -distance < v < distance
    return Math.min(distance, Math.max(-distance, v));
}

function limitY(v: number, scale: number) {
    const distance = (canvasHeight.value * scale - rootHeight.value) / 2;
    // -distance < v < distance
    return Math.min(distance, Math.max(-distance, v));
}

function limitScale(v: number) {
    const scaledWidth = canvasWidth.value * v;
    const scaledHeight = canvasHeight.value * v;

    // 如果缩小后，画布仍然比容器大，就允许
    const canShrinkX = scaledWidth >= rootWidth.value;
    const canShrinkY = scaledHeight >= rootHeight.value;

    if (!canShrinkX || !canShrinkY) {
        return scale.value; // 缩小会导致留白
    }

    return Math.min(3, Math.max(0.1, v));
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
            const scaleRatio = newScale / oldScale;

            // 锚点：画布中心（考虑 canvasLeft 和 posX）
            const anchorX = (canvasLeft.value + posX.value) + (canvasWidth.value * scale.value) / 2;
            const anchorY = (canvasTop.value + posY.value) + (canvasHeight.value * scale.value) / 2;

            // 重新计算 posX, posY
            posX.value = limitX((posX.value - anchorX) * scaleRatio + anchorX, newScale);
            posY.value = limitY((posY.value - anchorY) * scaleRatio + anchorY, newScale);

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

</script>

<style scoped>
.zoom-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.frame {
    position: absolute;
    /* left: 50%;
    top: 50%; */
    background: blue no-repeat center center;

    transform-origin: center center;

    display: flex;
    flex-wrap: wrap;

    font-size: 50px;
    font-family: Arial, Helvetica, sans-serif;
    color: white;

    /* 强制启用 GPU 加速合成层 */
    /* will-change: transform; */

    & .item {
        text-align: center;
        width: 100px;
        height: 100px;
        line-height: 100px;
        border: 1px solid red;
    }

}
</style>