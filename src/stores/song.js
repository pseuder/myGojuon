// stores/song.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSongStore = defineStore(
  "song",
  () => {
    // --- State ---
    // playMode: 'normal' | 'loop' | 'shuffle'
    const playMode = ref("loop");
    const playbackRate = ref(1);
    const autoScroll = ref(true);
    const leftWidth = ref(50);
    // 歌詞跟隨偏移（秒）：正值讓歌詞提早切換，負值延後
    const lyricOffset = ref(0);
    const display_mode = ref("both");

    return {
      playMode,
      playbackRate,
      autoScroll,
      leftWidth,
      lyricOffset,
      display_mode,
    };
  },
  {
    persist: true,
  },
);
