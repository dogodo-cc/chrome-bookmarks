<template>
  <div class="inline-rename" @mousedown.stop>
    <template v-if="isEditing">
      <input
        ref="inputRef"
        v-model="draft"
        class="inline-rename-input"
        type="text"
        :placeholder="emptyText"
        @keydown.enter.prevent="submit"
        @keydown.esc.prevent="cancel"
        @blur="submit"
      >
    </template>

    <template v-else>
      <slot name="view" :text="displayText" :startEdit="startEdit">
        <span class="inline-rename-text" @dblclick.stop="startEdit">{{ displayText }}</span>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  value?: string;
  emptyText?: string;
}>(), {
  value: '',
  emptyText: '未命名'
});

const emit = defineEmits<{
  save: [title: string];
  cancel: [];
}>();

const isEditing = ref(false);
const draft = ref(props.value ?? '');
const inputRef = ref<HTMLInputElement | null>(null);

const displayText = computed(() => {
  return (props.value || '').trim() || props.emptyText;
});

watch(() => props.value, (nextValue) => {
  if (!isEditing.value) {
    draft.value = nextValue ?? '';
  }
});

function startEdit() {
  isEditing.value = true;
  draft.value = props.value ?? '';
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function submit() {
  const nextTitle = draft.value.trim();
  isEditing.value = false;

  if (!nextTitle) {
    draft.value = props.value ?? '';
    return;
  }

  if (nextTitle === (props.value ?? '').trim()) {
    return;
  }

  emit('save', nextTitle);
}

function cancel() {
  isEditing.value = false;
  draft.value = props.value ?? '';
  emit('cancel');
}
</script>

<style scoped>
.inline-rename {
  min-width: 0;
}

.inline-rename-text {
  display: block;
  min-width: 0;
}

.inline-rename-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #8ecae6;
  border-radius: 6px;
  outline: none;
  background-color: #fff;
  color: #1d3557;
}

.inline-rename-input:focus {
  border-color: #219ebc;
  box-shadow: 0 0 0 2px rgba(33, 158, 188, 0.18);
}
</style>
