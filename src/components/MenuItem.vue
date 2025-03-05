// MenuItem.vue
<template>
  <el-menu-item :index="index" v-if="condition">
    <slot v-if="$slots.default"></slot>
    <template v-else>
      <span>{{ label }}</span>
    </template>
  </el-menu-item>
</template>

<script setup>
defineProps({
  index: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: null,
  },
  condition: {
    type: Boolean,
    default: true,
  },
});
</script>