<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="query" type="text" placeholder="搜索日文歌曲..." />
    <button type="submit">搜索</button>
  </form>
</template>

<script setup>
import { ref } from "vue";

const query = ref("");
const emit = defineEmits(["search"]);

const handleSubmit = () => {
  emit("search", query.value);
};
</script>
