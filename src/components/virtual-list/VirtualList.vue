<template>
    <div ref="root" class="virtual-list-container" @scroll="manager.handleScroll">
        <div :style="{ height: `${manager.totalHeight}px` }">
            <ul class="list" :style="{ transform: `translateY(${manager.translateY}px)` }">
                <li v-for="(item, index) in manager.showList" :key="item.id" :data-index="index" class="item">
                    {{ item.text }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import Manager from './index.ts';
import { reactive, onMounted, useTemplateRef, watch } from 'vue';
import { useElementBounding } from '@vueuse/core';

const $root = useTemplateRef('root');
const { height } = useElementBounding($root);

const manager = reactive(new Manager());
watch(height, (newVal) => {
    if (newVal) {
        manager.init(newVal, 60);
        manager.fetchItem();
    }
});
onMounted(() => {
    manager.init(height.value, 60);
    manager.fetchItem();
});
</script>

<style>
.virtual-list-container {
    width: 100%;
    height: 100%;
    background-color: cadetblue;
    overflow-y: auto;
}

.virtual-list-container ul {
    margin: 0;
    padding: 0;
}

.virtual-list-container li {
    box-sizing: border-box;
    list-style: none;
    height: 60px;
    line-height: 60px;
    border: 1px solid #333;
    text-align: center;
    font-size: 14px;
}
</style>
