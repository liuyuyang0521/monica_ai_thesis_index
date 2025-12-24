# Cookie跨域问题修复说明

## 问题描述

`LoginContextHolder.getUserId()` 返回null的问题根本原因是**Cookie跨域传递失败**。

### 问题详情

1. **前端直接访问后端API** (`http://47.243.255.193:8080`)，属于跨域请求
2. **代理服务器未正确转发Cookie**：
   - 没有转发前端的Cookie到后端
   - 没有转发后端的Set-Cookie响应头到前端
3. **CORS配置不完整**：缺少 `Access-Control-Allow-Credentials: true`

导致登录后，SESSION_ID Cookie无法在前后端之间传递，后续请求无法获取用户信息。

## 解决方案

### 1. 修复代理服务器 (proxy-server.js)

**修改内容：**
- ✅ 添加 `Access-Control-Allow-Credentials: true` 允许携带Cookie
- ✅ 转发前端请求的Cookie到后端 (`headers['Cookie']`)
- ✅ 转发后端响应的Set-Cookie到前端 (`headers['Set-Cookie']`)
- ✅ 修改CORS策略从 `*` 到具体域名 `http://localhost:3000`（使用 `*` 时不能携带Cookie）

**关键代码：**
```javascript
// 转发Cookie到后端
if (req.headers.cookie) {
  headers['Cookie'] = req.headers.cookie;
}

// 转发Set-Cookie头到前端
if (proxyRes.headers['set-cookie']) {
  responseHeaders['Set-Cookie'] = proxyRes.headers['set-cookie'];
}

// 允许携带Cookie的CORS配置
'Access-Control-Allow-Origin': 'http://localhost:3000',
'Access-Control-Allow-Credentials': 'true'
```

### 2. 修改前端配置 (api.js & login.js)

**修改内容：**
- ✅ 将 `API_BASE_URL` 从 `http://47.243.255.193:8080/api` 改为 `http://localhost:3000/api`
- ✅ 确保所有请求都带上 `credentials: 'include'`（已经存在）

## 使用方法

### 启动步骤

1. **启动后端服务**（确保运行在 `http://47.243.255.193:8080`）

2. **启动代理服务器**
   ```bash
   cd monica_ai_thesis_index/test-cursor
   node proxy-server.js
   ```
   输出：
   ```
   代理服务器运行在 http://localhost:3000
   访问登录页面: http://localhost:3000/login.html
   ```

3. **访问前端页面**
   - ⚠️ **必须通过代理服务器访问**：`http://localhost:3000/login.html`
   - ❌ **不要直接打开HTML文件**（会导致跨域问题）

### 验证方法

1. **打开浏览器开发者工具** (F12)

2. **登录测试**：
   - 输入手机号/邮箱
   - 发送验证码
   - 输入验证码并登录

3. **检查Console日志**：
   ```
   登录接口返回数据: {code: 200, message: "操作成功", data: {...}}
   ✅ Set-Cookie头: SESSION_ID=xxx; Path=/; Max-Age=7200; HttpOnly
   当前页面所有cookie: SESSION_ID=xxx
   ```

4. **检查Network标签**：
   - 查看登录请求的Response Headers，应该有 `Set-Cookie: SESSION_ID=xxx`
   - 查看后续API请求的Request Headers，应该有 `Cookie: SESSION_ID=xxx`

5. **检查Application标签**：
   - Cookies → `http://localhost:3000`
   - 应该看到 `SESSION_ID` Cookie

6. **测试需要登录的接口**：
   - 访问任务中心等页面
   - 检查Console，不应该有"未登录"错误
   - `LoginContextHolder.getUserId()` 应该正常返回用户ID

## 技术原理

### Cookie跨域限制

浏览器的同源策略（Same-Origin Policy）限制：
- 不同域名/端口的网站之间默认不能共享Cookie
- 跨域请求默认不会携带Cookie

### CORS与Cookie

要在跨域请求中传递Cookie，必须满足：
1. **后端**：设置 `Access-Control-Allow-Credentials: true`
2. **后端**：`Access-Control-Allow-Origin` 必须是具体域名，不能是 `*`
3. **前端**：请求时设置 `credentials: 'include'`

### 代理服务器的作用

通过Node.js代理服务器：
1. 前端通过 `http://localhost:3000` 访问（同域）
2. 代理服务器转发请求到 `http://47.243.255.193:8080`
3. Cookie在 `localhost:3000` 域下保存和传递
4. 避免了前后端跨域问题

## 文件修改清单

### 副本项目 (ai-thesis)
- ✅ `monica_ai_thesis_index/test-cursor/proxy-server.js` - 修复Cookie转发
- ✅ `monica_ai_thesis_index/test-cursor/api.js` - 改用代理地址
- ✅ `monica_ai_thesis_index/test-cursor/login.js` - 改用代理地址

### 真实项目 (Work)
- ✅ `D:\Work\monica_ai_thesis_index\test-cursor\proxy-server.js` - 修复Cookie转发
- ✅ `D:\Work\monica_ai_thesis_index\test-cursor\api.js` - 改用代理地址
- ✅ `D:\Work\monica_ai_thesis_index\test-cursor\login.js` - 改用代理地址

## 常见问题

### Q1: Cookie仍然没有被保存？
**排查步骤：**
1. 确认通过 `http://localhost:3000` 访问，不是直接打开HTML文件
2. 确认代理服务器正常运行
3. 检查浏览器Console是否有错误
4. 检查Network标签的Response Headers是否有 `Set-Cookie`

### Q2: 后续请求提示"未登录"？
**排查步骤：**
1. 检查Application → Cookies，确认SESSION_ID存在
2. 检查后续请求的Request Headers是否包含 `Cookie: SESSION_ID=xxx`
3. 确认所有API请求都使用了 `credentials: 'include'`
4. 检查后端Session是否过期（默认2小时）

### Q3: 生产环境如何部署？
**建议方案：**
1. **使用Nginx反向代理**，统一前后端域名
2. **或使用同一域名**的不同路径（如 `/api` 和 `/web`）
3. **启用HTTPS**，设置 `Secure` Cookie属性
4. **配置正确的Domain**，确保Cookie在子域名之间共享

## 补充说明

### 后端Cookie设置代码位置
```
monica_ai_thesis/thesis-users/src/main/java/com/example/users/service/impl/UserServiceImpl.java
方法：setSessionCookie(HttpServletResponse response, String sessionId)
```

当前配置：
```java
Cookie cookie = new Cookie(SessionConstant.SESSION_COOKIE_NAME, sessionId);
cookie.setHttpOnly(true);    // 防XSS
cookie.setPath("/");         // 全站有效
cookie.setMaxAge((int) SessionConstant.SESSION_EXPIRE_TIME);  // 2小时
// cookie.setSecure(true);   // 生产环境建议启用（需HTTPS）
```

### 拦截器配置位置
```
monica_ai_thesis/thesis-common/src/main/java/com/example/common/config/WebConfig.java
```

拦截所有 `/api/**` 请求，排除登录、验证码等接口。

## 参考资料

- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [SameSite Cookie 说明](https://web.dev/samesite-cookies-explained/)

