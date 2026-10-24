import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";

// 失敗重試設定
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 500; // ms，每次加倍：500 → 1000 → 2000
// 預設只重試冪等方法；POST 可能造成重複寫入，需呼叫時以 retry 選項明確開啟
const IDEMPOTENT_METHODS = ["get", "head", "options", "put", "delete"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 只重試暫時性錯誤：網路中斷、逾時、429、5xx；其他 4xx 重試也不會成功
const isRetryableError = (error) => {
  if (axios.isCancel(error)) return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status === 429 || status >= 500;
};

const getMaxRetries = (config) => {
  if (config.retry !== undefined) return config.retry;
  const method = (config.method || "get").toLowerCase();
  return IDEMPOTENT_METHODS.includes(method) ? MAX_RETRIES : 0;
};

export const useApi = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: import.meta.env.VITE_API_TIMEOUT,
  });

  // Request interceptor：自動在 Header 加入 JWT
  instance.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor：失敗重試 + 統一處理 401
  instance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const config = error.config;
      if (config && isRetryableError(error)) {
        config.__retryCount = config.__retryCount || 0;
        if (config.__retryCount < getMaxRetries(config)) {
          config.__retryCount += 1;
          await sleep(RETRY_BASE_DELAY * 2 ** (config.__retryCount - 1));
          return instance.request(config);
        }
      }

      if (error.code === "ECONNABORTED") {
        console.error("請求逾時，請稍後再試");
      } else if (error.response?.status === 401) {
        console.error("未授權的請求，請重新登入");
      }
      return Promise.reject(error);
    },
  );

  const request = (path, options = {}) => {
    const { method = "GET", params, body, headers, timeout, retry } = options;

    const config = {
      url: path,
      method,
      params,
      headers,
    };
    if (timeout !== undefined) {
      config.timeout = timeout;
    }
    // retry：覆寫此請求的最大重試次數（例如 POST 傳 3 開啟、GET 傳 0 關閉）
    if (retry !== undefined) {
      config.retry = retry;
    }

    // Axios 會自動偵測 FormData 並設定正確的 Content-Type
    // 若是一般物件則直接傳入 data，Axios 會自動序列化為 JSON
    if (body !== undefined) {
      config.data = body;
    }

    return instance.request(config);
  };

  const get = (path, params = {}, headers = {}) =>
    request(path, { method: "GET", params, headers });

  const post = (path, body = {}, headers = {}, timeout) =>
    request(path, { method: "POST", body, headers, timeout });

  const put = (path, body = {}, headers = {}) =>
    request(path, { method: "PUT", body, headers });

  const patch = (path, body = {}, headers = {}) =>
    request(path, { method: "PATCH", body, headers });

  const del = (path, params = {}, headers = {}) =>
    request(path, { method: "DELETE", params, headers });

  return { get, post, put, patch, del, request };
};
