<template>
  <div class="container">
    <h2 class="gradient-text">怪兽记账号</h2>
    <!-- 添加按钮到左上角 -->
    <button @click="showAddAccountModal" class="add-account-button">添加账户</button>
    <!-- 将退出按钮移动到右上角 -->
    <button @click="confirmExit" class="exit-button">退出</button>
    <div class="filter-container">
      <select v-model="filterPlatform">
        <option value="">请选择平台</option>
        <option v-for="platform in platforms" :key="platform.itemId" :value="platform.itemId">{{ platform.itemValue }}</option>
      </select>
      <input v-model="searchAccount" placeholder="请输入账号" />
      <button @click="searchByAccount" class="search-button">查询</button>
    </div>
    <table>
      <thead>
        <tr>
          <th class="platform-column">平台</th>
          <th>账号</th>
          <th class="action-column">操作</th> <!-- 新增操作列 -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredUserData" :key="item.id">
          <td>{{ getPlatformName(item.classType) }}</td>
          <td>{{ truncatedAccount(item.account) }}</td> <!-- 修改: 使用计算方法截取账号 -->
          <td>
            <button @click="showDetails(item)" class="action-button">详情</button> <!-- 新增详情按钮 -->
            <button @click="confirmDelete(item)" class="action-button delete-button">删除</button> <!-- 新增删除按钮 -->
          </td>
        </tr>
      </tbody>
    </table>
    <!-- 修改分页控件显示逻辑 -->
    <div v-if="userData.pages > 1" class="pagination">
      <button :disabled="!userData.hasPreviousPage" @click="changePage(userData.prePage)">上一页</button>
      <span>第 {{ userData.pageNum }} 页，共 {{ userData.pages }} 页</span>
      <button :disabled="!userData.hasNextPage" @click="changePage(userData.nextPage)">下一页</button>
    </div>
    <!-- 新增模态框 -->
    <div v-if="selectedItem || isAddingAccount" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h3>{{ isAddingAccount ? '添加账户' : '编辑数据' }}</h3>
        <form @submit.prevent="isAddingAccount ? addItem() : updateItem()">
          <div>
            <label>平台:</label>
            <select v-model="selectedItem.classType">
              <option v-for="platform in platforms" :key="platform.itemId" :value="platform.itemId">{{ platform.itemValue }}</option> <!-- 修改: 确保 {{ platform.itemValue }} 正确绑定 -->
            </select>
          </div>
          <div>
            <label>账号:</label>
            <input v-model="selectedItem.account" type="text" />
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.account)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>密码:</label>
            <input v-model="selectedItem.password" type="text" />
            <div class="button-stack">
              <button @click="decryptPassword" type="button" class="small-button">解密</button>
              <button @click="encryptPassword" type="button" class="small-button">加密</button> 
            </div>
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.password)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>绑定手机号:</label>
            <input v-model="selectedItem.bindPhone" type="text" maxlength="11" @input="filterInput" />
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.bindPhone)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>绑定邮箱:</label>
            <input v-model="selectedItem.bindEmail" type="email" />
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.bindEmail)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>绑定问题:</label>
            <input v-model="selectedItem.bindAsk" type="text" />
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.bindAsk)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>绑定答案:</label>
            <input v-model="selectedItem.bindAnswer" type="text" />
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.bindAnswer)" type="button" class="small-button">复制</button>
          </div>
          <div>
            <label>存储其他信息:</label>
            <textarea v-model="selectedItem.otherSecret" rows="4" cols="50" maxlength="200"></textarea>
            <button v-if="!isAddingAccount" @click="copyToClipboard(selectedItem.otherSecret)" type="button" class="small-button">复制</button>
          </div>
          <div v-if="!isAddingAccount">
            <label>最后一次更新:</label>
            {{ selectedItem.updateTime }}
          </div>
          <div class="button-container">
            <!-- <button type="submit" :disabled="!isBindPhoneValid">{{ isAddingAccount ? '添加' : '保存' }}</button> -->
            <button type="submit">{{ isAddingAccount ? '添加' : '保存' }}</button>
            <button v-if="!isAddingAccount" @click="copyToClipboard" type="button" class="small-button">一键复制</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUserInfo, fetchPlatforms, alterUserInfo, removeUserInfo, signOut, addUserInfo, decryptDate } from '../composables/useApi.js';

const userData = ref({
  list: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  prePage: 0,
  nextPage: 0,
});
const filterPlatform = ref('');
const searchAccount = ref(''); // 新增账号搜索输入框
const platforms = ref([]);
const router = useRouter();
const selectedItem = ref(null); // 修改: 初始化为 null
const isAddingAccount = ref(false); // 新增标志位，用于判断是否在添加账户

onMounted(async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  // 获取平台列表
  const platformsResult = await fetchPlatforms();
  if (platformsResult.code === 0) {
    platforms.value = platformsResult.data;
  } else if (platformsResult.data && platformsResult.data.code >= 100 && platformsResult.data.code <= 199) {
    alert(platformsResult.data.msg);
    router.push(`/verification-code?openId=${encodeURIComponent(openId)}`);
  } else {
    alert(platformsResult.msg);
  }
});

// 修改 watch 函数以支持分页
watch(filterPlatform, async (newPlatform) => {
  if (newPlatform) {
    await loadUserData(newPlatform, searchAccount.value, userData.value.pageNum, userData.value.pageSize);
  } else {
    userData.value = {
      list: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
      prePage: 0,
      nextPage: 0,
    };
  }
});

const filteredUserData = computed(() => {
  if (!filterPlatform.value && !searchAccount.value) {
    return userData.value.list || [];
  }
  return (userData.value.list || []).filter(item => 
    (!filterPlatform.value || item.classType === filterPlatform.value) &&
    (!searchAccount.value || item.account.includes(searchAccount.value))
  );
});

const confirmExit = async () => {
  if (confirm('确定要退出吗？')) {
    const openId = new URLSearchParams(window.location.search).get('openId');
    const result = await signOut(openId); // 调用退出接口
    if (result.code === 0) {
      localStorage.removeItem('token'); // 删除请求头数据
      router.push(`/?openId=${encodeURIComponent(openId)}`); // 跳转到验证码页面
    } else {
      alert(result.msg || '退出失败，请稍后重试');
    }
  }
};

// 新增方法：根据 classType 获取平台名称
const getPlatformName = (classType) => {
  const platform = platforms.value.find(p => p.itemId === classType);
  return platform ? platform.itemValue : '';
};

// 新增方法：显示详情
const showDetails = (item) => {
  selectedItem.value = {
    ...item,
    updateTime: formatDateTime(item.updateTime), // 格式化 updateTime
  };
  isAddingAccount.value = false; // 确保不是添加账户模式
};

// 新增方法：显示添加账户模态框
const showAddAccountModal = () => {
  selectedItem.value = {
    classType: 0,
    account: '',
    password: '',
    bindPhone: '',
    bindEmail: '',
    bindAsk: '',
    bindAnswer: '',
    otherSecret: '',
  };
  isAddingAccount.value = true; // 设置为添加账户模式
};

// 新增方法：关闭模态框
const closeModal = () => {
  selectedItem.value = null;
  isAddingAccount.value = false; // 重置添加账户标志位
};

//添加新的账户信息
const addItem = async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await addUserInfo(openId, selectedItem.value);
  if (result.code === 0) {
    alert('添加成功');
    closeModal();
    // 刷新数据
    await loadUserData(filterPlatform.value, searchAccount.value, userData.value.pageNum, userData.value.pageSize);
  } else {
    alert(result.msg);
  }
};

//更新账户信息
const updateItem = async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await alterUserInfo(openId, [selectedItem.value]);
  if (result.code === 0) {
    alert('更新成功');
    closeModal();
    // 刷新数据
    await loadUserData(filterPlatform.value, searchAccount.value, userData.value.pageNum, userData.value.pageSize);
  } else {
    alert(result.msg);
  }
};

// 新增方法：确认删除
const confirmDelete = async (item) => {
  if (confirm('确定要删除该数据吗？')) {
    const openId = new URLSearchParams(window.location.search).get('openId');
    const result = await removeUserInfo(openId, [item.id]);
    if (result.code === 0) {
      alert('删除成功');
      // 刷新数据
      const newResult = await fetchUserInfo(openId, 1, 10, filterPlatform.value);
      if (newResult.code === 0) {
        userData.value = newResult.data;
      } else {
        alert(newResult.msg);
      }
    } else {
      alert(result.msg);
    }
  }
};

// 新增加载用户数据的方法
const loadUserData = async (classType,account, pageNum, pageSize) => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await fetchUserInfo(openId, pageNum, pageSize, classType,account);
  if (result.code === 0) {
    userData.value = result.data;
  } else {
    alert(result.msg);
  }
};

// 新增切换页码的方法
const changePage = async (pageNum) => {
  if (pageNum > 0 && pageNum <= userData.value.pages) {
    await loadUserData(filterPlatform.value, searchAccount.value, pageNum, userData.value.pageSize);
  }
};

// 新增方法：格式化时间
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime.replace(' ', 'T')); // 将空格替换为 T 以匹配 ISO 格式
  return date.toLocaleString(); // 使用本地化的时间格式
};

// 修改 copyToClipboard 方法以阻止表单默认提交行为
const copyToClipboard = (text) => {
  if (text) {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('无法复制到剪贴板', err);
        alert('复制失败，请手动复制');
      });
  }
};

const decryptPassword = async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await decryptDate(openId, selectedItem.value.password);
  if (result.code === 0) {
    selectedItem.value.password = result.data.password;
  } else {
    alert(result.msg);
  }
};

const encryptPassword = async () => {
  const openId = new URLSearchParams(window.location.search).get('openId');
  const result = await decryptDate(openId, selectedItem.value.password, 2); // 传入 type = 2
  if (result.code === 0) {
    selectedItem.value.password = result.data.password;
  } else {
    alert(result.msg);
  }
};

//根据账号搜索
const searchByAccount = async () => {
  if (searchAccount.value) {
    // 这里可以根据账号进行查询，假设查询逻辑与 loadUserData 类似
    await loadUserData(filterPlatform.value, searchAccount.value,userData.value.pageNum, userData.value.pageSize);
  } else {
    alert('请输入账号');
  }
};

// 新增方法：过滤输入，只允许数字
const filterInput = (event) => {
  const input = event.target.value;
  const filteredInput = input.replace(/\D/g, ''); // 移除非数字字符
  if (filteredInput.length <= 11) {
    selectedItem.value.bindPhone = filteredInput;
  } else {
    selectedItem.value.bindPhone = filteredInput.slice(0, 11); // 限制最大长度为11
  }
};
// 新增方法：截取账号并添加省略号
const truncatedAccount = (account) => {
  if (account.length > 16) {
    return account.slice(0, 16) + '...';
  }
  return account;
};
</script>

<style scoped>
.container {
  position: relative; /* 添加相对定位 */
}

.exit-button {
  position: absolute; /* 使用绝对定位 */
  top: 20px; /* 距离顶部20px */
  right: 20px; /* 距离右侧20px */
  padding: 6px 22px; /* 缩小内边距 */
  font-size: 14px; /* 调整字体大小 */
  width: auto; /* 自动宽度适应内容 */
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  padding: 10px;
  border: 1px solid #333;
  white-space: nowrap; /* 防止内容换行 */
}

th {
  min-width: 100px; /* 设置最小宽度 */
}

/* 新增模态框样式 */
.modal {
  display: block;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%; /* 修改宽度为80% */
  max-width: 350px; /* 修改最大宽度为350px */
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

form div {
  margin-bottom: 10px;
  display: flex; /* 使用 flexbox 布局 */
  align-items: center; /* 垂直居中对齐 */
}

form label {
  margin-right: 5px; /* 减少标签和输入框之间的间距 */
  flex: 0 0 80px; /* 设置标签的固定宽度 */
  font-size: 12px; /* 减小标签的字体大小 */
  white-space: nowrap; /* 防止标签换行 */
}

form input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #add8e6; /* 设置边框颜色为淡蓝色 */
}

form button {
  padding: 6px 12px;
  width: auto;
  font-size: 12px;
  min-width: 60px; /* 增加按钮的最小宽度 */
}

/* 新增媒体查询以适应手机屏幕 */
@media (max-width: 600px) {
  .modal-content {
    width: 90%; /* 修改宽度为90% */
  }

  form input {
    padding: 6px;
  }

  form button {
    padding: 6px 12px;
  }
}

/* 新增样式以调整平台列和操作列 */
.platform-column {
  min-width: 50px; /* 调整平台列的最小宽度 */
  max-width: 95px; /* 调整平台列的最大宽度 */
}

.action-column {
  min-width: 75px; /* 调整操作列的最小宽度 */
}

.action-button {
  padding: 4px 8px; /* 缩小按钮的内边距 */
  width: 60px; /* 缩小按钮的宽度 */
}

/* 新增样式以调整删除按钮 */
.delete-button {
  background-color: #ff4d4d; /* 设置删除按钮背景色为红色 */
  margin-left: 5px; /* 添加左边距以区分两个按钮 */
}

/* 分页控件样式：调整退出按钮与分页按钮的间距 */
.pagination {
  margin-top: 40px; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.pagination button {
  padding: 3px 8px;
  width: auto;
  font-size: 12px;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.button-container button {
  margin: 0 5px;
}

.small-button {
  padding: 4px 8px; /* 缩小按钮的内边距 */
  width: auto;
  font-size: 12px;
  min-width: 40px; /* 减小按钮的最小宽度 */
}

.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container select,
.filter-container input {
  margin-right: 10px;
}

.search-button {
  padding: 6px 12px;
  font-size: 12px;
}

/* 新增添加账户按钮样式 */
.add-account-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 6px 12px;
  font-size: 12px;
  min-width: 60px;
}

.button-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.button-stack button {
  margin-bottom: 5px;
}
</style>