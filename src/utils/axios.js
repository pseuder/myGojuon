import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const instance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 儲存 token
export function storeToken(token) {
    localStorage.setItem('jwtToken', token);
}

// 從儲存中獲取 token
export function getToken() {
    return localStorage.getItem('jwtToken');
}

// 檢查 token 是否過期
export function isTokenExpired(token) {
    if (!token) {
        return true;
    }

    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;

    return Date.now() >= exp * 1000;
}

// 登出功能
export function logout() {
    localStorage.removeItem('jwtToken');
    // 重定向到登錄頁面或執行其他登出後的操作
    // 例如：window.location.href = '/login';
}

// 請求攔截器
instance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 響應攔截器
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Token 無效或過期
                    logout();
                    // 重定向到登錄頁面
                    // window.location.href = '/login';
                    break;
                case 404:
                    // 處理 404 錯誤
                    console.error('Resource not found');
                    break;
                // 可以添加其他狀態碼的處理
            }
        }
        return Promise.reject(error);
    }
);

export default instance;