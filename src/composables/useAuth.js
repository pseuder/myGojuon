// composables/useAuth.js
import { ref } from "vue";

// Global reactive state (singleton pattern)
const user = ref(null);
const isLogin = ref(false);

export const useAuth = () => {
  const initializeAuth = () => {
    const token = localStorage.getItem("myGojuon_token");
    const storedUser = localStorage.getItem("myGojuon_userInfo");
    if (token && storedUser) {
      isLogin.value = true;
      user.value = JSON.parse(storedUser);
    }
  };

  const getUserInfo = () => {
    return JSON.parse(localStorage.getItem("myGojuon_userInfo"));
  };

  const setLoginInfo = (token, userInfo) => {
    localStorage.setItem("myGojuon_token", token);
    localStorage.setItem("myGojuon_userInfo", JSON.stringify(userInfo));
    isLogin.value = true;
    user.value = userInfo;
  };

  const logout = () => {
    localStorage.removeItem("myGojuon_token");
    localStorage.removeItem("myGojuon_userInfo");
    isLogin.value = false;
    user.value = null;
  };

  return {
    user,
    isLogin,
    initializeAuth,
    getUserInfo,
    setLoginInfo,
    logout,
  };
};
