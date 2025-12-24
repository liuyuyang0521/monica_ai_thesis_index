// API统一配置和工具函数
// 用于所有页面共享的API调用逻辑

// API基础配置
// 使用代理服务器解决Cookie跨域问题
// 启动代理: node proxy-server.js，然后访问 http://localhost:3000
const API_BASE_URL = 'http://localhost:3000/api';

// 成功码
const SUCCESS_CODE = 200;

// 错误码映射表（与login.js保持一致）
const ERROR_CODE_MAP = {
  // ========== 系统级错误 1xxxx ==========
  10000: '系统异常，请稍后重试',
  10001: '参数错误',
  10002: '请求方式错误',
  10003: '未登录或登录已过期',
  10004: '无权限访问',
  10005: '请求资源不存在',
  10006: '请求过于频繁，请稍后再试',
  
  // ========== 用户模块 11xxx ==========
  11001: '用户不存在',
  11002: '用户已存在',
  11003: '用户名已存在',
  11004: '手机号已被注册',
  11005: '邮箱已被注册',
  11006: '密码错误',
  11007: '原密码错误',
  11008: '账号已被禁用',
  11009: '账号已被锁定',
  11010: '账号无法发送验证码',
  
  // ========== 验证码模块 12xxx ==========
  12001: '验证码发送失败',
  12002: '验证码错误',
  12003: '验证码已过期',
  12004: '验证码发送过于频繁',
  12005: '验证码格式错误',
  
  // ========== Token模块 13xxx ==========
  13001: 'Token无效',
  13002: 'Token已过期',
  13003: 'Token解析失败',
  13004: 'RefreshToken无效',
  
  // ========== Monica预定模块 21xxx ==========
  21001: '预定不存在',
  21002: '预定已满',
  21003: '预定功能未开放',
  21004: '超过预定数量限制',
  21005: '预定时间不可用',
  21006: '预定已取消',
  
  // ========== 积分模块 31xxx ==========
  31001: '积分不足',
  31002: '超过积分限额',
  31003: '积分兑换功能未开放',
  31004: '积分记录不存在',
  
  // ========== 订单模块 41xxx ==========
  41001: '订单不存在',
  41002: '订单状态错误',
  41003: '订单已取消',
  41004: '订单已支付',
  41005: '订单已超时',
  41006: '订单创建失败',
  
  // ========== 支付模块 51xxx ==========
  51001: '支付记录不存在',
  51002: '支付失败',
  51003: '支付功能未开放',
  51004: '支付方式不可用',
  51005: '支付金额错误',
  51006: '退款失败',
  
  // ========== 后台管理模块 61xxx ==========
  61001: '管理员权限不足',
  61002: '配置不存在',
  61003: '配置更新失败',
};

/**
 * 统一的API请求封装
 * @param {string} url - API路径（相对路径，不包含/api前缀）
 * @param {Object} options - fetch选项
 * @returns {Promise<Object>} 返回 {success: boolean, data: any, message: string, code: number}
 */
async function apiRequest(url, options = {}) {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const defaultOptions = {
    mode: 'cors',
    credentials: 'include', // 包含cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(fullUrl, defaultOptions);
    
    // 解析响应数据
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn('响应不是JSON格式:', e);
      data = {};
    }
    
    // 处理HTTP错误
    if (!response.ok) {
      // 优先使用后端返回的message字段
      const errorMsg = data.message || ERROR_CODE_MAP[data.code] || `请求失败 (${response.status})`;
      return {
        success: false,
        code: data.code || response.status,
        message: errorMsg,
        data: null
      };
    }
    
    // 处理业务错误
    if (data.code !== SUCCESS_CODE) {
      // 优先使用后端返回的message字段
      const errorMsg = data.message || ERROR_CODE_MAP[data.code] || '操作失败';
      return {
        success: false,
        code: data.code,
        message: errorMsg,
        data: data.data || null
      };
    }
    
    // 成功
    return {
      success: true,
      code: data.code,
      message: data.message || '操作成功',
      data: data.data || null
    };
    
  } catch (error) {
    console.error('API请求错误:', error);
    
    let errorMsg = '网络错误，请检查网络连接';
    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
      errorMsg = '网络请求失败，请检查网络连接或联系管理员';
    }
    
    return {
      success: false,
      code: -1,
      message: errorMsg,
      data: null
    };
  }
}

// ==================== 用户相关API ====================

/**
 * 获取当前登录用户信息
 * @returns {Promise<Object>}
 */
async function getUserInfo() {
  return await apiRequest('/user/info', {
    method: 'GET'
  });
}

/**
 * 获取用户资料（包含用户信息和积分余额）
 * @returns {Promise<Object>}
 */
async function getUserProfile() {
  return await apiRequest('/user/profile', {
    method: 'GET'
  });
}

/**
 * 登出
 * @returns {Promise<Object>}
 */
async function logout() {
  return await apiRequest('/user/logout', {
    method: 'POST'
  });
}

// ==================== 积分相关API ====================

/**
 * 查询当前用户积分余额
 * @returns {Promise<Object>} 返回 {availablePoints, frozenPoints}
 */
async function getPointsBalance() {
  return await apiRequest('/points/balance', {
    method: 'GET'
  });
}

// ==================== 支付相关API ====================

/**
 * 创建充值订单（PC收银台）
 * @param {number} amount - 充值金额
 * @returns {Promise<Object>}
 */
async function createRecharge(amount) {
  return await apiRequest('/payment/recharge/pc', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

/**
 * 查询支付状态
 * @param {string} paymentNo - 支付单号
 * @returns {Promise<Object>}
 */
async function getPaymentStatus(paymentNo) {
  return await apiRequest(`/payment/status/${paymentNo}`, {
    method: 'GET'
  });
}

/**
 * 取消支付
 * @param {string} paymentNo - 支付单号
 * @returns {Promise<Object>}
 */
async function cancelPayment(paymentNo) {
  return await apiRequest(`/payment/cancel/${paymentNo}`, {
    method: 'POST'
  });
}

// ==================== 订单相关API ====================

/**
 * 创建订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>}
 */
async function createOrder(orderData) {
  return await apiRequest('/order/create', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

/**
 * 查询订单
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>}
 */
async function getOrder(orderNo) {
  return await apiRequest(`/order/${orderNo}`, {
    method: 'GET'
  });
}

/**
 * 取消订单
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>}
 */
async function cancelOrder(orderNo) {
  return await apiRequest(`/order/cancel/${orderNo}`, {
    method: 'POST'
  });
}

// ==================== AI任务相关API ====================

/**
 * 根据任务ID查询AI任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>}
 */
async function getTaskById(taskId) {
  return await apiRequest(`/api/ai/task/query?taskId=${taskId}`, {
    method: 'GET'
  });
}

/**
 * 根据订单号查询AI任务
 * @param {string} orderNo - 订单号
 * @returns {Promise<Object>}
 */
async function getTaskByOrderNo(orderNo) {
  return await apiRequest(`/api/ai/task/query-by-order?orderNo=${orderNo}`, {
    method: 'GET'
  });
}

// ==================== 工具函数 ====================

/**
 * 格式化时间
 * @param {string|Date} dateStr - 时间字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(dateStr) {
  if (!dateStr) return '--';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '--';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额字符串
 */
function formatAmount(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
}

/**
 * 获取订单状态描述
 * @param {number} status - 订单状态码
 * @returns {string} 状态描述
 */
function getOrderStatusDesc(status) {
  const statusMap = {
    0: '待处理',
    1: '处理中',
    2: '已完成',
    3: '已取消',
    4: '失败'
  };
  return statusMap[status] || '未知';
}

/**
 * 获取支付状态描述
 * @param {number} status - 支付状态码
 * @returns {string} 状态描述
 */
function getPaymentStatusDesc(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已过期',
    4: '支付失败'
  };
  return statusMap[status] || '未知';
}

/**
 * 获取AI任务状态描述
 * @param {number} status - 任务状态码
 * @returns {string} 状态描述
 */
function getTaskStatusDesc(status) {
  const statusMap = {
    0: '待处理',
    1: '处理中',
    2: '已完成',
    3: '失败'
  };
  return statusMap[status] || '未知';
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!localStorage.getItem('account');
}

/**
 * 跳转到登录页
 */
function redirectToLogin() {
  // 清除本地缓存
  localStorage.removeItem('userInfo');
  localStorage.removeItem('userId');
  localStorage.removeItem('account');
  // 跳转
  window.location.href = 'login.html';
}

/**
 * 显示登录超时提示并跳转
 */
function showLoginExpired() {
  if (window.toast) {
    toast.error('登录已过期，请重新登录', '提示', () => {
      redirectToLogin();
    });
  } else {
    alert('登录已过期，请重新登录');
    redirectToLogin();
  }
}

/**
 * 检查登录状态（用于需要登录的页面）
 * 如果未登录，显示提示并跳转到登录页
 */
function requireLogin() {
  if (!isLoggedIn()) {
    showLoginExpired();
    return false;
  }
  return true;
}

