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
  const urlParams = new URLSearchParams(window.location.search);
  const openId = urlParams.get('openId');
  const target = urlParams.get('target'); // 验证后去向：farm=农场，默认 user-data
  const result = await verifyCode(openId, verifyCodeRef.value);
  if (result.code === 0) {
    localStorage.setItem('token', result.data.token);
    // 请求获取用户信息
    const userInfoResult = await getUserInfo(openId);
    let userName = ''; // 定义 userName 变量
    if (userInfoResult.code === 0) {
      userName = userInfoResult.data.userName || ''; // 获取 userName
    } 
    // 根据 target 决定验证后跳转的页面
    const path = target === 'farm' ? '/farm' : '/user-data';
    router.push({
      path,
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
.container {
  box-sizing: border-box;
}

h2 {
  margin-bottom: 24px;
}

/* 输入框字号 >=16px，避免 iOS 聚焦时自动放大 */
input {
  font-size: 16px;
  box-sizing: border-box;
}

button {
  margin-top: 8px;
}

/* 手机端：按钮全宽、加大点击区域 */
@media (max-width: 600px) {
  button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    margin: 8px 0 0;
  }
}
</style>