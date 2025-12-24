// task-article.html 专用脚本
// 处理文章降重订单提交

document.addEventListener('DOMContentLoaded', () => {
  // 获取表单元素
  const fileInput = document.getElementById('articleFiles');
  const uploadArea = document.getElementById('articleUploadArea');
  const submitBtn = document.querySelector('.task-submit-btn');
  
  // 提交按钮点击事件
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      await handleSubmit();
    });
  }
  
  // 文件选择变化事件（显示已选择的文件）
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      displaySelectedFiles();
    });
  }
  
  /**
   * 显示已选择的文件
   */
  function displaySelectedFiles() {
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    
    const fileNames = Array.from(fileInput.files).map(f => f.name).join(', ');
    
    // 在上传区域显示文件名
    const label = uploadArea.querySelector('.task-upload-label');
    if (label) {
      const textEl = label.querySelector('.task-upload-text');
      if (textEl) {
        textEl.textContent = `已选择：${fileNames}`;
        textEl.style.color = '#5F90F7';
      }
    }
  }
  
  /**
   * 处理订单提交
   */
  async function handleSubmit() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    
    // 获取并验证表单数据
    const formData = getFormData();
    if (!formData) {
      return; // 验证失败，已显示错误提示
    }
    
    // 禁用提交按钮，防止重复提交
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    
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
          orderType: 2, // 文章降重
          title: orderData.title,
          status: orderData.status || 0,
          progress: 10,
          createTime: orderData.createTime || new Date().toISOString(),
          fileUrl: null
        });
      }
      
      // 显示成功提示
      toast.success(
        `订单创建成功！\n订单号：${orderData.orderNo}\n消耗积分：${orderData.points}`,
        '提交成功',
        () => {
          // 跳转到我的任务页面
          window.location.href = 'my-task.html';
        }
      );
      
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
    // 检查是否选择了文件
    if (!fileInput.files || fileInput.files.length === 0) {
      toast.warning('请上传待降重的文档', '提示');
      return null;
    }
    
    // 验证文件大小（单个文件不超过20MB）
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const maxSize = 20 * 1024 * 1024; // 20MB
      
      if (file.size > maxSize) {
        toast.error(`文件 "${file.name}" 超过20MB限制`, '文件过大');
        return null;
      }
    }
    
    // 注意：实际项目中需要先上传文件到服务器，获取URL
    // 这里暂时使用第一个文件的名称作为占位
    const firstFile = fileInput.files[0];
    
    // 提示用户文件上传功能待实现
    toast.info(
      '注意：文件上传功能待完善\n当前仅模拟提交，实际使用时需先上传文件获取URL',
      '提示',
      null,
      3000
    );
    
    // 构建订单数据
    const orderData = {
      title: `文章降重 - ${firstFile.name}`,
      field: '未指定',
      targetWords: 0, // 文章降重不需要指定字数
      dataStatus: '不需要',
      citationFormat: '不需要文献',
      deliveryTypes: ['论文'],
      writingRequirements: '对上传的文章进行降重处理',
      specialRequirements: '',
      paperUrl: '', // 实际项目中需要上传文件后获取URL
      orderType: 2 // 2-论文降重
    };
    
    console.log('订单数据:', orderData);
    return orderData;
  }
  
  /**
   * 重置表单
   */
  function resetForm() {
    if (fileInput) {
      fileInput.value = '';
    }
    
    // 恢复上传区域文本
    const label = uploadArea.querySelector('.task-upload-label');
    if (label) {
      const textEl = label.querySelector('.task-upload-text');
      if (textEl) {
        textEl.textContent = '拖拽文档到此处，或点击选择文件';
        textEl.style.color = '';
      }
    }
  }
});

