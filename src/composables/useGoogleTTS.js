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

// 播放前的前導靜音（秒），避免輸出裝置剛喚醒時吃掉第一個音
const LEAD_SILENCE = 0.05;
const BUFFER_CACHE_SIZE = 100;

// 全站共用一個 AudioContext：持續運作時會一直輸出靜音，讓藍牙/省電音效裝置保持喚醒
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    // iOS 預設的 Web Audio 會被靜音鍵消音，改成媒體播放類別
    if (navigator.audioSession) navigator.audioSession.type = "playback";
    audioCtx = new Ctx();
  }
  // 需在使用者點擊的同步流程中呼叫，瀏覽器才允許恢復播放
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

// 已解碼的音訊快取，重複點同一個字不必重新下載
const bufferCache = new Map();
const loadBuffer = async (ctx, text) => {
  if (bufferCache.has(text)) return bufferCache.get(text);
  const res = await fetch(`${TTS_URL}?${new URLSearchParams({ q: text })}`);
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
  if (bufferCache.size >= BUFFER_CACHE_SIZE) {
    bufferCache.delete(bufferCache.keys().next().value);
  }
  bufferCache.set(text, buffer);
  return buffer;
};

// 目前後端只支援日文
export const useGoogleTTS = (lang = "ja") => {
  // 目前正在播放的 key（用來讓對應的喇叭按鈕顯示播放中）
  const speakingKey = ref(null);
  let source = null;
  let session = 0;

  const stop = () => {
    session += 1;
    if (source) {
      // 停止會觸發 onended，speak 的迴圈再依 session 判斷結束
      try {
        source.stop();
      } catch {
        // 尚未開始播放
      }
      source = null;
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

  // 回傳 false 表示播放期間被 stop() 中斷
  const playChunk = async (ctx, text, mySession) => {
    const buffer = await loadBuffer(ctx, text);
    if (mySession !== session) return false;
    return new Promise((resolve) => {
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => resolve(true);
      source.start(ctx.currentTime + LEAD_SILENCE);
    });
  };

  const speak = async (text, key = text) => {
    const wasSame = speakingKey.value === key;
    stop();
    // 再點一次同一個喇叭 = 停止
    if (wasSame || !text?.trim()) return;

    const ctx = getAudioContext();
    const mySession = session;
    speakingKey.value = key;
    for (const chunk of splitText(text)) {
      if (mySession !== session) return;
      try {
        if (!ctx) throw new Error("Web Audio not supported");
        if (!(await playChunk(ctx, chunk, mySession))) return;
      } catch {
        if (mySession !== session) return;
        await speakWithBrowser(chunk);
      }
    }
    if (mySession === session) speakingKey.value = null;
  };

  onUnmounted(stop);

  // 在使用者操作中先啟用音訊，之後非同步流程（例如自動播放）才能出聲
  const unlock = () => {
    getAudioContext();
  };

  return { speak, stop, unlock, speakingKey };
};
