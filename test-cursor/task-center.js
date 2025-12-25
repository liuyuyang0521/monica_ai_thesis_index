// task-center.html 专用脚本
// 处理论文写作（范文生成）订单提交

document.addEventListener('DOMContentLoaded', () => {
  // 获取表单元素
  const titleInput = document.querySelector('.task-card-row input[type="text"]');
  const fieldInput = document.querySelectorAll('.task-card-row-4 input[type="text"]')[0];
  const wordCountInput = document.querySelector('.task-card-row-4 input[type="number"]');
  const dataStatusSelect = document.querySelector('.task-card-row-4 select');
  const citationFormatSelect = document.querySelectorAll('.task-card-row-4 select')[1];
  const deliveryCheckboxes = document.querySelectorAll('.task-delivery-option input[type="checkbox"]');
  const writingRequirementsTextarea = document.querySelector('.task-textarea');
  const fileInput = document.getElementById('taskFiles');
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
          orderType: 1, // 论文写作
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
    // 1. 论文标题
    const title = titleInput.value.trim();
    if (!title) {
      toast.warning('请输入论文标题', '提示');
      titleInput.focus();
      return null;
    }
    
    // 2. 专业领域
    const field = fieldInput.value.trim();
    if (!field) {
      toast.warning('请输入专业领域', '提示');
      fieldInput.focus();
      return null;
    }
    
    // 3. 目标字数
    const targetWords = parseInt(wordCountInput.value);
    if (!targetWords || targetWords <= 0) {
      toast.warning('请输入有效的目标字数（大于0）', '提示');
      wordCountInput.focus();
      return null;
    }
    
    // 4. 数据状态
    const dataStatus = dataStatusSelect.value;
    const dataStatusMap = {
      'none': '不需要',
      'need_no_data': '需要，但没数据',
      'in_files': '数据在资料中'
    };
    const dataStatusText = dataStatusMap[dataStatus] || dataStatus;
    
    // 5. 引文格式
    const citationFormat = citationFormatSelect.value;
    const citationFormatMap = {
      'gbt': 'GBT7714',
      'apa': 'APA',
      'none': '不需要文献'
    };
    const citationFormatText = citationFormatMap[citationFormat] || citationFormat;
    
    // 6. 交付文件类型
    const deliveryTypes = [];
    deliveryCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        deliveryTypes.push(checkbox.nextElementSibling.textContent.trim());
      }
    });
    
    if (deliveryTypes.length === 0) {
      toast.warning('请至少选择一种交付文件类型', '提示');
      return null;
    }
    
    // 7. 写作要求
    const writingRequirements = writingRequirementsTextarea.value.trim();
    if (!writingRequirements) {
      toast.warning('请填写写作与特殊要求', '提示');
      writingRequirementsTextarea.focus();
      return null;
    }
    
    // 8. 文件列表（可选）
    const files = [];
    if (fileInput.files && fileInput.files.length > 0) {
      // 注意：实际项目中需要先上传文件到服务器，获取URL
      // 这里暂时只记录文件名
      for (let i = 0; i < fileInput.files.length; i++) {
        files.push({
          fileName: fileInput.files[i].name,
          fileSize: fileInput.files[i].size,
          fileUrl: '' // 实际项目中需要上传后获取URL
        });
      }
      
      // 提示：文件上传功能待实现
      console.log('已选择文件:', files);
      toast.info('注意：文件上传功能待完善，当前仅记录文件名', '提示');
    }
    
    // 构建订单数据
    const orderData = {
      title: title,
      field: field,
      targetWords: targetWords,
      dataStatus: dataStatusText,
      citationFormat: citationFormatText,
      deliveryTypes: deliveryTypes,
      writingRequirements: writingRequirements,
      specialRequirements: '', // 可选，当前表单无此字段
      files: files.length > 0 ? files : null,
      orderType: 1 // 1-论文写作
    };
    
    console.log('订单数据:', orderData);
    return orderData;
  }
  
  /**
   * 重置表单
   */
  function resetForm() {
    if (titleInput) titleInput.value = '';
    if (fieldInput) fieldInput.value = '';
    if (wordCountInput) wordCountInput.value = '';
    if (dataStatusSelect) dataStatusSelect.selectedIndex = 0;
    if (citationFormatSelect) citationFormatSelect.selectedIndex = 0;
    deliveryCheckboxes.forEach(checkbox => checkbox.checked = false);
    if (writingRequirementsTextarea) writingRequirementsTextarea.value = '';
    if (fileInput) fileInput.value = '';
  }
});

