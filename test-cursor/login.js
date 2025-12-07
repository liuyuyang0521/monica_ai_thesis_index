// API配置
// 如果使用代理服务器（端口3000），使用 '/api'
// 如果使用Live Server或其他服务器，直接使用后端地址
const isProxyServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  && window.location.port === '3000';
const API_BASE_URL = isProxyServer
  ? '/api'  // 代理服务器：通过代理转发
  : 'http://192.168.2.31:8080/api';  // 直接访问后端（Live Server或其他环境）

// 错误码映射配置
// 成功码：通常为 0 或 200，其他均为错误码
const SUCCESS_CODE = 200; // 登录成功返回的code值
const SUCCESS_MESSAGE = '操作成功'; // 登录成功返回的message

// 错误码映射表
// 规则：业务模块代码(2位) + 具体错误(3位)
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
 * 处理API返回的错误
 * @param {Object} responseData - 后端返回的数据 {code, message, data}
 * @param {Object} options - 可选配置 {strict: boolean} strict为true时需要同时判断code和message
 * @returns {Object} {isSuccess: boolean, message: string, data: any}
 */
function handleApiResponse(responseData, options = {}) {
  const { code, message, data } = responseData;
  const { strict = false } = options;
  
  // 判断是否为成功码
  let isSuccess = false;
  if (strict) {
    // 严格模式：code为200且message为"操作成功"（用于登录接口）
    isSuccess = code === SUCCESS_CODE && message === SUCCESS_MESSAGE;
  } else {
    // 普通模式：只判断code为200（用于其他接口）
    isSuccess = code === SUCCESS_CODE;
  }
  
  if (isSuccess) {
    return {
      isSuccess: true,
      message: message || '操作成功',
      data: data || null
    };
  }
  
  // 错误码处理：优先使用错误码映射表中的消息，如果没有则使用后端返回的message
  const errorMessage = ERROR_CODE_MAP[code] || message || `操作失败 (错误码: ${code})`;
  
  return {
    isSuccess: false,
    message: errorMessage,
    code: code,
    data: data || null
  };
}

// 登录方式标签页切换
const tabButtons = document.querySelectorAll('.tab-btn');
const phoneForm = document.getElementById('phone-form');
const emailForm = document.getElementById('email-form');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // 移除所有 active 类
    tabButtons.forEach(b => b.classList.remove('active'));
    // 添加 active 类到当前按钮
    btn.classList.add('active');

    // 切换表单显示
    const tab = btn.getAttribute('data-tab');
    if (tab === 'phone') {
      phoneForm.classList.remove('hidden');
      emailForm.classList.add('hidden');
    } else {
      phoneForm.classList.add('hidden');
      emailForm.classList.remove('hidden');
    }
  });
});

// 通用的发送验证码函数
async function sendVerificationCode(accountInput, sendBtn, way) {
  const account = accountInput.value.trim();
  
  if (!account) {
    const accountType = way === 1 ? '手机号' : '邮箱';
    toast.warning(`请先输入${accountType}`, '提示');
    accountInput.focus();
    return;
  }

  // 验证格式
  if (way === 1) {
    // 手机号验证
    if (!/^1[3-9]\d{9}$/.test(account)) {
      toast.error('请输入正确的手机号', '输入错误');
      accountInput.focus();
      return;
    }
  } else {
    // 邮箱验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
      toast.error('请输入正确的邮箱', '输入错误');
      accountInput.focus();
      return;
    }
  }

  // 检测是否通过file://协议访问（会导致CORS问题）
  if (window.location.protocol === 'file:') {
    toast.error(
      '检测到您通过文件协议访问页面，这会导致跨域问题。\n\n请使用HTTP服务器访问页面，例如：\n1. 使用VS Code的Live Server插件\n2. 或运行: python -m http.server 8000\n3. 然后访问: http://localhost:8000/login.html',
      '跨域问题'
    );
    return;
  }

  // 调用发送验证码接口
  try {
    // 禁用按钮，防止重复点击
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';

    const response = await fetch(`${API_BASE_URL}/user/send-code`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include', // 允许发送和接收cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: account,
        way: way
      })
    });

    // 检查HTTP响应状态（用于处理网络错误、CORS错误等）
    if (!response.ok) {
      // HTTP错误（如403 CORS错误等）
      let errorMsg = '发送失败，请稍后重试';
      try {
        const errorData = await response.json();
        // 如果返回的是标准格式，使用错误码处理
        if (errorData.code !== undefined) {
          const result = handleApiResponse(errorData);
          errorMsg = result.message;
        } else {
          errorMsg = errorData.message || errorData.msg || `服务器错误 (${response.status})`;
        }
      } catch (e) {
        // 如果响应不是JSON，使用状态码
        if (response.status === 403) {
          errorMsg = '请求被拒绝 (403)。\n\n可能的原因：\n1. 服务器未配置CORS跨域\n2. 需要联系后端开发人员配置允许跨域\n3. 或者使用代理服务器';
        } else {
          errorMsg = `请求失败 (状态码: ${response.status})`;
        }
      }
      
      sendBtn.disabled = false;
      sendBtn.textContent = '立即发送';
      toast.error(errorMsg, '发送失败');
      console.error('API响应错误:', response.status, response.statusText);
      return;
    }

    // 解析响应数据
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // 如果响应不是JSON，可能是空响应或文本
      console.warn('响应不是JSON格式:', e);
      data = {};
    }

    // 使用统一的错误码处理逻辑
    const result = handleApiResponse(data);
    
    if (!result.isSuccess) {
      // 发送失败，显示错误提示
      sendBtn.disabled = false;
      sendBtn.textContent = '立即发送';
      toast.error(result.message, '发送失败');
      console.error('发送验证码失败，错误码:', result.code, '错误信息:', result.message);
      return;
    }

    // 发送成功（code为200），不显示弱提醒，直接开始倒计时
    let countdown = 60;
    sendBtn.textContent = `${countdown}秒后重试`;

    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        sendBtn.textContent = `${countdown}秒后重试`;
      } else {
        clearInterval(timer);
        sendBtn.disabled = false;
        sendBtn.textContent = '立即发送';
      }
    }, 1000);
  } catch (error) {
    // 网络错误或其他错误
    sendBtn.disabled = false;
    sendBtn.textContent = '立即发送';
    console.error('发送验证码错误:', error);
    
    // 更详细的错误提示
    let errorMsg = '网络错误，请检查网络连接后重试';
    if (error.message) {
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMsg = '跨域请求失败！\n\n解决方案：\n1. 确保通过HTTP服务器访问页面（不是直接打开文件）\n2. 联系后端开发人员配置CORS：\n   Access-Control-Allow-Origin: *\n   Access-Control-Allow-Methods: POST, OPTIONS\n   Access-Control-Allow-Headers: Content-Type';
      } else {
        errorMsg = `请求失败: ${error.message}`;
      }
    }
    
    toast.error(errorMsg, '发送失败');
  }
}

// 手机号登录：发送验证码按钮
const sendCodeBtn = document.querySelector('#phone-form .send-code-btn');
if (sendCodeBtn) {
  sendCodeBtn.addEventListener('click', () => {
    const phoneInput = document.getElementById('phone');
    sendVerificationCode(phoneInput, sendCodeBtn, 1);
  });
}

// 邮箱登录：发送验证码按钮
const sendEmailCodeBtn = document.getElementById('send-email-code-btn');
if (sendEmailCodeBtn) {
  sendEmailCodeBtn.addEventListener('click', () => {
    const emailInput = document.getElementById('email');
    sendVerificationCode(emailInput, sendEmailCodeBtn, 2);
  });
}

// 表单提交处理
phoneForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const code = document.getElementById('code').value.trim();
  
  // 表单验证
  if (!phone) {
    toast.warning('请输入手机号', '输入提示');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    toast.error('请输入正确的手机号', '输入错误');
    return;
  }

  if (!code) {
    toast.warning('请输入验证码', '输入提示');
    return;
  }

  if (!/^\d{4,6}$/.test(code)) {
    toast.error('验证码格式不正确', '输入错误');
    return;
  }

  // 调用登录接口
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include', // 允许发送和接收cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: phone,
        code: code
      })
    });

    // 检查响应状态
    if (!response.ok) {
      let errorMsg = '登录失败，请稍后重试';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.msg || `登录失败 (${response.status})`;
      } catch (e) {
        if (response.status === 401) {
          errorMsg = '验证码错误或已过期，请重新获取';
        } else if (response.status === 403) {
          errorMsg = '请求被拒绝，可能是CORS配置问题';
        } else {
          errorMsg = `登录失败 (状态码: ${response.status})`;
        }
      }
      toast.error(errorMsg, '登录失败');
      console.error('登录API响应错误:', response.status, response.statusText);
      return;
    }

    // 解析响应数据
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn('响应不是JSON格式:', e);
      data = {};
    }

    // 输出完整的响应数据到控制台，方便调试
    console.log('登录接口返回数据:', data);
    console.log('响应状态码:', response.status);
    console.log('响应头信息:', Object.fromEntries(response.headers.entries()));
    
    // 检查Set-Cookie头
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('✅ Set-Cookie头:', setCookieHeader);
    } else {
      console.warn('⚠️ 警告：响应中没有Set-Cookie头，cookie可能无法保存');
    }
    
    // 检查当前页面的cookie
    console.log('当前页面所有cookie:', document.cookie || '(无cookie)');
    
    // 处理API返回的数据（登录接口使用严格模式：需要同时判断code和message）
    const result = handleApiResponse(data, { strict: true });
    
    if (result.isSuccess) {
      // 登录成功：code为200且message为"操作成功"，不显示弱提醒
      console.log('登录成功，返回数据:', data);
      
      // 保存用户信息到localStorage（可选，根据实际需求）
      if (result.data) {
        try {
          localStorage.setItem('userInfo', JSON.stringify(result.data));
          localStorage.setItem('userId', result.data.userId);
          localStorage.setItem('account', result.data.account);
          console.log('用户信息已保存:', result.data);
        } catch (e) {
          console.warn('保存用户信息失败:', e);
        }
      }
      
      // 延迟检查cookie（给浏览器时间保存）
      setTimeout(() => {
        console.log('登录后检查cookie:', document.cookie || '(仍然无cookie)');
        if (!document.cookie) {
          console.error('❌ Cookie未保存！可能的原因：');
          console.error('1. 后端Set-Cookie的Domain不匹配（后端是192.168.2.31:8080，前端是127.0.0.1:5500）');
          console.error('2. SameSite属性限制');
          console.error('3. 请检查Network标签中的响应头，查看Set-Cookie的完整信息');
        }
      }, 100);
      
      // 登录成功后跳转到任务中心
      setTimeout(() => {
        window.location.href = 'task-center.html';
      }, 1500);
    } else {
      // 登录失败，显示错误提示
      toast.error(result.message, '登录失败');
      console.error('登录失败，错误码:', result.code, '错误信息:', result.message);
    }
    
  } catch (error) {
    console.error('登录错误:', error);
    
    let errorMsg = '网络错误，请检查网络连接后重试';
    if (error.message) {
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMsg = '跨域请求失败！\n\n解决方案：\n1. 确保通过HTTP服务器访问页面（不是直接打开文件）\n2. 联系后端开发人员配置CORS';
      } else {
        errorMsg = `请求失败: ${error.message}`;
      }
    }
    
    toast.error(errorMsg, '登录失败');
  }
});

// 邮箱登录表单提交处理（使用验证码登录）
emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const code = document.getElementById('email-code').value.trim();
  
  // 表单验证
  if (!email) {
    toast.warning('请输入邮箱', '输入提示');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error('请输入正确的邮箱地址', '输入错误');
    return;
  }

  if (!code) {
    toast.warning('请输入验证码', '输入提示');
    return;
  }

  if (!/^\d{4,6}$/.test(code)) {
    toast.error('验证码格式不正确', '输入错误');
    return;
  }

  // 调用登录接口
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include', // 允许发送和接收cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: email,
        code: code
      })
    });

    // 检查响应状态
    if (!response.ok) {
      let errorMsg = '登录失败，请稍后重试';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.msg || `登录失败 (${response.status})`;
      } catch (e) {
        if (response.status === 401) {
          errorMsg = '验证码错误或已过期，请重新获取';
        } else if (response.status === 403) {
          errorMsg = '请求被拒绝，可能是CORS配置问题';
        } else {
          errorMsg = `登录失败 (状态码: ${response.status})`;
        }
      }
      toast.error(errorMsg, '登录失败');
      console.error('登录API响应错误:', response.status, response.statusText);
      return;
    }

    // 解析响应数据
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn('响应不是JSON格式:', e);
      data = {};
    }

    // 输出完整的响应数据到控制台，方便调试
    console.log('登录接口返回数据:', data);
    console.log('响应状态码:', response.status);
    
    // 处理API返回的数据（登录接口使用严格模式：需要同时判断code和message）
    const result = handleApiResponse(data, { strict: true });
    
    if (result.isSuccess) {
      // 登录成功：code为200且message为"操作成功"，不显示弱提醒
      console.log('登录成功，返回数据:', data);
      
      // 保存用户信息到localStorage
      if (result.data) {
        try {
          localStorage.setItem('userInfo', JSON.stringify(result.data));
          localStorage.setItem('userId', result.data.userId);
          localStorage.setItem('account', result.data.account);
          console.log('用户信息已保存:', result.data);
        } catch (e) {
          console.warn('保存用户信息失败:', e);
        }
      }
      
      // 登录成功后跳转到任务中心
      setTimeout(() => {
        window.location.href = 'task-center.html';
      }, 1500);
    } else {
      // 登录失败，显示错误提示
      toast.error(result.message, '登录失败');
      console.error('登录失败，错误码:', result.code, '错误信息:', result.message);
    }
    
  } catch (error) {
    console.error('登录错误:', error);
    
    let errorMsg = '网络错误，请检查网络连接后重试';
    if (error.message) {
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMsg = '跨域请求失败！\n\n解决方案：\n1. 确保通过HTTP服务器访问页面（不是直接打开文件）\n2. 联系后端开发人员配置CORS';
      } else {
        errorMsg = `请求失败: ${error.message}`;
      }
    }
    
    toast.error(errorMsg, '登录失败');
  }
});

