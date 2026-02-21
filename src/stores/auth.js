// stores/auth.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { decodeCredential } from "vue3-google-login";

/*-- API --*/
import { useApi } from "@/composables/useApi.js";

export const useAuthStore = defineStore(
  "auth",
  () => {
    // --- State ---
    const user = ref(null);
    const token = ref(null);

    // --- Getters ---
    const isLoggedIn = computed(() => !!token.value && !!user.value);
    const isActive = computed(() => user.value?.is_active ?? false);
    const isAdmin = computed(() => user.value?.is_admin ?? false);

    const userName = computed(() => user.value?.name ?? "unknown");
    const userPoint = computed(() => user.value?.point ?? 0);

    // --- Actions ---
    async function login(credential) {
      const myAPI = useApi();
      const userData = decodeCredential(credential);
      const { name, email, picture, sub } = userData;
      const res = await myAPI.post("/login", { email, name, picture, sub });
      const resData = res.data;

      token.value = resData.token;
      user.value = resData.userinfo;
    }

    async function fetchCurrentUser() {
      if (!token.value) return;
      try {
        const myAPI = useApi();
        const res = await myAPI.post("/auth/me", { token: token.value });
        user.value = res.data.userinfo;
      } catch {}
    }

    function logout() {
      user.value = null;
      token.value = null;
    }

    return {
      user,
      token,
      isLoggedIn,
      isActive,
      isAdmin,
      userName,
      userPoint,
      login,
      fetchCurrentUser,
      logout,
    };
  },
  {
    persist: true, // 全部 state 自動存到 localStorage
  },
);
