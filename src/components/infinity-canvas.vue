<template>
    <!--
        画布统一接收未被子列表截断的 wheel：
        VirtualList 在内部可滚动时会 stopPropagation，边界处才会到这里。
        .prevent 是为了避免浏览器默认滚动，只让画布自己的 pan/zoom 生效。
    -->
    <div @wheel.prevent="onWheel" @mousedown.right="onMousedownRight" @contextmenu.prevent ref="root"
        class="infinity-canvas" :class="{ panning: isPanning }">
        <div ref="frame" class="infinity-canvas-frame" @mousedown.left="onMousedown">
            <resize v-if="currentItem" :width="currentItem.width" :height="currentItem.height" :left="currentItem.left"
                :top="currentItem.top" :scale="scale" @update="update(currentIndex!, $event)" />

            <template v-for="visible in visibleItems" :key="visible.item?.id ?? `canvas-item-${visible.index}`">
                <CanvasItem
                    :class="{ current: visible.index === currentIndex, selected: selected.includes(visible.index) }"
                    @current-selected="($event) => currentIndex = $event" :index="visible.index" :width="visible.item.width"
                    :height="visible.item.height" :left="visible.item.left" :top="visible.item.top" @update:move="updatePosition">
                    <slot :item="visible.item" />
                </CanvasItem>
            </template>

            <div :style="boxStyle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef, nextTick, watch, onMounted } from 'vue'
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
const $frame = useTemplateRef('frame');
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

let frameSyncRafId: number | null = null;
function syncFrameStyle() {
    if (!$frame.value) return;

    $frame.value.style.width = `${canvasWidth.value}px`;
    $frame.value.style.height = `${canvasHeight.value}px`;
    $frame.value.style.left = `${canvasLeft.value}px`;
    $frame.value.style.top = `${canvasTop.value}px`;
    $frame.value.style.transform = `translate3d(${posX.value}px, ${posY.value}px, 0) scale(${scale.value})`;
}

function scheduleFrameStyle() {
    if (frameSyncRafId !== null) return;
    frameSyncRafId = requestAnimationFrame(() => {
        frameSyncRafId = null;
        syncFrameStyle();
    });
}

watch([scale, posX, posY], () => {
    emits('update:transform', scale.value, posX.value, posY.value);
    scheduleFrameStyle();
}, { immediate: true })

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

function normalizeWheelAxis(delta: number, mode: number) {
    // macBook 触摸板双指移动/滚动会走 wheel，而且 deltaMode 可能不是 0。
    // 必须按 X/Y 分别归一化，不能把两个轴混成一个值，否则会出现“向下移动时顺带偏右”的现象。
    if (mode === 1) {
        return delta * 16;
    }
    if (mode === 2) {
        return delta * 120;
    }
    return delta;
}

function applyPan(deltaX: number, deltaY: number) {
    posX.value = limitX(posX.value - deltaX, scale.value);
    posY.value = limitY(posY.value - deltaY, scale.value);
}

function zoomAtPointer(nextScale: number, clientX: number, clientY: number) {
    const radio = nextScale / scale.value;
    const dx = props.focusMouse ? clientX - (rootLeft.value + rootWidth.value / 2) : 0;
    const dy = props.focusMouse ? clientY - (rootTop.value + rootHeight.value / 2) : 0;

    posX.value = limitX((posX.value - dx) * radio + dx, nextScale);
    posY.value = limitY((posY.value - dy) * radio + dy, nextScale);
    scale.value = nextScale;
}

function handleWheelZoom(e: WheelEvent) {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const oldScale = scale.value;
    const nextScale = limitScale(oldScale - normalizeWheelAxis(delta, e.deltaMode) * 0.01);

    if (nextScale === oldScale) {
        return;
    }

    zoomAtPointer(nextScale, e.clientX, e.clientY);
}

function handleWheelPan(e: WheelEvent) {
    const deltaX = normalizeWheelAxis(e.deltaX, e.deltaMode);
    const deltaY = normalizeWheelAxis(e.deltaY, e.deltaMode);
    applyPan(deltaX * 2, deltaY * 2);
}

function onWheel(e: WheelEvent) {
    // 这里的关键点：Mac 触摸板双指移动是 wheel 事件，不是普通 touch/pointer 拖动。
    // 处理时必须保留真实的 deltaX/deltaY 轴向信息，不能用单一主轴值覆盖两条轴。
    if (e.ctrlKey) {
        handleWheelZoom(e);
        return;
    }

    handleWheelPan(e);
}

// 鼠标右键拖动画布移动
const isPanning = ref(false);

function onMousedownRight(e: MouseEvent) {
    e.preventDefault();
    const controller = new AbortController();
    const signal = controller.signal;

    isPanning.value = true;

    let startX = e.clientX;
    let startY = e.clientY;

    window.addEventListener("mousemove", (e: MouseEvent) => {
        posX.value = limitX(posX.value + (e.clientX - startX), scale.value);
        posY.value = limitY(posY.value + (e.clientY - startY), scale.value);

        startX = e.clientX;
        startY = e.clientY;

    }, { signal });

    window.addEventListener("mouseup", () => {
        isPanning.value = false;
        controller.abort();
    }, { signal });
}

// 选中逻辑
const currentIndex = ref<number | null>(null);
const currentItem = computed(() => {
    return currentIndex.value === null ? null : props.list[currentIndex.value];
});

// 通知父组件更新数据
function update(index: number, data: Partial<IInfinityCanvasItem>) {
    const current = props.list[index];
    if (!current) return;

    const nextWidth = data.width !== undefined ? Math.max(20, data.width) : current.width;
    const nextHeight = data.height !== undefined ? Math.max(20, data.height) : current.height;

    const nextLeft = data.left !== undefined ? Math.min(Math.max(0, data.left), Math.max(0, canvasWidth.value - nextWidth)) : current.left;
    const nextTop = data.top !== undefined ? Math.min(Math.max(0, data.top), Math.max(0, canvasHeight.value - nextHeight)) : current.top;

    if (data.width !== undefined) {
        data.width = nextWidth;
    }
    if (data.height !== undefined) {
        data.height = nextHeight;
    }
    if (data.left !== undefined) {
        data.left = nextLeft;
    }
    if (data.top !== undefined) {
        data.top = nextTop;
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
    currentIndex.value = null;
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

const visibleIndexes = ref<number[]>([])
let visibleUpdateRafId: number | null = null;

function calcVisibleIndexes() {
    const vp = viewport.value;
    const nextVisible: number[] = [];

    for (let i = 0; i < props.list.length; i++) {
        const item = props.list[i];
        const itemLeft = item.left;
        const itemRight = item.left + item.width;
        const itemTop = item.top;
        const itemBottom = item.top + item.height;

        if (!(itemRight < vp.left || itemLeft > vp.right || itemBottom < vp.top || itemTop > vp.bottom)) {
            nextVisible.push(i);
        }
    }

    visibleIndexes.value = nextVisible;
}

function scheduleVisibleUpdate() {
    if (visibleUpdateRafId !== null) return;
    visibleUpdateRafId = requestAnimationFrame(() => {
        visibleUpdateRafId = null;
        calcVisibleIndexes();
    });
}

const visibleItems = computed(() =>
    visibleIndexes.value.map(index => ({ index, item: props.list[index] })).filter(item => item.item)
)

watch([() => props.list.length, rootWidth, rootHeight, scale, posX, posY], () => {
    scheduleVisibleUpdate();
}, { flush: 'post' })

watch(() => props.list, () => {
    scheduleVisibleUpdate();
}, { deep: true, flush: 'post' })

onMounted(() => {
    syncFrameStyle();
    scheduleVisibleUpdate();
})

</script>

<style lang="css">
.infinity-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &.panning {
        cursor: grabbing;

        * {
            cursor: grabbing !important;
        }
    }

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
