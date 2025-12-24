# API 优化更新说明

## 更新日期
2025-12-24

---

## 🎯 优化内容

### 接口合并优化

**优化前：** 页面初始化时需要调用两个接口
```javascript
// 调用两次接口
await getUserInfo();        // GET /api/user/info
await getPointsBalance();   // GET /api/points/balance
```

**优化后：** 合并为一个接口
```javascript
// 只调用一次接口
await getUserProfile();     // GET /api/user/profile
```

**优势：**
- ✅ 减少 HTTP 请求次数（从2次减少到1次）
- ✅ 降低服务器负载
- ✅ 提升页面加载速度
- ✅ 减少网络延迟

---

## 📡 新接口说明

### GET /api/user/profile

**用途：** 获取用户资料（包含用户信息和积分余额）

**请求方式：** GET

**是否需要登录：** ✅ 是

**请求示例：**
```javascript
GET http://47.243.255.193:8080/api/user/profile
Headers:
  Cookie: SESSION_ID=xxx
```

**返回参数：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "userInfo": {
      "userId": 1,
      "account": "18281235812"
    },
    "pointsBalance": {
      "userId": 1,
      "availablePoints": 1000,
      "frozenPoints": 50
    }
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.userInfo.userId` | Long | 用户ID |
| `data.userInfo.account` | String | 用户账号（手机号或邮箱） |
| `data.pointsBalance.userId` | Long | 用户ID |
| `data.pointsBalance.availablePoints` | Integer | 可用积分 |
| `data.pointsBalance.frozenPoints` | Integer | 冻结积分 |

---

## 🔄 前端代码变更

### 1. api.js 新增方法

```javascript
/**
 * 获取用户资料（包含用户信息和积分余额）
 * @returns {Promise<Object>}
 */
async function getUserProfile() {
  return await apiRequest('/user/profile', {
    method: 'GET'
  });
}
```

### 2. page-init.js 主要变更

**修改前：**
```javascript
async function initPage() {
  // ...
  await loadUserInfo();        // 调用第一个接口
  await loadPointsBalance();   // 调用第二个接口
}
```

**修改后：**
```javascript
async function initPage() {
  // ...
  await loadUserProfile();     // 只调用一个接口
}
```

**新增函数：**
```javascript
async function loadUserProfile() {
  const result = await getUserProfile();
  
  if (result.success) {
    const profileData = result.data;
    
    // 处理用户信息
    if (profileData.userInfo) {
      const displayAccount = profileData.userInfo.account || '用户';
      updateUserDisplay(displayAccount);
    }
    
    // 处理积分余额
    if (profileData.pointsBalance) {
      const availablePoints = profileData.pointsBalance.availablePoints || 0;
      updatePointsDisplay(availablePoints);
    }
  }
}
```

### 3. 用户显示优化

**account 字段格式化显示：**

| account 类型 | 显示效果 | 示例 |
|-------------|---------|------|
| 手机号（11位） | `182****5812` | `18281235812` → `182****5812` |
| 邮箱 | `user@...` | `user@example.com` → `user` |
| 普通用户名 | 完整或截断 | `张三` → `张三` |

**formatAccountDisplay 函数增强：**
```javascript
function formatAccountDisplay(account) {
  // 手机号：脱敏显示
  if (/^\d{11}$/.test(account)) {
    return {
      avatar: account.charAt(0),
      name: account.substring(0, 3) + '****' + account.substring(7)
    };
  }
  
  // 邮箱：显示 @ 前的部分
  if (account.includes('@')) {
    const emailName = account.split('@')[0];
    return {
      avatar: emailName.charAt(0).toUpperCase(),
      name: emailName.length <= 8 ? emailName : emailName.substring(0, 6) + '...'
    };
  }
  
  // 普通用户名
  return {
    avatar: account.charAt(0).toUpperCase(),
    name: account.length <= 8 ? account : account.substring(0, 6) + '...'
  };
}
```

---

## 📊 性能对比

### 请求次数对比

| 场景 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 页面初始化 | 2次请求 | 1次请求 | ⬇️ 50% |
| 刷新积分 | 1次请求 | 1次请求 | - |
| 刷新用户信息 | 1次请求 | 1次请求 | - |

### 页面加载时间（预估）

假设单次 API 请求耗时 100ms：

| 场景 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 初始化加载 | ~200ms（串行） | ~100ms | ⬇️ 100ms |
| 网络开销 | 2次握手 | 1次握手 | ⬇️ 50% |

---

## ✅ 兼容性说明

### 保留的旧方法

为了兼容性，以下方法仍然保留：

```javascript
// 旧方法（内部调用新方法）
async function loadUserInfo() {
  await loadUserProfile();
}

async function loadPointsBalance() {
  await loadUserProfile();
}

// 旧接口方法（如果其他地方还在用）
async function getUserInfo() {
  return await apiRequest('/user/info', { method: 'GET' });
}

async function getPointsBalance() {
  return await apiRequest('/points/balance', { method: 'GET' });
}
```

**说明：**
- ✅ 旧代码不需要修改，自动使用新接口
- ✅ 如果其他地方直接调用 `getUserInfo()` 或 `getPointsBalance()`，仍然可用
- ✅ 平滑过渡，无缝升级

---

## 🧪 测试清单

### 功能测试

- [ ] 页面初始化时正确显示用户账号
- [ ] 页面初始化时正确显示积分余额
- [ ] 手机号正确脱敏显示（182****5812）
- [ ] 邮箱正确显示（显示 @ 前的部分）
- [ ] 登录态过期时正确跳转到登录页
- [ ] 充值成功后积分正确刷新

### 性能测试

- [ ] Network 标签中确认只有1个 `/api/user/profile` 请求
- [ ] 页面加载速度对比（应该更快）

### 兼容性测试

- [ ] 所有任务页面正常显示
- [ ] 充值页面正常工作
- [ ] 我的任务页面正常工作

---

## 📝 使用示例

### 页面初始化

```javascript
// 自动调用，无需手动处理
document.addEventListener('DOMContentLoaded', () => {
  initPage();  // 自动调用 loadUserProfile()
});
```

### 手动刷新

```javascript
// 刷新用户信息和积分（例如充值成功后）
await refreshPoints();

// 或
await refreshUserInfo();

// 两者效果相同，都会调用 loadUserProfile()
```

### 直接调用新接口

```javascript
// 如果需要在其他地方直接调用
const result = await getUserProfile();

if (result.success) {
  const { userInfo, pointsBalance } = result.data;
  console.log('用户账号:', userInfo.account);
  console.log('可用积分:', pointsBalance.availablePoints);
}
```

---

## 🔄 迁移步骤（如果需要）

如果其他代码需要使用新接口：

### 步骤1：替换接口调用

```javascript
// 旧代码
const userInfo = await getUserInfo();
const points = await getPointsBalance();

// 新代码
const profile = await getUserProfile();
const userInfo = profile.data.userInfo;
const points = profile.data.pointsBalance;
```

### 步骤2：更新数据处理

```javascript
// 旧代码
const account = userInfo.data.phone || userInfo.data.email;

// 新代码
const account = profile.data.userInfo.account;  // 后端已处理
```

---

## 💡 注意事项

1. **account 字段来源**
   - 后端返回的 `account` 字段已经是用户的主要账号（手机号或邮箱）
   - 前端无需判断优先级，直接使用即可

2. **显示格式**
   - 手机号会自动脱敏显示（182****5812）
   - 邮箱会显示 @ 前的部分
   - 普通用户名完整显示或截断

3. **缓存处理**
   - 用户信息和积分会缓存到 localStorage
   - 刷新页面时先显示缓存，再更新最新数据

4. **错误处理**
   - 如果接口失败，会使用本地缓存
   - 如果是登录态失效（code: 10003），会跳转到登录页

---

## 📞 常见问题

### Q: 旧代码会不会失效？
A: 不会。旧方法内部调用新接口，完全兼容。

### Q: 如果后端没有部署新接口怎么办？
A: 保留了旧接口方法，可以回退使用。

### Q: 为什么手机号要脱敏？
A: 保护用户隐私，符合安全最佳实践。

### Q: 能否不脱敏显示完整手机号？
A: 可以修改 `formatAccountDisplay` 函数，去掉脱敏逻辑。

---

## 📅 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.1.0 | 2025-12-24 | 合并用户信息和积分查询接口 |
| v2.0.0 | 2025-12-24 | 完成所有功能实现 |
| v1.0.0 | 2025-12-20 | 初始版本 |

---

**最后更新：** 2025-12-24  
**更新人员：** AI Assistant

