import { ref, onUnmounted } from "vue";

/**
 * 平假名 → 音檔檔名（對應 public/sounds/*.mp3）
 */
const SOUND_MAP = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  // 濁音
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  // 半濁音
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
};

/**
 * 拗音（き+ゃ → kya 等）對照表
 */
const YOON_MAP = {
  き: { ゃ: "kya", ゅ: "kyu", ょ: "kyo" },
  し: { ゃ: "sha", ゅ: "shu", ょ: "sho" },
  ち: { ゃ: "cha", ゅ: "chu", ょ: "cho" },
  に: { ゃ: "nya", ゅ: "nyu", ょ: "nyo" },
  ひ: { ゃ: "hya", ゅ: "hyu", ょ: "hyo" },
  み: { ゃ: "mya", ゅ: "myu", ょ: "myo" },
  り: { ゃ: "rya", ゅ: "ryu", ょ: "ryo" },
  ぎ: { ゃ: "gya", ゅ: "gyu", ょ: "gyo" },
  じ: { ゃ: "ja", ゅ: "ju", ょ: "jo" },
  び: { ゃ: "bya", ゅ: "byu", ょ: "byo" },
  ぴ: { ゃ: "pya", ゅ: "pyu", ょ: "pyo" },
};

// 片假名 → 平假名（U+30A1-U+30F6 對應 U+3041-U+3096）
const normalizeToHiragana = (text) =>
  text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );

/**
 * 將平假名/片假名文字拆解為對應的音檔名稱陣列
 * 無法對應的字元（促音っ、長音ー、漢字、標點等）會被忽略
 * @param {string} text
 * @returns {string[]} 例如 ["wa", "ta", "shi"]
 */
export const kanaToSoundFiles = (text) => {
  if (!text) return [];
  const hira = normalizeToHiragana(text);
  const files = [];
  let i = 0;
  while (i < hira.length) {
    const ch = hira[i];
    const next = hira[i + 1];
    if (next && YOON_MAP[ch]?.[next]) {
      files.push(YOON_MAP[ch][next]);
      i += 2;
      continue;
    }
    if (SOUND_MAP[ch]) {
      files.push(SOUND_MAP[ch]);
    }
    i += 1;
  }
  return files;
};

/**
 * 將文字拆解為「可點擊發音單元」陣列
 * 每個單元為 { text, file }：
 *  - text：顯示用的原始字元（1 個字，拗音為 2 個字）
 *  - file：對應音檔名稱；若該字無對應發音則為 null
 * @param {string} text
 * @returns {{ text: string, file: string | null }[]}
 */
export const splitKanaUnits = (text) => {
  if (!text) return [];
  const hira = normalizeToHiragana(text);
  const units = [];
  let i = 0;
  while (i < text.length) {
    const ch = hira[i];
    const next = hira[i + 1];
    if (next && YOON_MAP[ch]?.[next]) {
      units.push({ text: text.slice(i, i + 2), file: YOON_MAP[ch][next] });
      i += 2;
      continue;
    }
    units.push({ text: text[i], file: SOUND_MAP[ch] ?? null });
    i += 1;
  }
  return units;
};

/**
 * 假名發音播放 composable
 * 使用 Web Audio API 依序無縫播放多個音檔
 */
export const useKanaAudio = () => {
  const audioContext = ref(null);
  const audioBuffers = new Map();
  const isPlaying = ref(false);
  let activeSources = [];

  const initAudioContext = () => {
    if (!audioContext.value) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContext.value = new AudioContextClass();
    }
    if (audioContext.value.state === "suspended") {
      audioContext.value.resume().catch(() => {});
    }
    return audioContext.value;
  };

  const loadBuffer = async (file) => {
    const url = `/sounds/${file}.mp3`;
    if (audioBuffers.has(url)) return audioBuffers.get(url);

    const ctx = initAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers.set(url, buffer);
    return buffer;
  };

  const stopAll = () => {
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // 已停止的音源忽略錯誤
      }
    });
    activeSources = [];
    isPlaying.value = false;
  };

  /**
   * 判斷該段文字是否含有可播放的假名發音
   */
  const canPlayKana = (text) => kanaToSoundFiles(text).length > 0;

  /**
   * 依序無縫播放文字對應的假名發音
   */
  const playKana = async (text) => {
    const files = kanaToSoundFiles(text);
    if (files.length === 0) return;

    const ctx = initAudioContext();
    if (!ctx) return;

    stopAll();

    const buffers = await Promise.all(files.map(loadBuffer));

    isPlaying.value = true;
    let startTime = ctx.currentTime;

    buffers.forEach((buffer, index) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(startTime);
      activeSources.push(source);

      if (index === buffers.length - 1) {
        source.onended = () => {
          isPlaying.value = false;
        };
      }

      startTime += buffer.duration;
    });
  };

  onUnmounted(() => {
    stopAll();
    if (audioContext.value) {
      audioContext.value.close().catch(() => {});
      audioContext.value = null;
    }
  });

  return {
    isPlaying,
    canPlayKana,
    playKana,
  };
};
