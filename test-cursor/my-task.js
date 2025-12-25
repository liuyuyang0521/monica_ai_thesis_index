// my-task.html 专用脚本
// 处理任务列表查询和管理功能

document.addEventListener('DOMContentLoaded', () => {
  // 获取任务列表容器
  const tableWrapper = document.querySelector('.my-task-table-wrapper');
  
  // 初始化任务列表
  initTaskList();
  
  /**
   * 初始化任务列表
   */
  async function initTaskList() {
    // 检查并确保用户已登录（会验证服务端登录状态）
    if (!await ensureLoggedIn()) {
      return;
    }
    
    // 从本地缓存加载任务列表
    loadTasksFromCache();
    
    // 注意：由于接口文档中没有提供"获取用户所有任务"的接口
    // 这里使用本地缓存的方式来管理任务列表
    // 实际项目中应该有一个专门的任务列表查询接口
  }
  
  /**
   * 从本地缓存加载任务列表
   */
  function loadTasksFromCache() {
    // 从localStorage读取任务列表
    const tasksJson = localStorage.getItem('myTasks');
    
    if (!tasksJson) {
      // 没有任务，显示空状态
      showEmptyState();
      return;
    }
    
    try {
      const tasks = JSON.parse(tasksJson);
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        showEmptyState();
        return;
      }
      
      // 渲染任务列表
      renderTaskList(tasks);
      
      // 自动刷新任务状态（查询每个任务的最新状态）
      refreshTaskStatus(tasks);
      
    } catch (error) {
      console.error('解析任务列表失败:', error);
      showEmptyState();
    }
  }
  
  /**
   * 显示空状态
   */
  function showEmptyState() {
    // 清除现有行（保留表头）
    const rows = tableWrapper.querySelectorAll('.my-task-table-row:not(.my-task-table-header)');
    rows.forEach(row => row.remove());
    
    // 添加空状态提示
    const emptyRow = document.createElement('div');
    emptyRow.className = 'my-task-table-row';
    emptyRow.style.justifyContent = 'center';
    emptyRow.style.padding = '40px';
    emptyRow.innerHTML = `
      <div style="text-align: center; color: #999;">
        <p style="font-size: 16px; margin-bottom: 10px;">暂无任务记录</p>
        <p style="font-size: 14px;">去 <a href="task-center.html" style="color: #5F90F7;">任务中心</a> 创建新任务</p>
      </div>
    `;
    
    tableWrapper.appendChild(emptyRow);
  }
  
  /**
   * 渲染任务列表
   * @param {Array} tasks - 任务列表
   */
  function renderTaskList(tasks) {
    // 清除现有行（保留表头）
    const rows = tableWrapper.querySelectorAll('.my-task-table-row:not(.my-task-table-header)');
    rows.forEach(row => row.remove());
    
    // 按创建时间倒序排序
    tasks.sort((a, b) => {
      const timeA = new Date(a.createTime).getTime();
      const timeB = new Date(b.createTime).getTime();
      return timeB - timeA;
    });
    
    // 渲染每个任务
    tasks.forEach(task => {
      const row = createTaskRow(task);
      tableWrapper.appendChild(row);
    });
  }
  
  /**
   * 创建任务行
   * @param {Object} task - 任务数据
   * @returns {HTMLElement}
   */
  function createTaskRow(task) {
    const row = document.createElement('div');
    row.className = 'my-task-table-row';
    row.setAttribute('data-order-no', task.orderNo);
    
    // 创建时间
    const timeCol = document.createElement('div');
    timeCol.className = 'my-task-col my-task-col-time';
    timeCol.textContent = formatTime(task.createTime);
    
    // 功能类型
    const featureCol = document.createElement('div');
    featureCol.className = 'my-task-col my-task-col-feature';
    featureCol.textContent = getOrderTypeName(task.orderType);
    
    // 进度
    const progressCol = document.createElement('div');
    progressCol.className = 'my-task-col my-task-col-progress';
    
    const progressDiv = document.createElement('div');
    progressDiv.className = 'my-task-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'my-task-progress-bar';
    progressBar.style.width = `${task.progress || 0}%`;
    
    const progressText = document.createElement('span');
    progressText.className = 'my-task-progress-text';
    progressText.textContent = getTaskStatusText(task.status);
    
    progressDiv.appendChild(progressBar);
    progressDiv.appendChild(progressText);
    progressCol.appendChild(progressDiv);
    
    // 操作按钮
    const actionCol = document.createElement('div');
    actionCol.className = 'my-task-col my-task-col-action';
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn my-task-btn ghost';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => {
      handleDeleteTask(task.orderNo);
    });
    
    // 下载/查看按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn my-task-btn primary';
    
    if (task.status === 2) {
      // 已完成
      downloadBtn.textContent = '下载';
      downloadBtn.addEventListener('click', () => {
        handleDownloadTask(task);
      });
    } else if (task.status === 3) {
      // 失败
      downloadBtn.textContent = '失败';
      downloadBtn.className = 'btn my-task-btn disabled';
      downloadBtn.disabled = true;
    } else {
      // 处理中
      downloadBtn.textContent = '处理中';
      downloadBtn.className = 'btn my-task-btn disabled';
      downloadBtn.disabled = true;
    }
    
    actionCol.appendChild(deleteBtn);
    actionCol.appendChild(downloadBtn);
    
    // 组装行
    row.appendChild(timeCol);
    row.appendChild(featureCol);
    row.appendChild(progressCol);
    row.appendChild(actionCol);
    
    return row;
  }
  
  /**
   * 获取订单类型名称
   * @param {number} orderType - 订单类型
   * @returns {string}
   */
  function getOrderTypeName(orderType) {
    const typeMap = {
      1: '范文生成',
      2: '文章降重',
      3: '段落降重'
    };
    return typeMap[orderType] || '未知';
  }
  
  /**
   * 获取任务状态文本
   * @param {number} status - 任务状态
   * @returns {string}
   */
  function getTaskStatusText(status) {
    const statusMap = {
      0: '待处理',
      1: '处理中',
      2: '已完成',
      3: '失败'
    };
    return statusMap[status] || '未知';
  }
  
  /**
   * 刷新任务状态（查询最新状态）
   * @param {Array} tasks - 任务列表
   */
  async function refreshTaskStatus(tasks) {
    // 遍历每个任务，查询最新状态
    for (const task of tasks) {
      try {
        const result = await getTaskByOrderNo(task.orderNo);
        
        if (result.success && result.data) {
          const latestTask = result.data;
          
          // 更新任务状态
          task.status = latestTask.status;
          task.progress = calculateProgress(latestTask.status);
          task.fileUrl = latestTask.fileUrl;
          task.errorMsg = latestTask.errorMsg;
          
          // 更新本地缓存
          updateTaskInCache(task);
          
          // 更新页面显示
          updateTaskRow(task);
        }
        
      } catch (error) {
        console.error('刷新任务状态错误:', error);
      }
    }
  }
  
  /**
   * 计算进度百分比
   * @param {number} status - 任务状态
   * @returns {number}
   */
  function calculateProgress(status) {
    const progressMap = {
      0: 10,  // 待处理
      1: 50,  // 处理中
      2: 100, // 已完成
      3: 0    // 失败
    };
    return progressMap[status] || 0;
  }
  
  /**
   * 更新本地缓存中的任务
   * @param {Object} task - 任务数据
   */
  function updateTaskInCache(task) {
    const tasksJson = localStorage.getItem('myTasks');
    if (!tasksJson) return;
    
    try {
      const tasks = JSON.parse(tasksJson);
      const index = tasks.findIndex(t => t.orderNo === task.orderNo);
      
      if (index !== -1) {
        tasks[index] = task;
        localStorage.setItem('myTasks', JSON.stringify(tasks));
      }
      
    } catch (error) {
      console.error('更新任务缓存失败:', error);
    }
  }
  
  /**
   * 更新任务行显示
   * @param {Object} task - 任务数据
   */
  function updateTaskRow(task) {
    const row = tableWrapper.querySelector(`[data-order-no="${task.orderNo}"]`);
    if (!row) return;
    
    // 更新进度条
    const progressBar = row.querySelector('.my-task-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${task.progress}%`;
    }
    
    // 更新进度文本
    const progressText = row.querySelector('.my-task-progress-text');
    if (progressText) {
      progressText.textContent = getTaskStatusText(task.status);
    }
    
    // 更新下载按钮
    const downloadBtn = row.querySelectorAll('.my-task-btn')[1];
    if (downloadBtn) {
      if (task.status === 2) {
        downloadBtn.textContent = '下载';
        downloadBtn.className = 'btn my-task-btn primary';
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => handleDownloadTask(task);
      } else if (task.status === 3) {
        downloadBtn.textContent = '失败';
        downloadBtn.className = 'btn my-task-btn disabled';
        downloadBtn.disabled = true;
      } else {
        downloadBtn.textContent = '处理中';
        downloadBtn.className = 'btn my-task-btn disabled';
        downloadBtn.disabled = true;
      }
    }
  }
  
  /**
   * 处理删除任务
   * @param {string} orderNo - 订单号
   */
  function handleDeleteTask(orderNo) {
    toast.confirm(
      '确定要删除这个任务吗？\n删除后将无法恢复。',
      '确认删除',
      async () => {
        // 确认删除
        try {
          // 从本地缓存删除
          const tasksJson = localStorage.getItem('myTasks');
          if (tasksJson) {
            const tasks = JSON.parse(tasksJson);
            const newTasks = tasks.filter(t => t.orderNo !== orderNo);
            localStorage.setItem('myTasks', JSON.stringify(newTasks));
          }
          
          // 从页面删除
          const row = tableWrapper.querySelector(`[data-order-no="${orderNo}"]`);
          if (row) {
            row.remove();
          }
          
          // 检查是否还有任务
          const remainingRows = tableWrapper.querySelectorAll('.my-task-table-row:not(.my-task-table-header)');
          if (remainingRows.length === 0) {
            showEmptyState();
          }
          
          toast.success('任务已删除', '成功');
          
        } catch (error) {
          console.error('删除任务错误:', error);
          toast.error('删除任务失败', '错误');
        }
      }
    );
  }
  
  /**
   * 处理下载任务
   * @param {Object} task - 任务数据
   */
  function handleDownloadTask(task) {
    if (!task.fileUrl) {
      toast.warning('文件尚未生成或文件链接无效', '提示');
      return;
    }
    
    // 打开下载链接
    window.open(task.fileUrl, '_blank');
    toast.success('正在下载文件...', '下载');
  }
});

/**
 * 添加任务到本地缓存（供其他页面调用）
 * @param {Object} task - 任务数据
 */
function addTaskToCache(task) {
  try {
    const tasksJson = localStorage.getItem('myTasks');
    let tasks = [];
    
    if (tasksJson) {
      tasks = JSON.parse(tasksJson);
    }
    
    // 检查是否已存在
    const existingIndex = tasks.findIndex(t => t.orderNo === task.orderNo);
    if (existingIndex !== -1) {
      // 更新现有任务
      tasks[existingIndex] = task;
    } else {
      // 添加新任务
      tasks.push(task);
    }
    
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    console.log('任务已添加到缓存:', task);
    
  } catch (error) {
    console.error('添加任务到缓存失败:', error);
  }
}

