<template>
  <div class="subtitles">
    <p
      v-for="(subtitle, index) in subtitles"
      :key="index"
      @click="() => $emit('subtitle-click', subtitle.start)"
    >
      {{ subtitle.text }}
    </p>
  </div>
</template>

<script setup>
defineProps(["subtitles"]);
defineEmits(["subtitle-click"]);
</script>
