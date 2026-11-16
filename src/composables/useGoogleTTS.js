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
// 頁面在前景時，等 AudioContext 恢復成 running 的上限；超過就改用瀏覽器內建語音
const RESUME_TIMEOUT_MS = 1500;
// 音訊該播完卻沒收到 onended 的寬限時間，超過就當作 context 已經壞掉
const STALL_MARGIN_MS = 2000;
// 瀏覽器內建語音的保險時間：Chrome 偶爾不觸發 onend（切過背景後尤其常見）
const BROWSER_TTS_BASE_MS = 3000;
const BROWSER_TTS_PER_CHAR_MS = 250;

// 全站共用一個 AudioContext：持續運作時會一直輸出靜音，讓藍牙/省電音效裝置保持喚醒
let audioCtx = null;
// 上一次播放途中是否被中斷（切背景、鎖屏、來電）。中斷後再點同一個喇叭要視為重播，而不是「再點一次=停止」
let interrupted = false;

const resumeAudio = () => {
  if (!audioCtx || audioCtx.state === "running") return;
  // 在手勢外呼叫可能被拒，之後回前景 / 觸碰時會再試
  audioCtx.resume().catch(() => {});
};

// 手機瀏覽器切到背景再回來時 AudioContext 不一定自動恢復：
// iOS Safari 會變成非標準的 "interrupted"，Android 被系統中斷時則是 "suspended"。
// 狀態一變就嘗試恢復，另外在回到前景與任何觸碰（手勢內的 resume 最可靠）時再補一次。
//
// iOS（Safari 與 Chrome 都是 WebKit）在背景待久一點後，舊的 context 常常救不回來：
// 不是 resume() 一直沒反應，就是 state 顯示 running 卻完全沒聲音、currentTime 也不前進。
// 所以只要切過背景或被中斷過就標記 stale，下一次使用者觸碰時直接丟掉重建一個新的。
let stale = false;
let watching = false;
// context 被換掉時要通知還在等舊 context 的播放流程
const ctxReplaced = new Set();

const createContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  // iOS 預設的 Web Audio 會被靜音鍵消音，改成媒體播放類別
  if (navigator.audioSession) navigator.audioSession.type = "playback";
  const ctx = new Ctx();
  ctx.addEventListener("statechange", () => {
    if (ctx !== audioCtx || ctx.state === "running") return;
    interrupted = true;
    stale = true;
    if (document.visibilityState === "visible") resumeAudio();
  });
  return ctx;
};

const renewAudioContext = () => {
  stale = false;
  const old = audioCtx;
  if (!old) return;
  audioCtx = createContext();
  // 已解碼的 AudioBuffer 不綁定 context，快取可以沿用
  old.close().catch(() => {});
  for (const fn of [...ctxReplaced]) fn();
};

const onGesture = () => {
  if (stale) renewAudioContext();
  resumeAudio();
};

const watchPage = () => {
  if (watching) return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !audioCtx) return;
    stale = true;
    interrupted = true;
    resumeAudio();
  });
  for (const type of ["pointerdown", "touchend", "keydown"]) {
    document.addEventListener(type, onGesture, {
      capture: true,
      passive: true,
    });
  }
};

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = createContext();
    if (!audioCtx) return null;
    watchPage();
  }
  // 需在使用者點擊的同步流程中呼叫，瀏覽器才允許恢復播放
  resumeAudio();
  return audioCtx;
};

// 等 context 真的進入 running 再開始播，否則 source.start 會排進去但永遠不會結束，
// speak 的 Promise 就卡死。頁面在背景時不計時（JS 可能被凍結、也無法出聲），回前景再給一次機會；
// 在前景卻遲遲恢復不了則回傳 false，交給呼叫端改用內建語音。
const waitRunning = (ctx, isAlive) =>
  new Promise((resolve) => {
    let timer = null;
    const done = () => {
      ctx.removeEventListener("statechange", check);
      document.removeEventListener("visibilitychange", check);
      ctxReplaced.delete(done);
      clearTimeout(timer);
      resolve(ctx === audioCtx && ctx.state === "running");
    };
    const check = () => {
      if (ctx !== audioCtx || ctx.state === "running" || !isAlive())
        return done();
      resumeAudio();
      clearTimeout(timer);
      if (document.visibilityState !== "hidden")
        timer = setTimeout(done, RESUME_TIMEOUT_MS);
    };
    ctx.addEventListener("statechange", check);
    document.addEventListener("visibilitychange", check);
    ctxReplaced.add(done);
    check();
  });

// 已解碼的音訊快取，重複點同一個字不必重新下載
const bufferCache = new Map();
const loadBuffer = async (ctx, text, lang) => {
  // 同一段文字在不同語言念法不同（例如漢字），快取要分開
  const cacheKey = `${lang}|${text}`;
  if (bufferCache.has(cacheKey)) return bufferCache.get(cacheKey);
  const res = await fetch(`${TTS_URL}?${new URLSearchParams({ q: text, lang })}`);
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
  if (bufferCache.size >= BUFFER_CACHE_SIZE) {
    bufferCache.delete(bufferCache.keys().next().value);
  }
  bufferCache.set(cacheKey, buffer);
  return buffer;
};

// 發音被手動覆寫/刪除後清掉已解碼的快取，下次點喇叭才會重新下載
export const clearTTSCache = () => bufferCache.clear();

// 瀏覽器內建語音用的語言代碼
const BROWSER_LANGS = { ja: "ja-JP", "zh-TW": "zh-TW" };

// 後端支援 ja、zh-TW；lang 是預設語言，speak 可以個別指定
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
  const speakWithBrowser = (text, voiceLang) =>
    new Promise((resolve) => {
      const synth = window.speechSynthesis;
      if (!synth) return resolve();
      let timer = null;
      const finish = () => {
        clearTimeout(timer);
        resolve();
      };
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = BROWSER_LANGS[voiceLang] || voiceLang;
      utter.onend = finish;
      utter.onerror = finish;
      timer = setTimeout(
        finish,
        BROWSER_TTS_BASE_MS + text.length * BROWSER_TTS_PER_CHAR_MS,
      );
      // 切過背景後 Chrome 可能停在 paused，不 resume 就不會出聲也不會結束
      synth.resume();
      synth.speak(utter);
    });

  // 回傳 false 表示播放期間被 stop() 中斷
  const playChunk = async (ctx, text, mySession, voiceLang) => {
    const buffer = await loadBuffer(ctx, text, voiceLang);
    if (mySession !== session) return false;
    const running = await waitRunning(ctx, () => mySession === session);
    if (mySession !== session) return false;
    if (!running) throw new Error("AudioContext not running");
    return new Promise((resolve, reject) => {
      const node = ctx.createBufferSource();
      source = node;
      let timer = null;
      const cleanup = () => {
        clearTimeout(timer);
        ctxReplaced.delete(onReplaced);
        document.removeEventListener("visibilitychange", arm);
      };
      const onReplaced = () => {
        cleanup();
        reject(new Error("AudioContext replaced"));
      };
      // 保險：context 顯示 running 卻沒在跑時 onended 永遠不會來，
      // 逾時就放棄這個 context（下次觸碰重建），不要讓 speak 卡死
      const arm = () => {
        clearTimeout(timer);
        if (document.visibilityState === "hidden") return;
        timer = setTimeout(
          () => {
            cleanup();
            stale = true;
            interrupted = true;
            try {
              node.stop();
            } catch {
              // 尚未開始播放
            }
            reject(new Error("AudioContext stalled"));
          },
          (LEAD_SILENCE + buffer.duration) * 1000 + STALL_MARGIN_MS,
        );
      };
      node.buffer = buffer;
      node.connect(ctx.destination);
      node.onended = () => {
        cleanup();
        resolve(true);
      };
      ctxReplaced.add(onReplaced);
      document.addEventListener("visibilitychange", arm);
      node.start(ctx.currentTime + LEAD_SILENCE);
      arm();
    });
  };

  const speak = async (text, key = text, voiceLang = lang) => {
    // 再點一次同一個喇叭 = 停止；但如果上次播放被中斷過，就當成重播
    const wasSame = speakingKey.value === key && !interrupted;
    interrupted = false;
    stop();
    if (wasSame || !text?.trim()) return;

    getAudioContext();
    const mySession = session;
    speakingKey.value = key;
    for (const chunk of splitText(text)) {
      for (let attempt = 0; ; attempt++) {
        if (mySession !== session) return;
        const ctx = audioCtx;
        try {
          if (!ctx) throw new Error("Web Audio not supported");
          if (!(await playChunk(ctx, chunk, mySession, voiceLang))) return;
          break;
        } catch {
          if (mySession !== session) return;
          // 播到一半 context 被重建：用新的 context 重播這一段
          if (ctx && ctx !== audioCtx && attempt < 2) continue;
          await speakWithBrowser(chunk, voiceLang);
          break;
        }
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
