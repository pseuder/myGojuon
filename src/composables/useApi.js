import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";

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

  // Response interceptor：統一處理 401
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.code === "ECONNABORTED") {
        console.error("請求逾時，請稍後再試");
      } else if (error.response?.status === 401) {
        console.error("未授權的請求，請重新登入");
      }
      return Promise.reject(error);
    },
  );

  const request = (path, options = {}) => {
    const { method = "GET", params, body, headers } = options;

    const config = {
      url: path,
      method,
      params,
      headers,
    };

    // Axios 會自動偵測 FormData 並設定正確的 Content-Type
    // 若是一般物件則直接傳入 data，Axios 會自動序列化為 JSON
    if (body !== undefined) {
      config.data = body;
    }

    return instance.request(config);
  };

  const get = (path, params = {}, headers = {}) =>
    request(path, { method: "GET", params, headers });

  const post = (path, body = {}, headers = {}) =>
    request(path, { method: "POST", body, headers });

  const put = (path, body = {}, headers = {}) =>
    request(path, { method: "PUT", body, headers });

  const patch = (path, body = {}, headers = {}) =>
    request(path, { method: "PATCH", body, headers });

  const del = (path, params = {}, headers = {}) =>
    request(path, { method: "DELETE", params, headers });

  return { get, post, put, patch, del };
};
