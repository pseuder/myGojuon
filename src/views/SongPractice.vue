<template>
  <div class="container w-[90vw] md:w-[80vw]">
    <h1>YouTube 日文歌曲字幕播放器</h1>
    <SearchBar @search="handleSearch" />
    <YouTubePlayer :videoId="videoId" @ready="onPlayerReady" />
    <Subtitles :subtitles="subtitles" @subtitle-click="handleSubtitleClick" />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import SearchBar from "@/components/SearchBar.vue";
import YouTubePlayer from "@/components/YouTubePlayer.vue";
import Subtitles from "@/components/Subtitles.vue";

const videoId = ref("-LwBbLa_Vhc");
const subtitles = ref([]);
const player = ref(null);

const handleSearch = async (query) => {
  // TODO: 使用 YouTube API 搜索視頻
  // 這裡應該調用您已有的 YouTube API 功能
  // const searchResult = await searchYouTubeVideos(query);
  // videoId.value = searchResult.items[0].id.videoId;
};

const onPlayerReady = (event) => {
  player.value = event.target;
};

const handleSubtitleClick = (time) => {
  if (player.value) {
    player.value.seekTo(time);
  }
};

watch(videoId, async () => {
  if (videoId.value) {
    // TODO: 獲取字幕
    // 這裡應該調用您已有的 YouTube API 功能來獲取字幕
    // const fetchedSubtitles = await getSubtitles(videoId.value);
    // subtitles.value = fetchedSubtitles;
  }
});
</script>

<style scoped></style>
