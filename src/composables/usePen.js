import { ref, reactive } from "vue";
/*-- store --*/
import { useLearningStore } from "@/stores/learning.js";
const learningStore = useLearningStore();

export function usePen() {
  const penMode = ref(false);
  const penColor = ref(learningStore.pen_color);

  const penSize = ref(10);
  const penSizeOptions = reactive([
    { label: "細", value: 6 },
    { label: "中", value: 8 },
    { label: "粗", value: 10 },
  ]);

  return {
    penMode,
    penColor,
    penSize,
    penSizeOptions,
  };
}
