<template>
    <div ref="root" class="virtual-wrapper" @wheel="onWheel">
        <div :style="{ height: `${totalHeight}px` }">
            <div class="virtual-list" :style="{ transform: `translateY(${translateY}px)` }">
                <div class="virtual-list-item" v-for="item in showList" :key="item.id">
                    <slot :data="item"></slot>
                </div>
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

const scrollTop = ref(0);

const startIndex = computed(() => {
    return Math.floor(scrollTop.value / props.itemHeight);
})

const totalHeight = computed(() => {
    return props.list.length * props.itemHeight;
})

const translateY = computed(() => {
    return scrollTop.value - (scrollTop.value % props.itemHeight);
})

const showList = computed(() => {
    const start = Math.max(0, startIndex.value);
    const end = Math.min(props.list.length, start + Math.ceil(height.value / props.itemHeight) + 2);
    return props.list.slice(start, end);
})

function onWheel(e: WheelEvent) {
    if (e.ctrlKey) {
        // 让画布响应缩放
        return;
    }

    scrollTop.value = $root.value?.scrollTop || 0;

    // 仅当垂直滚动时阻止冒泡
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const { scrollHeight, clientHeight } = $root.value as HTMLElement;
        const isAtTop = scrollTop.value === 0 && e.deltaY < 0;
        const isAtBottom = scrollTop.value >= scrollHeight - clientHeight - 1 && e.deltaY > 0;

        // 如果已经到顶部或底部，且滚动方向是“继续滚动”的方向，则不阻止冒泡
        if (isAtTop || isAtBottom) {
            return;
        }
        // 阻止冒泡，防止触发画布的滚动事件
        e.stopPropagation();
    }
}

</script>

<style lang="css">
.virtual-wrapper {
    width: 100%;
    height: 100%;
    overflow-y: auto;
}
</style>