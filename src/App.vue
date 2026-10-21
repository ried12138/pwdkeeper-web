<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  box-sizing: border-box;
}

/* 手机端：减少顶部留白，增加左右安全边距，适配刘海屏 */
@media (max-width: 600px) {
  #app {
    margin-top: 16px;
    padding: 0 12px;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>    