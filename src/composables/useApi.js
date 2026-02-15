export const useApi = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE;

  // 在Header中加入JWT
  const getHeaders = (extraHeaders = {}) => {
    const headers = { ...extraHeaders };
    const token = localStorage.getItem("myGojuon_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const request = async (path, options = {}) => {
    const url = new URL(path, API_BASE_URL);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const fetchOptions = {
      method: options.method || "GET",
      headers: getHeaders(options.headers || {}),
    };

    if (options.body) {
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
      } else {
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (response.status === 401) {
      console.error("未授權的請求，請重新登入");
    }

    return await response.json();
  };

  const get = (path, params = {}, headers = {}) => {
    return request(path, { method: "GET", params, headers });
  };

  const post = (path, body = {}, headers = {}) => {
    return request(path, { method: "POST", body, headers });
  };

  const put = (path, body = {}, headers = {}) => {
    return request(path, { method: "PUT", body, headers });
  };

  const patch = (path, body = {}, headers = {}) => {
    return request(path, { method: "PATCH", body, headers });
  };

  const del = (path, params = {}, headers = {}) => {
    return request(path, { method: "DELETE", params, headers });
  };

  return { get, post, put, patch, del };
};
