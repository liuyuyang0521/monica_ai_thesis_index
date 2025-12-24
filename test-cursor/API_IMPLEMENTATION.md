# API功能实现说明

## 概述

根据提供的HTTP接口文档，已完成前端页面与后端API的集成，实现了以下核心功能：

1. 用户登录与会话管理
2. 用户信息与积分查询
3. 论文写作订单提交
4. 文章降重订单提交
5. 段落降重订单提交
6. 在线充值支付
7. 任务列表查询与管理
8. 登出功能

---

## 文件结构

### 新增的核心文件

```
test-cursor/
├── api.js                  # 统一的API配置和工具函数
├── page-init.js            # 页面初始化脚本（用户信息、积分加载）
├── task-center.js          # 论文写作订单提交逻辑
├── task-article.js         # 文章降重订单提交逻辑
├── task-paragraph.js       # 段落降重订单提交逻辑
├── task-payment.js         # 充值支付功能
├── my-task.js              # 任务列表查询和管理
└── API_IMPLEMENTATION.md   # 本文档
```

### 修改的文件

- `login.js` - 保持原有登录功能
- `task.js` - 增强登出功能
- `toast.js` - 增加info方法和自动关闭功能
- `script.js` - 保持原有功能
- 所有HTML文件 - 引入新的JS文件

---

## 功能详解

### 1. 统一API配置 (api.js)

**核心功能：**
- 统一的API请求封装（`apiRequest`函数）
- 自动处理跨域、Cookie、错误码
- 提供所有模块的API方法

**主要API方法：**

#### 用户相关
```javascript
await getUserInfo()        // 获取当前用户信息
await logout()             // 登出
```

#### 积分相关
```javascript
await getPointsBalance()   // 查询积分余额
```

#### 支付相关
```javascript
await createRecharge(amount)           // 创建充值订单
await getPaymentStatus(paymentNo)      // 查询支付状态
await cancelPayment(paymentNo)         // 取消支付
```

#### 订单相关
```javascript
await createOrder(orderData)           // 创建订单
await getOrder(orderNo)                // 查询订单
await cancelOrder(orderNo)             // 取消订单
```

#### AI任务相关
```javascript
await getTaskById(taskId)              // 根据任务ID查询
await getTaskByOrderNo(orderNo)        // 根据订单号查询
```

---

### 2. 页面初始化 (page-init.js)

**功能：**
- 页面加载时自动检查登录状态
- 加载并显示用户信息（头像、昵称）
- 加载并显示积分余额
- 提供刷新功能（支付成功后刷新积分）

**使用方式：**
在HTML中引入即可，无需手动调用：
```html
<script src="page-init.js"></script>
```

页面加载时会自动：
1. 检查是否需要登录
2. 从后端获取用户信息
3. 显示用户名和头像
4. 显示积分余额

---

### 3. 论文写作订单提交 (task-center.js)

**页面：** task-center.html

**功能：**
- 表单验证（标题、领域、字数、数据状态、引文格式、交付类型、写作要求）
- 调用`/api/order/create`接口创建订单
- 创建成功后添加到任务列表缓存
- 跳转到"我的任务"页面

**订单数据格式：**
```javascript
{
  title: "论文标题",
  field: "专业领域",
  targetWords: 8000,
  dataStatus: "不需要",
  citationFormat: "GBT7714",
  deliveryTypes: ["论文", "数据文件"],
  writingRequirements: "写作要求...",
  specialRequirements: "",
  files: [...],
  orderType: 1  // 1-论文写作
}
```

---

### 4. 文章降重订单提交 (task-article.js)

**页面：** task-article.html

**功能：**
- 文件选择和验证（大小不超过20MB）
- 显示已选择的文件名
- 调用`/api/order/create`接口创建订单
- 创建成功后跳转到"我的任务"

**注意：**
- 当前版本未实现文件上传到服务器
- 实际使用时需要先上传文件获取URL，再提交订单

---

### 5. 段落降重订单提交 (task-paragraph.js)

**页面：** task-paragraph.html

**功能：**
- 输入段落内容验证（长度10-2000字符）
- 调用`/api/order/create`接口创建订单
- 创建成功后开始轮询任务状态
- 处理完成后显示结果

**轮询机制：**
- 每5秒查询一次任务状态
- 最多轮询60次（5分钟）
- 根据状态更新按钮文本

---

### 6. 充值支付功能 (task-payment.js)

**页面：** task-payment.html

**功能：**
- 充值金额验证（最少1元，最多10000元）
- 调用`/api/payment/recharge/pc`接口创建支付订单
- 在新窗口打开支付宝收银台
- 自动轮询支付状态（每5秒一次，最多10分钟）
- 支付成功后自动刷新积分

**支付流程：**
1. 用户输入充值金额
2. 点击"支付宝支付"按钮
3. 创建支付订单
4. 弹窗显示订单信息
5. 打开支付宝收银台
6. 后台轮询支付状态
7. 支付成功后刷新积分

---

### 7. 任务列表管理 (my-task.js)

**页面：** my-task.html

**功能：**
- 从本地缓存加载任务列表
- 自动查询每个任务的最新状态
- 显示任务进度（进度条）
- 提供删除和下载功能

**任务数据结构：**
```javascript
{
  orderNo: "订单号",
  orderType: 1,        // 1-论文写作 2-文章降重 3-段落降重
  title: "任务标题",
  status: 0,           // 0-待处理 1-处理中 2-已完成 3-失败
  progress: 10,        // 进度百分比
  createTime: "2025-12-24T10:00:00",
  fileUrl: "文件URL"
}
```

**本地缓存：**
- 使用localStorage存储任务列表（key: `myTasks`）
- 创建订单成功后自动添加
- 删除任务时从缓存移除

**注意：**
- 接口文档中没有"获取用户所有任务"的接口
- 当前使用本地缓存管理任务列表
- 建议后端提供统一的任务列表查询接口

---

### 8. 登出功能 (task.js)

**触发位置：** 所有任务页面的"切换"按钮

**功能：**
- 调用`/api/user/logout`接口
- 清除本地缓存（用户信息、积分、任务列表）
- 清除Session和Cookie
- 跳转到登录页

**实现方式：**
```javascript
async function handleLogout() {
  // 调用登出API
  await logout();
  
  // 清除本地缓存
  localStorage.removeItem('userInfo');
  localStorage.removeItem('userId');
  localStorage.removeItem('account');
  localStorage.removeItem('myTasks');
  
  // 跳转到登录页
  window.location.href = 'login.html';
}
```

---

## 使用指南

### 1. 页面引入顺序

所有需要登录的页面（task-center, task-article, task-paragraph, task-payment, my-task）都需要按以下顺序引入JS文件：

```html
<!-- 提示弹框 -->
<script src="toast.js"></script>

<!-- API工具（必须第一个） -->
<script src="api.js"></script>

<!-- 页面初始化（加载用户信息和积分） -->
<script src="page-init.js"></script>

<!-- 任务缓存管理（如果需要使用addTaskToCache函数） -->
<script src="my-task.js"></script>

<!-- 通用任务页面脚本 -->
<script src="task.js"></script>

<!-- 页面专用脚本 -->
<script src="task-center.js"></script>
```

### 2. API配置

在`api.js`中配置后端地址：

```javascript
const API_BASE_URL = isProxyServer
  ? '/api'  // 代理服务器
  : 'http://192.168.2.31:8080/api';  // 直接访问后端
```

### 3. 跨域问题

**方案1：使用代理服务器**
```bash
node proxy-server.js
```
然后访问 `http://localhost:3000/login.html`

**方案2：后端配置CORS**
后端需要配置以下响应头：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true
```

### 4. 测试流程

1. **登录**
   - 访问 `login.html`
   - 输入手机号或邮箱
   - 发送验证码
   - 输入验证码登录

2. **查看用户信息和积分**
   - 登录成功后自动跳转到任务中心
   - 页面顶部显示用户名和积分

3. **创建论文写作订单**
   - 在task-center.html填写表单
   - 点击"提交任务"
   - 成功后跳转到"我的任务"

4. **充值**
   - 访问task-payment.html
   - 输入充值金额
   - 点击支付宝图标
   - 在新窗口完成支付
   - 支付成功后积分自动更新

5. **查看任务列表**
   - 访问my-task.html
   - 查看所有任务的进度
   - 任务完成后可以下载

---

## 待完善功能

### 1. 文件上传

当前版本中，文件上传功能仅实现了前端选择文件，未实现上传到服务器。

**需要完善：**
- 实现文件上传到服务器的接口
- 获取上传后的文件URL
- 在创建订单时传递真实的文件URL

**建议实现：**
```javascript
// 上传文件到服务器
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/file/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  const result = await response.json();
  return result.data.fileUrl;
}
```

### 2. 任务列表查询接口

当前版本使用本地缓存管理任务列表，不够可靠。

**建议后端提供接口：**
```
GET /api/order/list
返回：
{
  code: 200,
  message: "操作成功",
  data: {
    total: 10,
    list: [
      {
        orderNo: "...",
        title: "...",
        orderType: 1,
        status: 0,
        createTime: "...",
        ...
      }
    ]
  }
}
```

### 3. 实时任务状态推送

当前使用轮询机制查询任务状态，效率较低。

**建议改进：**
- 使用WebSocket实现实时推送
- 或使用Server-Sent Events (SSE)

### 4. 支付结果通知

当前支付完成后需要等待轮询检测，用户体验不佳。

**建议改进：**
- 支付成功后通过回调页面通知前端
- 或使用WebSocket实时推送支付结果

---

## 错误处理

所有API调用都通过统一的`apiRequest`函数处理，会自动：

1. **处理HTTP错误**（404, 500等）
2. **处理业务错误**（根据错误码显示对应提示）
3. **处理网络错误**（超时、断网等）
4. **处理未登录错误**（自动跳转到登录页）

**错误码映射：**
```javascript
10003: '未登录或登录已过期'  // 自动跳转登录页
31001: '积分不足'            // 提示用户充值
41006: '订单创建失败'         // 显示错误信息
...
```

---

## 注意事项

1. **Session管理**
   - 所有API请求都包含`credentials: 'include'`
   - 自动发送和接收Cookie
   - 后端需要支持Session

2. **本地缓存**
   - 用户信息存储在`localStorage`
   - 任务列表存储在`localStorage`
   - 登出时清除所有缓存

3. **跨域问题**
   - 确保后端配置了CORS
   - 或使用代理服务器

4. **文件大小限制**
   - 单个文件最大20MB
   - 前端和后端都需要验证

5. **积分计算**
   - 1元 = 1积分
   - 充值成功后自动写入积分账户

---

## 联系方式

如有问题或建议，请联系开发团队。

