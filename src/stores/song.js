// stores/song.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSongStore = defineStore(
  "song",
  () => {
    // --- State ---
    const autoPlayNext = ref(false);
    const playbackRate = ref(1);
    const autoScroll = ref(true);
    const leftWidth = ref(50);
    const display_mode = ref("both");

    return {
      autoPlayNext,
      playbackRate,
      autoScroll,
      leftWidth,
      display_mode,
    };
  },
  {
    persist: true,
  },
);
