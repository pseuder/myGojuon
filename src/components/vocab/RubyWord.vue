<template>
  <!-- prettier-ignore -->
  <span class="ruby-word"><template v-for="(token, idx) in displayTokens" :key="idx"><ruby v-if="token.cvt && showKana">{{ token.ori }}<rt>{{ token.cvt }}</rt></ruby><span v-else>{{ token.ori }}</span></template></span>
</template>

<script setup>
import { computed } from "vue";

// tokens 格式與歌詞相同：[{ ori: "食", cvt: "た" }, { ori: "べる", cvt: "" }]
const props = defineProps({
  word: { type: String, default: "" },
  tokens: { type: Array, default: () => [] },
  showKana: { type: Boolean, default: true },
});

// tokens 與原文對不上時（例如剛改過字）直接顯示原文
const displayTokens = computed(() => {
  const joined = props.tokens.map((t) => t.ori).join("");
  if (props.tokens.length && joined === props.word) return props.tokens;
  return [{ ori: props.word, cvt: "" }];
});
</script>

<style scoped>
.ruby-word {
  line-height: 2.2;
}
.ruby-word ruby {
  ruby-align: center;
}
.ruby-word rt {
  font-size: 0.5em;
  color: #6366f1;
}
</style>
