<template>
  <GoogleLogin :callback="callback" />
</template>

<script setup>
import { ref } from "vue";
import { GoogleLogin, decodeCredential } from "vue3-google-login";

const user = ref(null);

const callback = (response) => {
  user.value = response;
  const userData = decodeCredential(response.credential);
  // sub is the unique identifier for the user
  let { email, name, picture, sub } = userData;
  console.log(email, name, picture, sub);
};
</script>
