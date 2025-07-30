<template>
    <div @wheel.prevent="onWheel" @mousedown.middle="onMousedownMiddle" ref="root" class="infinity-canvas">
        <div ref="frame" class="infinity-canvas-frame" :style="transformStyle" @mousedown.left="onMousedown">
            <resize v-if="curentItem" :width="curentItem.width" :height="curentItem.height" :left="curentItem.left"
                :top="curentItem.top" :scale="scale" @update="update(curentIndex!, $event)" />

            <template v-for="(item, i) in list" :key="i">
                <CanvasItem v-if="showItem(item)"
                    :class="{ current: i === curentIndex, selected: selected.includes(i) }"
                    @current-selected="($event) => curentIndex = $event" :index="i" :width="item.width"
                    :height="item.height" :left="item.left" :top="item.top" @update:move="updatePosition">
                    <slot :item="item" />
                </CanvasItem>
            </template>

            <div :style="boxStyle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef, nextTick, watch } from 'vue'
import { useElementBounding } from '@vueuse/core'
import type { CSSProperties } from 'vue'

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
    },
    initScale: {
        type: Number,
        default: 1
    },
    initPosX: {
        type: Number,
        default: 0
    },
    initPosY: {
        type: Number,
        default: 0
    }
})

const emits = defineEmits<{
    'update': [index: number, item: Partial<IInfinityCanvasItem>],
    'update:transform': [scale: number, posX: number, posY: number]
}>()


const $root = useTemplateRef('root');
const { width: rootWidth, height: rootHeight, x: rootLeft, y: rootTop } = useElementBounding($root);

// 如果没有指定画布大小，默认为容器的 3 倍
const canvasWidth = computed(() => props.canvasWidth ? Math.max(props.canvasWidth, rootWidth.value) : rootWidth.value * 3)
const canvasHeight = computed(() => props.canvasHeight ? Math.max(props.canvasHeight, rootHeight.value) : rootHeight.value * 3)

// 默认居中，方便计算 transform
const canvasLeft = computed(() => -(canvasWidth.value - rootWidth.value) / 2)
const canvasTop = computed(() => -(canvasHeight.value - rootHeight.value) / 2)

const scale = ref(limitScale(props.initScale));
const posX = ref(limitX(props.initPosX, scale.value));
const posY = ref(limitY(props.initPosY, scale.value));

watch([scale, posX, posY], () => {
    emits('update:transform', scale.value, posX.value, posY.value);
}, { immediate: false })

// -distance < v < distance
function limitX(v: number, scale: number) {
    const distance = (canvasWidth.value * scale - rootWidth.value) / 2;
    return Math.min(distance, Math.max(-distance, v));
}

function limitY(v: number, scale: number) {
    const distance = (canvasHeight.value * scale - rootHeight.value) / 2;
    return Math.min(distance, Math.max(-distance, v));
}

function limitScale(v: number): number {
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

// 鼠标中键拖动画布移动
function onMousedownMiddle(e: MouseEvent) {
    e.preventDefault();
    const controller = new AbortController();
    const signal = controller.signal;

    let startX = e.clientX;
    let startY = e.clientY;

    window.addEventListener("mousemove", (e: MouseEvent) => {
        posX.value = limitX(posX.value + (e.clientX - startX), scale.value);
        posY.value = limitY(posY.value + (e.clientY - startY), scale.value);

        startX = e.clientX;
        startY = e.clientY;

    }, { signal });

    window.addEventListener("mouseup", () => {
        controller.abort();
    }, { signal });
}

// 选中逻辑
const curentIndex = ref<number | null>(null);
const curentItem = computed(() => {
    return curentIndex.value === null ? null : props.list[curentIndex.value];
});

// 通知父组件更新数据
function update(index: number, data: Partial<IInfinityCanvasItem>) {
    // 不要直接修改 props.list
    // 也不要返回整个更新后的 [...props.list]，只返回更新的项和索引， 这样外面就不会频繁的创建数组

    if (data.left !== undefined) {
        data.left = Math.min(data.left, canvasWidth.value - props.list[index].width);
        data.left = Math.max(data.left, 0);
    }
    if (data.top !== undefined) {
        data.top = Math.min(data.top, canvasHeight.value - props.list[index].height);
        data.top = Math.max(data.top, 0);
    }
    emits('update', index, data);
}

function updatePosition(index: number, x: number, y: number) {
    if (selected.value.length) {
        if (!selected.value.includes(index)) {
            selected.value = [index];
        }
        selected.value.forEach(i => {
            updateItemPosition(i, x, y);
        });
    } else {
        updateItemPosition(index, x, y);
    }
}
function updateItemPosition(index: number, x: number, y: number) {
    const item = props.list[index];
    if (item) {
        const left = item.left + x / scale.value;
        const top = item.top + y / scale.value;
        update(index, { left, top });
    }
}


// 框选开始
const $frame = useTemplateRef('frame');
const positionStart = ref<{ x: number, y: number } | null>(null);
const positionEnd = ref<{ x: number, y: number } | null>(null);
const boxStyle = computed<CSSProperties>(() => {
    if (!positionStart.value || !positionEnd.value) return { display: 'none' };

    // 确保坐标是相对于画布原始大小(未缩放前)
    const left = Math.min(positionStart.value.x, positionEnd.value.x);
    const top = Math.min(positionStart.value.y, positionEnd.value.y);
    const width = Math.abs(positionStart.value.x - positionEnd.value.x);
    const height = Math.abs(positionStart.value.y - positionEnd.value.y);

    return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: `${1 / scale.value}px dashed #fff`,
        position: 'absolute',
        pointerEvents: 'none' // 避免拦截鼠标事件
    };
});

function getLocalPosition(e: MouseEvent) {
    if (!$frame.value) return null;
    const rect = $frame.value.getBoundingClientRect();
    // 正确的本地坐标计算：
    // 1. 鼠标坐标减去元素位置(已包含transform影响)
    // 2. 再除以scale得到原始坐标
    return {
        x: (e.clientX - rect.left) / scale.value,
        y: (e.clientY - rect.top) / scale.value
    };
}

function onMousedown(e: MouseEvent) {
    const controller = new AbortController();
    const signal = controller.signal;

    positionStart.value = getLocalPosition(e);
    const startTime = Date.now();

    window.addEventListener(
        "mousemove",
        (e: MouseEvent) => {
            positionEnd.value = getLocalPosition(e);
            nextTick(() => {
                updateSelectedItems();
            });
        },
        { signal }
    );
    window.addEventListener("mouseup", () => {
        controller.abort();
        positionStart.value = null;
        positionEnd.value = null;
        if (Date.now() - startTime < 200) {
            // 不能直接监听 click 事件，否则每次框选完毕都会触发
            // 所以使用 mousedown 事件的时间差来判断是否是点击
            clickFrame()
        }
    }, { signal });
}

const selected = ref<number[]>([]);

function updateSelectedItems() {
    if (!positionStart.value || !positionEnd.value) {
        selected.value = [];
        return;
    }

    const left = Math.min(positionStart.value.x, positionEnd.value.x);
    const right = Math.max(positionStart.value.x, positionEnd.value.x);
    const top = Math.min(positionStart.value.y, positionEnd.value.y);
    const bottom = Math.max(positionStart.value.y, positionEnd.value.y);

    selected.value = props.list
        .reduce<number[]>((result, item, index) => {
            const itemLeft = item.left;
            const itemTop = item.top;
            const itemRight = item.left + item.width;
            const itemBottom = item.top + item.height;

            // 检查两个矩形是否有重叠 （反向判断： 不重叠的情况取反）
            const overlaps = !(
                right < itemLeft || left > itemRight ||
                bottom < itemTop || top > itemBottom
            );

            if (overlaps) {
                result.push(index);
            }
            return result;
        }, [])
}

function clickFrame() {
    curentIndex.value = null;
    selected.value = [];
}

// 框选结束

// 计算视口范围（以画布原始坐标为基准）
const viewport = computed(() => {
    // 画布中心点在容器中的位置
    const canvasCenterX = rootWidth.value / 2 + posX.value;
    const canvasCenterY = rootHeight.value / 2 + posY.value;

    // 画布原点（左上角）在容器中的位置
    const canvasOriginX = canvasCenterX - (canvasWidth.value * scale.value) / 2;
    const canvasOriginY = canvasCenterY - (canvasHeight.value * scale.value) / 2;

    // 容器左上角在画布原始坐标系下的位置
    const left = (0 - canvasOriginX) / scale.value;
    const top = (0 - canvasOriginY) / scale.value;

    // 容器右下角在画布原始坐标系下的位置
    const right = (rootWidth.value - canvasOriginX) / scale.value;
    const bottom = (rootHeight.value - canvasOriginY) / scale.value;

    return { left, top, right, bottom };
});

// 判断 item 是否在视口内
function showItem(item: IInfinityCanvasItem) {
    const vp = viewport.value;
    const itemLeft = item.left;
    const itemRight = item.left + item.width;
    const itemTop = item.top;
    const itemBottom = item.top + item.height;

    // 只要有交集就显示
    return !(
        itemRight < vp.left ||
        itemLeft > vp.right ||
        itemBottom < vp.top ||
        itemTop > vp.bottom
    );
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
        box-sizing: border-box;

        .resize {
            /* 不能大于选中的 infinity-canvas-item  */
            z-index: 9;
        }

        .infinity-canvas-item {
            &.current {
                z-index: 10;
            }

            &.selected {
                outline: 1px solid blue;
            }
        }
    }
}
</style>