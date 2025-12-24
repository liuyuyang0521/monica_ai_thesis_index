// 简单的代理服务器，用于解决开发环境的CORS问题
// 使用方法: node proxy-server.js
// 然后访问: http://localhost:3000/login.html

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const API_BASE = 'http://47.243.255.193:8080';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 如果是API请求，转发到后端服务器
  if (parsedUrl.pathname.startsWith('/api/')) {
    console.log(`\n[代理] ${req.method} ${parsedUrl.pathname}`);
    
    // 准备请求头，确保转发Cookie
    const headers = {
      ...req.headers,
      'host': '47.243.255.193:8080' // 修正host头
    };
    
    // 删除可能导致问题的头
    delete headers['origin'];
    delete headers['referer'];
    
    // 转发Cookie到后端
    if (req.headers.cookie) {
      headers['cookie'] = req.headers.cookie;
      console.log(`[代理] 转发Cookie: ${req.headers.cookie.substring(0, 50)}...`);
    } else {
      console.log(`[代理] ⚠️ 警告：请求中没有Cookie！`);
    }
    
    const options = {
      hostname: '47.243.255.193',
      port: 8080,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: req.method,
      headers: headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      console.log(`[代理] 响应状态: ${proxyRes.statusCode}`);
      
      // 准备响应头
      const responseHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true', // 允许携带Cookie
        'Content-Type': proxyRes.headers['content-type'] || 'application/json'
      };
      
      // 转发Set-Cookie头（后端返回的Cookie）
      if (proxyRes.headers['set-cookie']) {
        responseHeaders['set-cookie'] = proxyRes.headers['set-cookie'];
        console.log(`[代理] 转发Set-Cookie: ${proxyRes.headers['set-cookie']}`);
      }
      
      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.error(`代理请求错误: ${e.message}`);
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: '代理服务器错误' }));
    });

    // 如果是POST/PUT等有body的请求，转发body
    if (req.method === 'POST' || req.method === 'PUT') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    
    return;
  }

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true' // 允许携带Cookie
    });
    res.end();
    return;
  }

  // 静态文件服务
  let filePath = '.' + parsedUrl.pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('文件未找到');
      } else {
        res.writeHead(500);
        res.end('服务器错误: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`✅ 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`✅ 访问登录页面: http://localhost:${PORT}/login.html`);
  console.log(`✅ API请求会自动代理到: ${API_BASE}`);
  console.log('========================================\n');
  console.log('💡 提示：Cookie转发日志会在下方显示');
  console.log('----------------------------------------\n');
});

