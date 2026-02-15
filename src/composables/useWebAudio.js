import { ref, onUnmounted } from 'vue';

/**
 * Web Audio API composable for optimized audio playback
 * 使用 Web Audio API 優化音頻播放性能，避免低配置設備上的卡頓問題
 */
export const useWebAudio = () => {
  // AudioContext 實例
  const audioContext = ref(null);

  // 音頻緩衝區緩存 Map<url, AudioBuffer>
  const audioBuffers = ref(new Map());

  // 當前播放的音源
  const currentSource = ref(null);

  // 播放狀態
  const isPlaying = ref(false);

  // 加載狀態
  const isLoading = ref(false);

  // 錯誤狀態
  const error = ref(null);

  /**
   * 初始化 AudioContext
   * 處理瀏覽器自動播放策略
   */
  const initAudioContext = () => {
    if (!audioContext.value) {
      // 支持不同瀏覽器的 AudioContext
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        error.value = 'Web Audio API is not supported in this browser';
        console.error(error.value);
        return false;
      }
      audioContext.value = new AudioContextClass();
    }

    // 處理 AudioContext suspended 狀態（瀏覽器自動播放策略）
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume().catch(err => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }

    return true;
  };

  /**
   * 加載音頻文件
   * @param {string} url - 音頻文件的 URL
   * @returns {Promise<AudioBuffer>} 解碼後的音頻緩衝區
   */
  const loadAudio = async (url) => {
    // 如果已經緩存，直接返回
    if (audioBuffers.value.has(url)) {
      return audioBuffers.value.get(url);
    }

    if (!initAudioContext()) {
      throw new Error('Failed to initialize AudioContext');
    }

    try {
      isLoading.value = true;
      error.value = null;

      // 使用 fetch 獲取音頻文件
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      // 轉換為 ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // 解碼音頻數據（異步操作，不會阻塞主線程）
      const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer);

      // 緩存解碼後的音頻
      audioBuffers.value.set(url, audioBuffer);

      return audioBuffer;
    } catch (err) {
      error.value = `Failed to load audio from ${url}: ${err.message}`;
      console.error(error.value, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 播放音頻
   * @param {string} url - 音頻文件的 URL
   * @returns {Promise<void>}
   */
  const play = async (url) => {
    if (!initAudioContext()) {
      return;
    }

    // 停止當前正在播放的音頻
    if (currentSource.value) {
      try {
        currentSource.value.stop();
      } catch (err) {
        // 忽略已經停止的錯誤
      }
      currentSource.value = null;
    }

    try {
      error.value = null;

      // 加載音頻（如果已緩存則立即返回）
      const audioBuffer = await loadAudio(url);

      // 創建音頻源節點
      const source = audioContext.value.createBufferSource();
      source.buffer = audioBuffer;

      // 連接到輸出設備
      source.connect(audioContext.value.destination);

      // 設置播放結束回調
      source.onended = () => {
        isPlaying.value = false;
        currentSource.value = null;
      };

      // 保存當前音源引用
      currentSource.value = source;
      isPlaying.value = true;

      // 開始播放（從 0 秒開始）
      source.start(0);

    } catch (err) {
      error.value = `Failed to play audio: ${err.message}`;
      console.error(error.value, err);
      isPlaying.value = false;
    }
  };

  /**
   * 停止播放
   */
  const stop = () => {
    if (currentSource.value) {
      try {
        currentSource.value.stop();
      } catch (err) {
        // 忽略已經停止的錯誤
      }
      currentSource.value = null;
      isPlaying.value = false;
    }
  };

  /**
   * 預加載多個音頻文件
   * 適合在頁面初始化時預加載常用音頻
   * @param {string[]} urls - 音頻文件 URL 列表
   * @returns {Promise<void>}
   */
  const preloadAudios = async (urls) => {
    if (!initAudioContext()) {
      return;
    }

    // 並行加載所有音頻，失敗的不影響其他
    const promises = urls.map(url =>
      loadAudio(url).catch(err => {
        console.warn(`Failed to preload ${url}:`, err);
        return null;
      })
    );

    await Promise.all(promises);
  };

  /**
   * 清理資源
   * 在組件卸載時調用
   */
  const cleanup = () => {
    stop();
    audioBuffers.value.clear();

    if (audioContext.value) {
      audioContext.value.close().catch(err => {
        console.warn('Failed to close AudioContext:', err);
      });
      audioContext.value = null;
    }
  };

  // 組件卸載時自動清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    // 狀態
    isPlaying,
    isLoading,
    error,

    // 方法
    play,
    stop,
    preloadAudios,
    cleanup,
  };
};
