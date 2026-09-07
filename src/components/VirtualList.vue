<template>
    <!--
        wheel 事件必须在这里判断是否截断：
        - 列表还能滚动时，阻止冒泡，避免画布同时移动
        - 列表到达边界时放行，让父级画布接管继续滚动
    -->
    <div ref="root" class="virtual-wrapper" @scroll="onScroll" @wheel="onWheel">
        <!-- 让滚动容器拥有真实总高度，浏览器才会产生可滚动区域 -->
        <div class="virtual-spacer" :style="{ height: `${totalHeight}px` }"></div>

        <!-- 真实渲染区域悬浮在 spacer 上方，避免额外流体高度影响滚动 -->
        <div class="virtual-list" :style="{ transform: `translateY(${translateY}px)` }">
            <div class="virtual-list-item" v-for="item in showList" :key="item.id">
                <slot :data="item"></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, computed } from 'vue';
import { useElementBounding } from '@vueuse/core';
import type { PropType } from 'vue';

type Item = {
    id: number | string;
    [key: string]: any;
}

const props = defineProps({
    list: {
        type: Array as PropType<Item[]>,
        required: true
    },
    itemHeight: {
        type: Number,
        default: 30
    }
})

const $root = useTemplateRef('root');
const { height } = useElementBounding($root);
const scrollBoundaryTolerance = 1;

const scrollTop = ref(0);

function getStartIndex() {
    return Math.floor(scrollTop.value / props.itemHeight);
}

const totalHeight = computed(() => {
    return props.list.length * props.itemHeight;
})

const translateY = computed(() => {
    // 让可视区始终对齐到整数 item 边界，避免滚动时抖动
    return scrollTop.value - (scrollTop.value % props.itemHeight);
})

function getVisibleRange() {
    const start = Math.max(0, getStartIndex());
    const overscan = 2;
    const visibleCount = Math.max(1, Math.ceil((height.value || 0) / props.itemHeight) + overscan);
    const end = Math.min(props.list.length, start + visibleCount);
    return { start, end };
}

const showList = computed(() => {
    const { start, end } = getVisibleRange();
    return props.list.slice(start, end);
})

function onScroll() {
    const root = $root.value;
    if (!root) return;

    // scrollTop 由浏览器更新，这里只同步虚拟渲染状态，不主动修改滚动位置。
    const nextScrollTop = root.scrollTop;
    if (Math.abs(nextScrollTop - scrollTop.value) < 0.5) {
        return;
    }

    scrollTop.value = nextScrollTop;
}

function onWheel(e: WheelEvent) {
    const root = $root.value;
    if (!root || e.ctrlKey) return;

    // 横向双指移动和 ctrl+wheel 缩放属于画布输入，不能被列表截断。
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    // 列表只有在还能消费当前方向的滚动时，才独占这次 wheel。
    // 到达边界后必须放行事件，否则画布永远收不到继续移动的输入。
    const isAtTop = root.scrollTop <= 0 && e.deltaY < 0;
    const isAtBottom = root.scrollTop >= root.scrollHeight - root.clientHeight - scrollBoundaryTolerance && e.deltaY > 0;
    if (isAtTop || isAtBottom) return;

    e.stopPropagation();
}

</script>

<style lang="css">
.virtual-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
}

.virtual-spacer {
    width: 100%;
}

.virtual-list {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}
</style>