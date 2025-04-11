<template>
  <div class="container">
    <h2>deepSeek R1(满血版)</h2>
    <div class="chat-container">
      <div class="message-list" ref="messageList">
        <div v-for="(message, index) in messages" :key="index" class="message" :class="{ 'user-message': message.type === 'user', 'ai-message': message.type === 'ai' }">
          <strong>{{ message.type === 'user' ? userName + ':' : 'AI:' }}</strong> {{ message.content }}
        </div>
      </div>
      <div class="input-container">
        <input v-model="userMessage" placeholder="请输入要问的内容..." @keyup.enter="sendMessage" />
        <button @click="sendMessage" class="back-button">发送</button>
      </div>
       <!-- 移动返回按钮到底部 -->
    <button @click="goBack" class="back-button">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 添加 useRouter 引入
import { fetchChatStream, getUserInfo } from '../composables/useApi.js';

const userMessage = ref('');
const messages = ref([]);
const eventSource = ref(null);
const messageList = ref(null);
const userName = ref('You');

const route = useRoute();
const router = useRouter(); // 初始化 router
const openId = route.query.openId;

const sendMessage = () => {
  if (userMessage.value.trim() === '') return;

  // Add user message to the list
  messages.value.push({ type: 'user', content: userMessage.value });

  // Send user message to the server
  eventSource.value = fetchChatStream(openId, userMessage.value);
  eventSource.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
      // 处理接收到的 JSON 数据块
      const content = data.choices[0].delta.content;
      if (messages.value.length > 0 && messages.value[messages.value.length - 1].type === 'ai') {
        messages.value[messages.value.length - 1].content += content;
      } else {
        messages.value.push({ type: 'ai', content: content });
      }
      // Scroll to the bottom of the message list
      nextTick(() => {
        messageList.value.scrollTop = messageList.value.scrollHeight;
      });
    }
  };

  eventSource.value.onerror = (error) => {
    console.error('EventSource failed:', error);
    eventSource.value.close();
  };

  userMessage.value = '';
};

// 修改: 添加日志以调试 userInfo 的返回值
onMounted(async () => {
  try {
    const userInfo = await getUserInfo(openId);
    if (userInfo.code === 0 && userInfo.data && userInfo.data.userName) {
      userName.value = userInfo.data.userName;
    } else {
      console.error('User info does not contain userName:', userInfo);
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
  }
});

onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close();
  }
});

// 添加返回方法
const goBack = () => {
  router.push({ 
    path: '/user-data', 
    query: { 
      openId: encodeURIComponent(openId),
      userName: encodeURIComponent(userName.value), // 传递 userName 值
    },
  });
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.back-button {
  position: static; /* 修改: 移除绝对定位 */
  margin-top: 20px; /* 添加: 增加顶部间距 */
  padding: 6px 12px;
  font-size: 12px;
  min-width: 60px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.back-button:hover {
  background-color: #0056b3;
}

.chat-container {
  width: 100%;
  max-width: 100%;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  height: 80vh;
}

.message-list {
  height: calc(80vh - 180px);
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.message {
  margin-bottom: 10px;
  color: white; /* 修改: 添加白色字体 */
}

.user-message {
  text-align: right;
}

.ai-message {
  text-align: left;
}

.input-container {
  display: flex;
  align-items: center; /* 确保子元素垂直居中对齐 */
  width: 100%;
}

.input-container input {
  flex: 1;
  padding: 5px; /* 减少 padding 以减小高度 */
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
  height: 30px; /* 设置固定高度 */
}

.input-container button {
  padding: 5px 15px; /* 减少 padding 以减小高度 */
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  height: 30px; /* 设置固定高度 */
}

.input-container button:hover {
  background-color: #0056b3;
}
</style>