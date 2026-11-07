// 單字學習頁的 localStorage 存取：
// 1. 練習偏好（顯示假名、自動發音、輪播設定）
// 2. 進行中的練習進度（讓 /VocabStudy/session 重新整理後能接著練）

export const SHOW_KANA_KEY = "vocab_show_kana";
export const AUTO_PLAY_KEY = "vocab_auto_play";
export const COMMUTE_KEY = "vocab_commute_mode";
export const FRONT_TIMES_KEY = "vocab_commute_front";
export const BACK_TIMES_KEY = "vocab_commute_back";
const SESSION_KEY = "vocab_study_session";

export const readFlag = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v !== "0";
  } catch {
    return fallback;
  }
};
export const saveFlag = (key, v) => {
  try {
    localStorage.setItem(key, v ? "1" : "0");
  } catch {
    /* 無法使用 localStorage 時只在本次有效 */
  }
};

export const readNumber = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    const v = Number(raw);
    return raw === null || Number.isNaN(v) ? fallback : v;
  } catch {
    return fallback;
  }
};
export const saveNumber = (key, v) => {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    /* 無法使用 localStorage 時只在本次有效 */
  }
};

// 用來辨識進度屬於哪個帳號，換帳號登入時不沿用別人的進度
export const studyOwner = (user) =>
  user?.user_id ?? user?.id ?? user?.email ?? null;

/**
 * 讀取進行中的練習；沒有、壞掉或不是同一個帳號的就回傳 null
 * @returns {{ owner, started, phase, cards, index, results, committed, round } | null}
 */
export const loadStudySession = (owner) => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!Array.isArray(s?.cards) || !s.cards.length) return null;
    if ((s.owner ?? null) !== (owner ?? null)) return null;
    return s;
  } catch {
    return null;
  }
};

export const saveStudySession = (session) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* 存不下（容量不足等）時只影響重新整理後的還原 */
  }
};

export const clearStudySession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};
