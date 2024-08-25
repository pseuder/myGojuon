<template>
  <GoogleLogin :callback="callback" />
</template>

<script setup>
import { ref } from "vue";
import { GoogleLogin, decodeCredential } from "vue3-google-login";
import axios, { storeToken } from "@/utils/axios";

const user = ref(null);

const callback = (response) => {
  user.value = response;
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
    })
    .catch((error) => {
      console.error("Error logging in:", error);
    });
};
</script>
