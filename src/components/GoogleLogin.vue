<template>
  <div>
    <template v-if="isLogin">
      <p class="text-2xl">
        Welcome <el-button @click="handleLogout">登出</el-button>
      </p>
      <p>{{ user.name }}{{ user.email }}</p>
      <img :src="user.picture" alt="user avatar" />
    </template>
    <template v-else>
      <GoogleLogin :callback="callback" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { GoogleLogin, decodeCredential } from "vue3-google-login";
import axios, {
  isTokenExpired,
  storeToken,
  storeUserInfo,
  getUserInfo,
  logout,
} from "@/utils/axios";

const user = ref(null);
const isLogin = ref(false);

const callback = (response) => {
  user.value = response;
  console.log("response", response);
  const userData = decodeCredential(response.credential);
  // sub is the unique identifier for the user
  let { name, email, picture, sub } = userData;

  axios
    .post("/login", {
      email,
      name,
      picture,
      sub,
    })
    .then((response) => {
      storeToken(response.token);
      storeUserInfo({
        email,
        name,
        picture,
        sub,
      });
      isLogin.value = true;
      user.value = getUserInfo();

      // refresh
      location.reload();
    })
    .catch((error) => {
      console.error("Error logging in:", error);
    });
};

const handleLogout = () => {
  logout();
  isLogin.value = false;
};

onMounted(() => {
  isLogin.value = !isTokenExpired();
  console.log("isLogin", isLogin.value);
  if (isLogin.value) {
    user.value = getUserInfo();
  }
});
</script>
