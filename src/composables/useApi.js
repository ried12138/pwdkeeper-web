import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'http://www.pwdkeeper.xin/api';

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

const createRequest = (openId, requestParam) => {
  return {
    requestPlatFrom: 'pwdkeeper.xin_web',
    requestId: '19ae7c84ca623695',
    openId,
    timestamp: Date.now(),
    requestParam,
  };
};

/**
 * 验证码校验
 * @param {*} openId 
 * @param {*} verifyCode 
 * @returns 
 */
export const verifyCode = async (openId, verifyCode) => {
  localStorage.removeItem('token'); // 清除浏览器中存储的 Authorization 信息
  const request = createRequest(openId, { verifyCode });
  try {
    const response = await instance.post('/verifyCode/verificationCode', request, {
      headers: {
        ...instance.defaults.headers.common,
        ...instance.defaults.headers.post,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: response.msg };
  }
};

/**
 * 获取用户信息
 * @param {*} openId 
 * @returns 
 */
export const getUserInfo = async (openId) => {
  const request = createRequest(openId, {});
  try {
    const response = await instance.post('/webFront/getUserInfo', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: response.data.msg };
  }
};

/**
 * 获取用户信息，资产数据 条件获取
 * @param {*} openId 
 * @param {*} pageNum 
 * @param {*} pageSize 
 * @param {*} classType 
 * @returns 
 */
export const fetchUserInfo = async (openId, pageNum = 1, pageSize = 10, classType = '', account = '') => {
  const request = createRequest(openId, { pageNum, pageSize, classType, account });
  try {
    const response = await instance.post('/webFront/webFetchUserInfoData', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: response.data.msg };
  }
};

/**
 *  添加用户信息数据
 * @param {*} openId 
 * @param {*} requestParam 
 * @returns 
 */
export const addUserInfo = async (openId, requestParam) => {
  const request = createRequest(openId, {
    ...requestParam,
    fileRequestBean: requestParam.fileRequestBean || null,
  });
  try {
    const response = await instance.post('/webFront/webAddUserInfoData', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 修改用户信息，资产数据
 * @param {*} openId 
 * @param {*} requestParam 
 * @returns 
 */
export const alterUserInfo = async (openId, requestParam) => {
  const request = createRequest(openId, requestParam);
  try {
    const response = await instance.post('/webFront/webAlterUserInfoData', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 
 * 删除账号
 * @param {} openId 
 * @param {*} ids 
 * @returns 
 */
export const removeUserInfo = async (openId, ids) => {
  const request = createRequest(openId, ids);
  try {
    const response = await instance.post('/webFront/webRemoveUserInfoData', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 
 * 安全退出
 * @param {*} openId 
 * @returns 
 */
export const signOut = async (openId) => {
  const request = createRequest(openId, {});
  try {
    const response = await instance.post('/webFront/signOut', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 
 * 请求字典
 * @returns 
 */
export const fetchPlatforms = async () => {
  try {
    const response = await instance.get('/dictionary/dictItem/1');
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 完善用户信息
 * @param {*} openId 
 * @param {*} userName 
 * @returns 
 */
export const completeUserInfo = async (openId, userName) => {
  const requestParam = {
    userName: userName,
  };
  const request = createRequest(openId, requestParam);
  try {
    const response = await instance.post('/webFront/completeUserInfo', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 加解密
 * @param {*} openId 
 * @param {*} password 
 * @param {*} type 1 for decrypt, 2 for encrypt
 * @returns 
 */
export const decryptDate = async (openId, password, type = 1) => { // 默认 type 为 1
  const requestParam = {
    type: type,
    password: password,
  };
  const request = createRequest(openId, requestParam);
  try {
    const response = await instance.post('/webFront/decryptDate', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 文件上传
 * @param {*} openId 
 * @param {*} base64Image 
 * @param {*} objectName 
 * @returns 
 */
export const uploadFile = async (openId, base64Image, objectName) => {
  const request = createRequest(openId, { base64Image, objectName });
  try {
    const response = await instance.post('/webFront/file/upload', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '上传失败' };
  }
};

/**
 * 获取图片地址和图片描述
 * @param {*} openId 
 * @param {*} id 
 * @returns 
 */
export const getImageUrl = async (openId, id) => {
  const requestParam = {
    id: id,
  };
  const request = createRequest(openId, requestParam);
  try {
    const response = await instance.post('/webFront/file/imageUrl', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 删除图片
 * @param {*} openId 
 * @param {*} id 
 * @returns 
 */
export const imageDelete = async (openId, id) => {
  const requestParam = {
    id: id,
  };
  const request = createRequest(openId, requestParam);
  try {
    const response = await instance.post('/webFront/file/imageDelete', request);
    return response.data;
  } catch (error) {
    console.error(error);
    return { code: '1', msg: '请求失败' };
  }
};

/**
 * 请求聊天接口
 * @param {*} openId 
 * @param {*} message 
 * @returns 
 */
export const fetchChatStream = (openId, message) => {
  const token = localStorage.getItem('token');
  const url = `${baseURL}/chat/deepSeekR1/stream?message=${encodeURIComponent(message)}&openId=${encodeURIComponent(openId)}&token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url, {
    headers: {
      'Accept': 'text/event-stream',
    },
  });
  return eventSource;
};
