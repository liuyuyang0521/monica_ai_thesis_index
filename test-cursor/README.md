# Monica AI Thesis Index

前端项目 - AI 赋能科研任务中心

## 项目简介

这是一个基于 AI 的学术研究辅助工具前端项目，提供以下功能：

- **AI 范文生成**：根据需求自动生成高质量范文
- **文章降重**：智能改写技术，降低 AI 检测率和重复率
- **段落降重**：适合处理较短段落，直接粘贴原文内容
- **在线充值**：支持支付宝在线支付充值积分

## 技术栈

- HTML5
- CSS3
- JavaScript (原生)
- 响应式设计

## 项目结构

```
.
├── index.html          # 首页
├── login.html          # 登录页面
├── task-center.html    # 范文生成页面
├── task-article.html   # 文章降重页面
├── task-paragraph.html # 段落降重页面
├── task-payment.html   # 在线充值页面
├── styles.css          # 全局样式
├── login.css           # 登录页样式
├── task.css            # 任务页样式
├── script.js           # 首页脚本
├── login.js            # 登录页脚本
├── task.js             # 任务页脚本
├── toast.js            # 提示框组件
├── proxy-server.js     # 开发环境代理服务器
└── images/             # 图片资源
```

## 开发环境设置

### 使用代理服务器（推荐，解决 CORS 问题）

1. 启动代理服务器：
   ```bash
   node proxy-server.js
   ```

2. 访问页面：
   ```
   http://localhost:3000/login.html
   ```

### 使用 Live Server

1. 在 VS Code 中安装 Live Server 插件
2. 右键点击 HTML 文件，选择 "Open with Live Server"
3. 访问页面（通常是 `http://127.0.0.1:5500`）

## API 配置

项目中的 API 请求会自动根据访问端口选择：

- **代理服务器（端口 3000）**：通过代理转发，自动处理 CORS
- **Live Server（其他端口）**：直接访问后端 API

后端 API 地址：`http://192.168.2.31:8080/api`

## 功能说明

### 登录功能

- 支持手机号和邮箱两种登录方式
- 验证码登录
- 自动保存用户信息到 localStorage
- Cookie/Session 认证支持

### 错误码处理

项目包含完整的错误码映射表，支持后端返回的所有错误码：

- 系统级错误（1xxxx）
- 用户模块（11xxx）
- 验证码模块（12xxx）
- Token 模块（13xxx）
- 其他业务模块...

## 浏览器支持

- Chrome（推荐）
- Firefox
- Edge
- Safari

## 注意事项

1. 开发环境建议使用代理服务器，避免 CORS 跨域问题
2. 登录功能需要后端 API 支持
3. Cookie 保存需要前后端在同一域名下，或后端正确配置 CORS

## License

Copyright © 2025 AIWhim. All rights reserved.

