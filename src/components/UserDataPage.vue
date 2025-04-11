<template>
  <div class="container">
    <h3 class="gradient-text">怪兽记账号 {{ userName ? `(${userName})` : '' }}</h3>
    <!-- 修改: 使用 button 标签并绑定点击事件 -->
    <a v-if="userName" @click="navigateToDeepSeek" class="deepseek-link">deepSeek R1(满血版)</a>
    <a v-else  @click.prevent="showUserNameModal" class="deepseek-link">deepSeek R1(满血版)</a>
    <!-- 添加按钮到左上角 -->
    <button @click="showAddAccountModal" class="add-account-button">添加账户</button>
    <!-- 将退出按钮移动到右上角 -->
    <button @click="confirmExit" class="exit-button">退出</button>
    <div class="filter-container">
      <select v-model="filterPlatform">
        <option value="" disabled>请选择平台</option>
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
              <option v-for="platform in platforms" :key="platform.itemId" :value="platform.itemId">{{ platform.itemValue }}</option>
            </select>
            <!-- 添加问号图标和提示信息 -->
            <span @click="showPlatformTooltip = true" class="tooltip-icon">?</span>
            <div v-if="showPlatformTooltip" class="tooltip">
              找不到平台？告诉《怪兽记账号》公众号<br>
              发送指令：XXXX平台
              <span @click="showPlatformTooltip = false" class="close-tooltip">&times;</span>
            </div>
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
          <div>
            <label>上传照片:</label>
            <div v-if="selectedItem.imageUrl" style="position: relative;">
              <button type="button" @click="deleteImage" class="delete-image-button" style="position: absolute; top: 5px; right: 5px; z-index: 10;">删除图片</button>
              <img :src="selectedItem.imageUrl" alt="Uploaded Image" style="max-width: 78%; height: auto; margin-bottom: 10px;" @click="showImageModal" />
            </div>
            <input v-else type="file" @change="handleFileUpload" accept="image/png, image/jpeg" />
          </div>
          <div v-if="showImageDescription">
            <!-- <div v-if="selectedItem.imageUrl"> -->
            <!-- <div> -->
            <label>照片描述:</label>
            <input v-model="selectedItem.imageDescription" type="text" required />
          </div>
          <div v-if="!isAddingAccount">
            <label>最后一次更新:</label>
            {{ selectedItem.updateTime }}
          </div>
          <div class="button-container">
            <button type="submit" :disabled="isSubmitting">{{ isSubmitting ? '数据正在提交...' : (isAddingAccount ? '添加' : '保存') }}</button>
            <button v-if="!isAddingAccount" @click="copyToClipboard(`账号：${selectedItem.account}\n密码：${selectedItem.password}`)" type="button" class="small-button">一键复制</button>
          </div>
        </form>
      </div>
    </div>
    <!-- 新增图片展示模态框 -->
    <div v-if="showImageModalFlag" class="image-modal">
      <div class="image-modal-content">
        <span class="close" @click="closeImageModal">&times;</span>
        <img :src="selectedItem.imageUrl" alt="Uploaded Image" style="max-width: 100%; height: auto;" />
      </div>
    </div>
    <!-- 新增用户名输入模态框 -->
    <div v-if="showUserNameInput" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeUserNameModal">&times;</span>
        <h3>请输入用户名</h3>
        <form @submit.prevent="submitUserName">
          <div>
            <label>用户名:</label>
            <input v-model="newUserName" type="text" required />
          </div>
          <div class="button-container">
            <button type="submit">提交</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchUserInfo, fetchPlatforms, alterUserInfo, removeUserInfo, signOut, addUserInfo, decryptDate, completeUserInfo, getImageUrl, imageDelete } from '../composables/useApi.js';

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
const searchAccount = ref('');
const platforms = ref([]);
const router = useRouter();
const route = useRoute();
const selectedItem = ref(null);
const isAddingAccount = ref(false);
const userName = ref('');
const newUserName = ref('');
const showUserNameInput = ref(false);
const showPlatformTooltip = ref(false);
const showImageModalFlag = ref(false);
const isSubmitting = ref(false); // 新增状态变量来控制等待特效

onMounted(async () => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const userNameFromUrl = route.query.userName;
  if (userNameFromUrl) {
    userName.value = decodeURIComponent(userNameFromUrl); // 确保解码 userName
  }
  // 获取平台列表
  const platformsResult = await fetchPlatforms();
  if (platformsResult.code === 0) {
    platforms.value = platformsResult.data;
  } else if (platformsResult.data && platformsResult.data.code >= 100 && platformsResult.data.code <= 199) {
    alert(platformsResult.data.msg);
    router.push(`/verification-code/${encodeURIComponent(openId)}`); // 修改: 使用路由参数传递 openId
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
    // 修改: 从查询参数中获取 openId
    const openId = route.query.openId;
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
const showDetails = async (item) => {
  selectedItem.value = {
    ...item,
    updateTime: formatDateTime(item.updateTime), // 格式化 updateTime
  };
  isAddingAccount.value = false; // 确保不是添加账户模式

  // 请求图片信息和图片描述
  const openId = route.query.openId;
  const result = await getImageUrl(openId, item.id);
  if (result.code === 0) {
    selectedItem.value.imageUrl = result.data.imageUrl;
    selectedItem.value.imageDescription = result.data.objectName;
  } else {
    console.error('Failed to fetch image URL and description:', result.msg);
  }
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
    // fileRequestBean: {}, // 修改: 初始化 fileRequestBean 为一个空对象
    // fileRequestBean: selectedItem.value.fileRequestBean || null,
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
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const requestParam = {
    ...selectedItem.value,
  };
  // 打印照片描述
  delete requestParam.imageDescription; // 删除 imageDescription 字段
  // 检查 fileRequestBean 是否存在
  if (requestParam.fileRequestBean) {
    if (!selectedItem.value.imageDescription) {
      alert('照片信息描述不能为空');
      return;
    }
    requestParam.fileRequestBean.objectName = selectedItem.value.imageDescription;
  }
  isSubmitting.value = true; // 设置提交状态
  const result = await addUserInfo(openId, requestParam);
  isSubmitting.value = false; // 清除提交状态
  if (result.code === 0) {
    alert('添加成功');
    closeModal();
    // 刷新数据
    await loadUserData(filterPlatform.value, searchAccount.value, userData.value.pageNum, userData.value.pageSize);
  } else {
    alert(result.msg);
  }
};

const updateItem = async () => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const requestParam = {
    ...selectedItem.value,
  };
  delete requestParam.imageDescription; // 删除 imageDescription 字段
  delete requestParam.deleted; // 删除 imageDescription 字段
  delete requestParam.accountEmpty;
  delete requestParam.bindPhoneEmpty;
  delete requestParam.bindEmailEmpty;
  delete requestParam.updateTime;
  delete requestParam.imageUrl;
  // 检查 fileRequestBean 是否存在
  if (requestParam.fileRequestBean) {
    if (!selectedItem.value.imageDescription) {
      alert('照片信息描述不能为空');
      return;
    }
    requestParam.fileRequestBean.objectName = selectedItem.value.imageDescription;
  }
  isSubmitting.value = true; // 设置提交状态
  const result = await alterUserInfo(openId, [requestParam]);
  isSubmitting.value = false; // 清除提交状态
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
    // 修改: 从查询参数中获取 openId
    const openId = route.query.openId;
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
const loadUserData = async (classType, account, pageNum, pageSize) => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const result = await fetchUserInfo(openId, pageNum, pageSize, classType, account);
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
  console.log('copyToClipboard called with text:', text); // 添加调试信息
  if (text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Content copied to clipboard:', text); // 添加调试信息
          alert('内容已复制到剪贴板');
        })
        .catch(err => {
          console.error('无法复制到剪贴板', err); // 添加调试信息
          alert('复制失败，请手动复制');
        });
    } else {
      console.error('Clipboard API 不可用'); // 添加调试信息
      alert('您的浏览器不支持自动复制功能，请手动复制');
    }
  } else {
    console.error('No text provided to copy'); // 添加调试信息
  }
};

const decryptPassword = async () => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const result = await decryptDate(openId, selectedItem.value.password);
  if (result.code === 0) {
    selectedItem.value.password = result.data.password;
  } else {
    alert(result.msg);
  }
};

const encryptPassword = async () => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
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
    await loadUserData(filterPlatform.value, searchAccount.value, userData.value.pageNum, userData.value.pageSize);
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

const showUserNameModal = () => {
  showUserNameInput.value = true;
};

const closeUserNameModal = () => {
  showUserNameInput.value = false;
};

const submitUserName = async () => {
  // 修改: 从查询参数中获取 openId
  const openId = route.query.openId;
  const result = await completeUserInfo(openId, newUserName.value);
  if (result.code === 0) {
    userName.value = newUserName.value;
    closeUserNameModal();
    router.push(`/deepseek?openId=${encodeURIComponent(openId)}`); // 修改: 跳转到 deepSeek 页面并传递 openId
  } else {
    alert(result.msg);
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target.result.split(',')[1];
      const mimeType = file.type === 'image/png' ? 'image/png,' : 'image/jpeg,';
      selectedItem.value.fileRequestBean = {
        objectName: selectedItem.value.imageDescription, // 确保 imageDescription 已经被赋值
        base64Image: mimeType + base64Image,
      };
    };
    reader.readAsDataURL(file);
  }
};

const showImageDescription = computed(() => {
  return selectedItem.value && selectedItem.value.fileRequestBean || selectedItem.value.imageDescription !== undefined && selectedItem.value.imageDescription !== '';
  // return selectedItem.value && selectedItem.value.fileRequestBean;
});

// 新增方法：显示图片模态框
const showImageModal = () => {
  showImageModalFlag.value = true;
};

// 新增方法：关闭图片模态框
const closeImageModal = () => {
  showImageModalFlag.value = false;
};

// 新增方法：删除图片
const deleteImage = async () => {
  if (confirm('确定要删除该图片吗？')) { // 添加确认弹窗
    const openId = route.query.openId;
    const result = await imageDelete(openId, selectedItem.value.id);
    if (result.code === 0) {
      selectedItem.value.imageUrl = null;
      selectedItem.value.imageDescription = '';
      selectedItem.value.fileRequestBean = null;
      alert('图片删除成功');
    } else {
      console.error('Failed to delete image:', result.msg);
      alert('图片删除失败，请稍后重试');
    }
  }
};

// 新增方法：导航到 DeepSeek 页面
const navigateToDeepSeek = () => {
  const openId = route.query.openId;
  router.push({
    path: '/deepseek',
    query: {
      openId: encodeURIComponent(openId),
    },
  });
};

</script>

<style scoped>
.container {
  position: relative; /* 添加相对定位 */
}

.gradient-text {
  margin-bottom: 10px; /* 增加底部外边距，使得 h2 标签稍微往下一点 */
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

/* 新增跳转链接样式 */
.deepseek-link {
  display: block;
  margin-top: 5px; /* 减少顶部外边距，使得 a 标签上下更近一点 */
  font-size: 16px;
  color: #007bff;
  text-decoration: none;
}

.deepseek-link:hover {
  text-decoration: underline;
}

/* 新增用户名输入模态框样式 */
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
  width: 80%;
  max-width: 350px;
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
  display: flex;
  align-items: center;
}

form label {
  margin-right: 5px;
  flex: 0 0 80px;
  font-size: 12px;
  white-space: nowrap;
}

form input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #add8e6;
}

form button {
  padding: 6px 12px;
  width: auto;
  font-size: 12px;
  min-width: 60px;
}

@media (max-width: 600px) {
  .modal-content {
    width: 90%;
  }

  form input {
    padding: 6px;
  }

  form button {
    padding: 6px 12px;
  }
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.button-container button {
  margin: 0 5px;
}

.tooltip-icon {
  margin-left: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tooltip {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 5px;
  width: 300px;
  font-size: 12px; /* 修改: 调整字体大小 */
}

.close-tooltip {
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #000;
}

/* 新增图片模态框样式 */
.image-modal {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.9);
}

.image-modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  max-width: 800px;
  text-align: center;
}

.image-modal img {
  max-width: 100%;
  height: auto;
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

/* 新增删除图片按钮样式 */
.delete-image-button {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #ff4d4d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 5px;
}

.delete-image-button:hover {
  background-color: #ff1a1a;
}

.modal-content {
  position: relative; /* 添加相对定位 */
}

.modal-content .loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content .loading::before {
  content: '数据正在提交...';
  font-size: 16px;
  color: #333;
}
</style>