<template>
  <div class="w-full h-full">
    <div ref="youtube" style="width: 100%" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { usePlayer } from "@vue-youtube/core";
// const props = defineProps(["videoId"]);
// const emit = defineEmits(["ready"]);

// const onReady = (event) => {
//   emit("ready", event);
// };

const videoId = ref("dQw4w9WgXcQ");
const youtube = ref();

const { onReady } = usePlayer(videoId, youtube, {
  cookie: false,
  playerVars: {
    mute: 1,
  },
});

onReady((event) => {
  event.target.playVideo();
});
</script>
