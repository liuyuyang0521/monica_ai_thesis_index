// 格式化账号显示
function formatAccountDisplay(account) {
  if (!account) return { avatar: 'U', name: '用户名' };
  
  // 用户名：显示前三位字符
  const name = account.length >= 3 ? account.substring(0, 3) : account;
  
  // 头像：显示第一位字符，如果是字母则大写
  let avatar = account.charAt(0);
  if (/[a-zA-Z]/.test(avatar)) {
    avatar = avatar.toUpperCase();
  }
  
  return { avatar, name };
}

// 更新任务栏显示（根据登录状态）
// 注意：index.html 页面始终显示未登录状态的任务栏，保持原有排版
function updateHeaderDisplay() {
  const headerNotLoggedIn = document.getElementById('header-not-logged-in');
  const headerLoggedIn = document.getElementById('header-logged-in');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  
  // 检查当前页面是否是 index.html
  const isIndexPage = window.location.pathname.includes('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/');
  
  // index.html 页面始终显示未登录状态的任务栏，保持原有排版
  if (isIndexPage) {
    if (headerNotLoggedIn) headerNotLoggedIn.style.display = 'block';
    if (headerLoggedIn) headerLoggedIn.style.display = 'none';
    return;
  }
  
  // 从localStorage读取用户信息
  const account = localStorage.getItem('account');
  const userInfo = localStorage.getItem('userInfo');
  
  if (account) {
    // 已登录：显示登录状态的任务栏（非 index.html 页面）
    if (headerNotLoggedIn) headerNotLoggedIn.style.display = 'none';
    if (headerLoggedIn) headerLoggedIn.style.display = 'block';
    
    // 更新用户名和头像
    const display = formatAccountDisplay(account);
    if (userAvatar) userAvatar.textContent = display.avatar;
    if (userName) userName.textContent = display.name;
  } else {
    // 未登录：显示未登录状态的任务栏
    if (headerNotLoggedIn) headerNotLoggedIn.style.display = 'block';
    if (headerLoggedIn) headerLoggedIn.style.display = 'none';
  }
}

// 判断是否已登录（以本地存储是否存在 account 为准）
function isLoggedIn() {
  return !!localStorage.getItem('account');
}

// 监听登录成功事件
window.addEventListener('userLoggedIn', (event) => {
  // 登录成功后更新任务栏（index.html 页面除外，保持未登录状态排版）
  const isIndexPage = window.location.pathname.includes('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/');
  if (!isIndexPage) {
    updateHeaderDisplay();
  }
});

// 按钮点击交互
document.addEventListener('DOMContentLoaded', () => {
  const isIndexPage = window.location.pathname.includes('index.html') ||
                      window.location.pathname === '/' ||
                      window.location.pathname.endsWith('/');

  // 页面加载时检查登录状态
  updateHeaderDisplay();
  // Banner「立即体验」按钮 → 跳转范文生成页
  const heroCtaBtn = document.querySelector('.hero-cta-btn');
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', () => {
      if (isLoggedIn()) {
        window.location.href = 'task-center.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  // 自动范文生成栏「查看详情」→ task-center.html
  const essayDetailBtn = document.querySelector('#section-essay .mega-orange-btn');
  if (essayDetailBtn) {
    essayDetailBtn.addEventListener('click', () => {
      if (isLoggedIn()) {
        window.location.href = 'task-center.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  // 文章降 AI / 降重板块「查看详情」→ task-article.html
  const articleDetailBtn = document.querySelector('#section-rewrite .feature-showcase-btn');
  if (articleDetailBtn) {
    articleDetailBtn.addEventListener('click', () => {
      if (isLoggedIn()) {
        window.location.href = 'task-article.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  // 自动 AI 降重栏「查看详情」→ task-paragraph.html
  const aiReduceDetailBtn = document.querySelector('#section-ai-reduce .mega-orange-btn');
  if (aiReduceDetailBtn) {
    aiReduceDetailBtn.addEventListener('click', () => {
      if (isLoggedIn()) {
        window.location.href = 'task-paragraph.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  // "登录"按钮
  const loginBtn = document.querySelector('.nav-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // 左上角「任务中心」按钮 → 跳转文章降重页（未登录状态）
  const taskCenterBtn = document.querySelector('#header-not-logged-in .logo-text');
  if (taskCenterBtn) {
    taskCenterBtn.addEventListener('click', () => {
      window.location.href = 'task-article.html';
    });
  }

  // 登录状态的任务栏按钮
  // 顶部「任务中心」按钮：区分首页未登录与其他页面
  const logoBtns = document.querySelectorAll('.logo-text');
  logoBtns.forEach(btn => {
    const isHeaderNotLogged = btn.closest('#header-not-logged-in');
    if (isIndexPage && isHeaderNotLogged) {
      // 首页未登录：跳转登录页
      btn.addEventListener('click', () => {
        window.location.href = 'login.html';
      });
    } else {
      // 其他页面或已登录：统一跳 task-center
      btn.addEventListener('click', () => {
        window.location.href = 'task-center.html';
      });
    }
  });

  // "主页"按钮
  const homeBtn = document.querySelector('.task-header-my');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // "立即充值"按钮
  const rechargeBtn = document.querySelector('.task-header-recharge');
  if (rechargeBtn) {
    rechargeBtn.addEventListener('click', () => {
      window.location.href = 'task-payment.html';
    });
  }

  // "我的任务"按钮（任务栏）
  const myTaskBtns = document.querySelectorAll('.task-header-task');
  if (myTaskBtns.length) {
    myTaskBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (isIndexPage && !isLoggedIn()) {
          window.location.href = 'login.html';
        } else {
          window.location.href = 'my-task.html';
        }
      });
    });
  }

  // "切换"按钮：清除登录信息并跳转到登录页面
  const toggleBtn = document.querySelector('.task-header-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      // 清除登录信息
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userId');
      localStorage.removeItem('account');
      // 跳转到登录页面
      window.location.href = 'login.html';
    });
  }

  // 三个蓝色功能块点击跳转
  const featureItems = document.querySelectorAll('.feature-strip-item');
  featureItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          // 平滑滚动到目标位置
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});

