import { ref, onUnmounted } from "vue";

// 後端代理 Google 翻譯 TTS（瀏覽器直連會因 Referer 被 Google 拒絕），單次上限 200 字
const TTS_URL = `${import.meta.env.VITE_API_BASE}tts`;
const MAX_CHUNK = 180;

// 依標點/空白切成不超過 MAX_CHUNK 的片段
const splitText = (text) => {
  const parts = text.match(/[^。！？!?、,，\s]+[。！？!?、,，\s]*/g) || [];
  const chunks = [];
  let current = "";
  for (const part of parts) {
    if ((current + part).length > MAX_CHUNK && current) {
      chunks.push(current);
      current = "";
    }
    // 單一片段仍過長時硬切
    for (let i = 0; i < part.length; i += MAX_CHUNK) {
      const piece = part.slice(i, i + MAX_CHUNK);
      if ((current + piece).length > MAX_CHUNK) {
        chunks.push(current);
        current = "";
      }
      current += piece;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks.map((c) => c.trim()).filter(Boolean);
};

// 目前後端只支援日文
export const useGoogleTTS = (lang = "ja") => {
  // 目前正在播放的 key（用來讓對應的喇叭按鈕顯示播放中）
  const speakingKey = ref(null);
  let audio = null;
  let session = 0;

  const stop = () => {
    session += 1;
    if (audio) {
      audio.pause();
      audio = null;
    }
    window.speechSynthesis?.cancel();
    speakingKey.value = null;
  };

  // Google 播放失敗（被擋、離線）時改用瀏覽器內建語音
  const speakWithBrowser = (text) =>
    new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "ja" ? "ja-JP" : lang;
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });

  const playChunk = (text) =>
    new Promise((resolve, reject) => {
      audio = new Audio(`${TTS_URL}?${new URLSearchParams({ q: text })}`);
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });

  const speak = async (text, key = text) => {
    const wasSame = speakingKey.value === key;
    stop();
    // 再點一次同一個喇叭 = 停止
    if (wasSame || !text?.trim()) return;

    const mySession = session;
    speakingKey.value = key;
    for (const chunk of splitText(text)) {
      if (mySession !== session) return;
      try {
        await playChunk(chunk);
      } catch {
        if (mySession !== session) return;
        await speakWithBrowser(chunk);
      }
    }
    if (mySession === session) speakingKey.value = null;
  };

  onUnmounted(stop);

  return { speak, stop, speakingKey };
};
