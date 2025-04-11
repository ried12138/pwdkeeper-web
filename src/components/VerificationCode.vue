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
import { verifyCode, getUserInfo } from '../composables/useApi.js'; // 导入 getUserInfo 函数

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
    // 请求获取用户信息
    const userInfoResult = await getUserInfo(openId);
    let userName = ''; // 定义 userName 变量
    if (userInfoResult.code === 0) {
      userName = userInfoResult.data.userName || ''; // 获取 userName
    } 
    // 修改: 直接使用 route 对象的 query 参数，避免重复拼接
    router.push({
      path: '/user-data',
      query: {
        openId: encodeURIComponent(openId),
        userName: encodeURIComponent(userName),
      },
    });
  } else {
    alert(result.msg);
  }
};
</script>

<style scoped>
</style>