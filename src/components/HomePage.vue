<template>
  <div class="home-container">
    <div class="home-card">
      <h1 class="home-title gradient-text">欢迎使用</h1>
      <p class="home-subtitle">请选择要进入的功能</p>

      <div class="home-buttons">
        <button class="home-btn" @click="goMonster">怪兽记账号</button>
        <button class="home-btn" @click="goFarm">牧场物语</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

// 怪兽记账号：进入现有验证码流程，并原样保留 # 前的完整 query（openId、verifyCode 等）
const goMonster = () => {
  // 优先沿用 # 前的 search，避免丢失 verifyCode 等参数
  let search = window.location.search;
  // 回退：若参数在 hash 的路由 query 中，则据此重建 search
  if (!search) {
    const params = new URLSearchParams();
    Object.entries(route.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    search = qs ? `?${qs}` : '';
  }
  // 验证码页从 window.location.search 读取 openId / verifyCode
  window.location.href = `${window.location.pathname}${search}#/`;
};

// 牧场物语：进入验证码页并标记 target=farm，验证通过后进入农场；保留 openId/verifyCode
const goFarm = () => {
  const params = new URLSearchParams(window.location.search);
  params.set('target', 'farm');
  window.location.href = `${window.location.pathname}?${params.toString()}#/`;
};
</script>

<style scoped>
.home-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.home-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 40px 30px;
  background-color: #1e1e1e;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.home-title {
  font-size: 32px;
  margin: 0 0 8px;
}

.home-subtitle {
  color: #aaaaaa;
  font-size: 14px;
  margin: 0 0 32px;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home-btn {
  width: 100%;
  padding: 14px 20px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(to right, #007bff, #00a6ff);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 123, 255, 0.4);
  background: linear-gradient(to right, #0069d9, #0090e0);
}

.home-btn:active {
  transform: translateY(0);
}

</style>
