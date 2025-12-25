// 页面初始化脚本
// 用于所有需要登录的页面（任务中心、充值、我的任务等）

/**
 * 初始化页面（检查登录状态、加载用户信息和积分）
 */
async function initPage() {
  // 检查是否在需要登录的页面
  const needLoginPages = ['task-center.html', 'task-article.html', 'task-paragraph.html', 'task-payment.html', 'my-task.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (!needLoginPages.includes(currentPage)) {
    return; // 不是需要登录的页面，直接返回
  }
  
  // 检查本地登录状态
  const hasLocalSession = isLoggedIn();
  
  if (!hasLocalSession) {
    // 本地没有登录信息，直接跳转登录页
    showLoginExpired();
    return;
  }
  
  // 有本地登录信息，尝试加载用户资料（会自动验证服务端登录状态）
  await loadUserProfile();
}

/**
 * 加载用户资料（包含用户信息和积分余额）
 */
async function loadUserProfile() {
  try {
    const result = await getUserProfile();
    
    if (!result.success) {
      // 获取用户资料失败
      console.error('获取用户资料失败:', result.message);
      
      // 如果是未登录错误（10003），先尝试使用本地缓存，避免频繁跳转
      if (result.code === 10003) {
        const localAccount = localStorage.getItem('account');
        
        // 如果有本地缓存，先使用本地信息，不立即跳转
        // 只在用户尝试进行需要登录的操作时才提示登录过期
        if (localAccount) {
          console.warn('服务端登录状态已过期，但保留本地会话信息，允许用户继续浏览');
          updateUserDisplay(localAccount);
          updatePointsDisplay(0);
          // 设置一个标记，表示登录可能已过期
          sessionStorage.setItem('loginWarning', 'true');
          return;
        }
        
        // 没有本地缓存，才跳转到登录页
        showLoginExpired();
        return;
      }
      
      // 其他错误，使用本地缓存的用户信息
      const localAccount = localStorage.getItem('account');
      if (localAccount) {
        updateUserDisplay(localAccount);
      }
      updatePointsDisplay(0);
      return;
    }
    
    // 成功获取用户资料，清除登录警告标记
    sessionStorage.removeItem('loginWarning');
    
    // 成功获取用户资料
    const profileData = result.data;
    
    if (profileData) {
      // 处理用户信息
      if (profileData.userInfo) {
        const userInfo = profileData.userInfo;
        
        // 更新本地缓存
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        if (userInfo.userId) {
          localStorage.setItem('userId', userInfo.userId);
        }
        
        // 使用 account 字段作为显示内容
        const displayAccount = userInfo.account || '用户';
        localStorage.setItem('account', displayAccount);
        
        // 更新页面显示
        updateUserDisplay(displayAccount);
      }
      
      // 处理积分余额
      if (profileData.pointsBalance) {
        const availablePoints = profileData.pointsBalance.availablePoints || 0;
        updatePointsDisplay(availablePoints);
      }
    }
    
  } catch (error) {
    console.error('加载用户资料错误:', error);
    
    // 网络错误时，使用本地缓存，不跳转登录页
    const localAccount = localStorage.getItem('account');
    if (localAccount) {
      console.warn('网络错误，使用本地缓存信息');
      updateUserDisplay(localAccount);
    }
    updatePointsDisplay(0);
  }
}

/**
 * 加载用户信息并更新页面显示（保留旧方法，用于兼容）
 */
async function loadUserInfo() {
  await loadUserProfile();
}

/**
 * 更新页面上的用户显示
 * @param {string} account - 用户账号/昵称
 */
function updateUserDisplay(account) {
  // 格式化显示
  const display = formatAccountDisplay(account);
  
  // 更新头像
  const avatarEl = document.querySelector('.user-avatar');
  if (avatarEl) {
    avatarEl.textContent = display.avatar;
  }
  
  // 更新用户名
  const nameEl = document.querySelector('.user-name');
  if (nameEl) {
    nameEl.textContent = display.name;
  }
}

/**
 * 格式化账号显示
 * @param {string} account - 账号
 * @returns {Object} {avatar: string, name: string}
 */
function formatAccountDisplay(account) {
  if (!account) return { avatar: 'U', name: '用户' };
  
  let name;
  let avatar;
  
  // 判断是否是手机号（11位数字）
  if (/^\d{11}$/.test(account)) {
    // 手机号：显示为 182****5812
    name = account.substring(0, 3) + '****' + account.substring(7);
    avatar = account.charAt(0);
  } 
  // 判断是否是邮箱
  else if (account.includes('@')) {
    // 邮箱：显示 @ 符号前的部分
    const emailName = account.split('@')[0];
    if (emailName.length <= 8) {
      name = emailName;
    } else {
      name = emailName.substring(0, 6) + '...';
    }
    avatar = emailName.charAt(0).toUpperCase();
  }
  // 普通用户名/昵称
  else {
    if (account.length <= 8) {
      name = account;
    } else {
      name = account.substring(0, 6) + '...';
    }
    avatar = account.charAt(0);
    if (/[a-zA-Z]/.test(avatar)) {
      avatar = avatar.toUpperCase();
    }
  }
  
  return { avatar, name };
}

/**
 * 加载积分余额并更新页面显示
 */
async function loadPointsBalance() {
  try {
    const result = await getPointsBalance();
    
    if (!result.success) {
      console.error('获取积分余额失败:', result.message);
      
      // 如果是未登录错误，跳转到登录页
      if (result.code === 10003) {
        showLoginExpired();
        return;
      }
      
      // 其他错误，显示默认值
      updatePointsDisplay(0);
      return;
    }
    
    // 成功获取积分
    const pointsData = result.data;
    const availablePoints = pointsData ? pointsData.availablePoints : 0;
    
    // 更新页面显示
    updatePointsDisplay(availablePoints);
    
  } catch (error) {
    console.error('加载积分余额错误:', error);
    updatePointsDisplay(0);
  }
}

/**
 * 更新页面上的积分显示
 * @param {number} points - 积分值
 */
function updatePointsDisplay(points) {
  const pointsEl = document.querySelector('.points-value');
  if (pointsEl) {
    // 格式化积分显示（千位分隔符）
    pointsEl.textContent = formatPoints(points);
  }
}

/**
 * 格式化积分显示
 * @param {number} points - 积分值
 * @returns {string} 格式化后的积分字符串
 */
function formatPoints(points) {
  if (points === null || points === undefined) return '0';
  
  // 添加千位分隔符
  return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 刷新积分余额（用于支付成功后刷新）
 */
async function refreshPoints() {
  await loadUserProfile();
}

/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  await loadUserProfile();
}

/**
 * 检查并确保用户已登录（用于执行需要登录的操作前）
 * 如果登录已过期，提示用户重新登录
 * @returns {Promise<boolean>} 返回是否已登录
 */
async function ensureLoggedIn() {
  // 检查本地登录状态
  if (!isLoggedIn()) {
    showLoginExpired();
    return false;
  }
  
  // 如果有登录警告标记，说明之前检测到登录可能已过期
  if (sessionStorage.getItem('loginWarning') === 'true') {
    // 尝试重新获取用户信息，验证登录状态
    const result = await getUserProfile();
    
    if (!result.success && result.code === 10003) {
      // 确认登录已过期
      showLoginExpired();
      return false;
    }
    
    // 登录仍然有效，清除警告标记
    sessionStorage.removeItem('loginWarning');
  }
  
  return true;
}

// 页面加载时自动初始化
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

// 处理浏览器前进/后退缓存（BFCache）
// 当用户使用后退按钮时，不重新检查登录状态，直接使用缓存的页面
window.addEventListener('pageshow', (event) => {
  // 如果页面是从缓存中恢复的（用户点击了后退/前进按钮）
  if (event.persisted) {
    console.log('页面从缓存恢复，跳过登录检查');
    // 只刷新用户信息和积分显示，不重新检查登录状态
    const account = localStorage.getItem('account');
    if (account) {
      updateUserDisplay(account);
      // 异步刷新积分，但不做登录检查
      loadUserProfile().catch(err => {
        console.warn('刷新用户信息失败:', err);
      });
    }
  }
});

