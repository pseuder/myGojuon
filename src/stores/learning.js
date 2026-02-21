// stores/handwriting.js
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

const TAB_TYPES = {
  HIRAGANA: "hiragana",
  KATAKANA: "katakana",
  DAKUON: "dakuon",
  HANDAKUON: "handakuon",
  YOON: "yoon",
};

export const useLearningStore = defineStore(
  "learning",
  () => {
    const writing_tab = ref(TAB_TYPES.HIRAGANA);
    const writing_selectedSound = ref({ kana: "あ", romaji: "a", evo: "安" });
    const writing_autoplay = ref(true);
    const writing_exampleScale = ref(80);
    const pen_color = ref("#000000");

    const listening_tab = ref(TAB_TYPES.HIRAGANA);
    const listening_mode = ref(true);
    const listening_round = ref(1);
    const listening_roundCounts = ref({});
    const listening_specialLearningList = ref([]);
    const listening_selectedSound = ref({
      kana: "あ",
      romaji: "a",
      evo: "安",
      type: TAB_TYPES.HIRAGANA,
    });

    return {
      writing_tab,
      writing_selectedSound,
      writing_autoplay,
      writing_exampleScale,
      pen_color,
      listening_tab,
      listening_mode,
      listening_round,
      listening_roundCounts,
      listening_specialLearningList,
      listening_selectedSound,
    };
  },
  {
    persist: true, // 全部 state 自動存到 localStorage
  },
);
