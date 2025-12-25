// task-paragraph.html 专用脚本
// 处理段落降重订单提交

document.addEventListener('DOMContentLoaded', () => {
  // 获取表单元素
  const inputTextarea = document.querySelectorAll('.task-textarea')[0]; // 输入待降重段落
  const outputTextarea = document.querySelectorAll('.task-textarea')[1]; // 处理后的结果
  const submitBtn = document.querySelector('.task-submit-btn');
  
  // 提交按钮点击事件
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      await handleSubmit();
    });
  }
  
  /**
   * 处理订单提交
   */
  async function handleSubmit() {
    // 检查并确保用户已登录（会验证服务端登录状态）
    if (!await ensureLoggedIn()) {
      return;
    }
    
    // 获取并验证表单数据
    const formData = getFormData();
    if (!formData) {
      return; // 验证失败，已显示错误提示
    }
    
    // 禁用提交按钮，防止重复提交
    submitBtn.disabled = true;
    submitBtn.textContent = '处理中...';
    
    try {
      // 调用创建订单接口
      const result = await createOrder(formData);
      
      if (!result.success) {
        // 创建订单失败
        toast.error(result.message, '创建订单失败');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交任务';
        return;
      }
      
      // 创建订单成功
      const orderData = result.data;
      console.log('订单创建成功:', orderData);
      
      // 添加任务到本地缓存
      if (typeof addTaskToCache === 'function') {
        addTaskToCache({
          orderNo: orderData.orderNo,
          orderType: 3, // 段落降重
          title: orderData.title,
          status: orderData.status || 0,
          progress: 10,
          createTime: orderData.createTime || new Date().toISOString(),
          fileUrl: null
        });
      }
      
      // 显示成功提示
      toast.success(
        `订单创建成功！\n订单号：${orderData.orderNo}\n消耗积分：${orderData.points}\n\n处理完成后结果将显示在下方`,
        '提交成功'
      );
      
      // 开始轮询任务状态
      pollTaskStatus(orderData.orderNo);
      
      // 刷新积分余额
      if (typeof refreshPoints === 'function') {
        refreshPoints();
      }
      
    } catch (error) {
      console.error('提交订单错误:', error);
      toast.error('提交订单时发生错误，请重试', '提交失败');
      submitBtn.disabled = false;
      submitBtn.textContent = '提交任务';
    }
  }
  
  /**
   * 获取并验证表单数据
   * @returns {Object|null} 表单数据对象，验证失败返回null
   */
  function getFormData() {
    // 获取段落内容
    const paragraphContent = inputTextarea.value.trim();
    
    if (!paragraphContent) {
      toast.warning('请输入待降重的段落内容', '提示');
      inputTextarea.focus();
      return null;
    }
    
    // 验证段落长度（建议200-1000字）
    if (paragraphContent.length < 10) {
      toast.warning('段落内容太短，建议至少10个字符', '提示');
      inputTextarea.focus();
      return null;
    }
    
    if (paragraphContent.length > 2000) {
      toast.warning('段落内容过长，建议不超过2000个字符', '提示');
      inputTextarea.focus();
      return null;
    }
    
    // 构建订单数据
    const orderData = {
      title: '段落降重',
      field: '未指定',
      targetWords: 0,
      dataStatus: '不需要',
      citationFormat: '不需要文献',
      deliveryTypes: ['论文'],
      writingRequirements: '对段落进行降重处理',
      specialRequirements: '',
      paragraphContent: paragraphContent, // 段落内容
      orderType: 3 // 3-段落降重
    };
    
    console.log('订单数据:', orderData);
    return orderData;
  }
  
  /**
   * 轮询任务状态
   * @param {string} orderNo - 订单号
   */
  async function pollTaskStatus(orderNo) {
    let pollCount = 0;
    const maxPollCount = 60; // 最多轮询60次（5分钟）
    const pollInterval = 5000; // 每5秒轮询一次
    
    const poll = async () => {
      pollCount++;
      
      try {
        // 查询任务状态
        const result = await getTaskByOrderNo(orderNo);
        
        if (!result.success) {
          console.error('查询任务状态失败:', result.message);
          
          if (pollCount < maxPollCount) {
            setTimeout(poll, pollInterval);
          } else {
            toast.error('任务状态查询超时，请稍后在"我的任务"中查看', '查询超时');
            submitBtn.disabled = false;
            submitBtn.textContent = '提交任务';
          }
          return;
        }
        
        const taskData = result.data;
        console.log('任务状态:', taskData);
        
        // 根据任务状态处理
        if (taskData.status === 2) {
          // 任务已完成
          toast.success('降重处理已完成！', '成功');
          
          // 如果有文件URL，可以显示下载链接
          if (taskData.fileUrl) {
            // 段落降重通常直接返回文本内容，不是文件
            // 这里模拟显示结果
            outputTextarea.value = '降重处理已完成，请在"我的任务"中查看完整结果';
          }
          
          submitBtn.disabled = false;
          submitBtn.textContent = '提交任务';
          
        } else if (taskData.status === 3) {
          // 任务失败
          toast.error(taskData.errorMsg || '降重处理失败', '失败');
          submitBtn.disabled = false;
          submitBtn.textContent = '提交任务';
          
        } else {
          // 任务处理中（status: 0-待处理, 1-处理中）
          if (pollCount < maxPollCount) {
            submitBtn.textContent = `处理中 (${pollCount}/${maxPollCount})...`;
            setTimeout(poll, pollInterval);
          } else {
            toast.warning('处理时间较长，请稍后在"我的任务"中查看', '提示');
            submitBtn.disabled = false;
            submitBtn.textContent = '提交任务';
          }
        }
        
      } catch (error) {
        console.error('查询任务状态错误:', error);
        
        if (pollCount < maxPollCount) {
          setTimeout(poll, pollInterval);
        } else {
          toast.error('任务状态查询失败，请稍后在"我的任务"中查看', '查询失败');
          submitBtn.disabled = false;
          submitBtn.textContent = '提交任务';
        }
      }
    };
    
    // 开始轮询
    setTimeout(poll, pollInterval);
  }
  
  /**
   * 重置表单
   */
  function resetForm() {
    if (inputTextarea) inputTextarea.value = '';
    if (outputTextarea) outputTextarea.value = '';
  }
});

