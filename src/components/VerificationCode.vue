<template>
  <div class="container">
    <h2>验证码校验</h2>
    <input v-model="verifyCodeRef" placeholder="请输入验证码" />
    <button @click="verify">验证</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { verifyCode } from '../composables/useApi.js';

const verifyCodeRef = ref('');
const router = useRouter();

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const verifyCodeFromUrl = urlParams.get('verifyCode');
  if (verifyCodeFromUrl) {
    verifyCodeRef.value = verifyCodeFromUrl;
  }
});

const verify = async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await verifyCode(openId, verifyCodeRef.value);
  if (result.code === 0) {
    localStorage.setItem('token', result.data.token);
    router.push(`/user-data?openId=${encodeURIComponent(openId)}`);
  } else {
    alert(result.msg);
  }
};
</script>

<style scoped>
</style>
