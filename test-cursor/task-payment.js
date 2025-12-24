// task-payment.html 专用脚本
// 处理充值支付功能

document.addEventListener('DOMContentLoaded', () => {
  // 获取表单元素
  const amountInput = document.getElementById('paymentAmountInput');
  const quickButtons = document.querySelectorAll('.payment-quick-btn');
  const paymentMethodBtn = document.querySelector('.payment-method-btn');
  
  // 快捷金额按钮点击事件（已在task.js中实现，这里保留备用）
  quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.trim();
      const value = text.replace('元', '').trim();
      amountInput.value = value || '';
      
      quickButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 支付方式按钮点击事件
  if (paymentMethodBtn) {
    paymentMethodBtn.addEventListener('click', async () => {
      await handlePayment();
    });
    
    // 添加鼠标悬停效果
    paymentMethodBtn.style.cursor = 'pointer';
    paymentMethodBtn.addEventListener('mouseenter', () => {
      paymentMethodBtn.style.opacity = '0.8';
    });
    paymentMethodBtn.addEventListener('mouseleave', () => {
      paymentMethodBtn.style.opacity = '1';
    });
  }
  
  /**
   * 处理支付
   */
  async function handlePayment() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    
    // 获取并验证充值金额
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
      toast.warning('请输入有效的充值金额', '提示');
      amountInput.focus();
      return;
    }
    
    if (amount < 1) {
      toast.warning('充值金额最少为1元', '提示');
      amountInput.focus();
      return;
    }
    
    if (amount > 10000) {
      toast.warning('单次充值金额不能超过10000元', '提示');
      amountInput.focus();
      return;
    }
    
    // 禁用按钮，防止重复点击
    paymentMethodBtn.style.pointerEvents = 'none';
    paymentMethodBtn.style.opacity = '0.5';
    
    try {
      // 显示loading提示
      toast.info('正在创建支付订单...', '请稍候');
      
      // 调用充值接口
      const result = await createRecharge(amount);
      
      if (!result.success) {
        // 创建支付订单失败
        toast.error(result.message, '创建支付订单失败');
        paymentMethodBtn.style.pointerEvents = 'auto';
        paymentMethodBtn.style.opacity = '1';
        return;
      }
      
      // 创建支付订单成功
      const paymentData = result.data;
      console.log('支付订单创建成功:', paymentData);
      
      // 显示支付信息
      showPaymentInfo(paymentData);
      
      // 开始轮询支付状态
      pollPaymentStatus(paymentData.paymentNo);
      
    } catch (error) {
      console.error('创建支付订单错误:', error);
      toast.error('创建支付订单时发生错误，请重试', '支付失败');
      paymentMethodBtn.style.pointerEvents = 'auto';
      paymentMethodBtn.style.opacity = '1';
    }
  }
  
  /**
   * 显示支付信息
   * @param {Object} paymentData - 支付数据
   */
  function showPaymentInfo(paymentData) {
    const message = `支付订单创建成功！\n\n订单号：${paymentData.paymentNo}\n充值金额：¥${formatAmount(paymentData.amount)}\n兑换积分：${paymentData.amount}积分\n\n请在新窗口中完成支付`;
    
    toast.confirm(
      message,
      '确认支付',
      () => {
        // 确认：打开支付页面
        if (paymentData.payUrl) {
          window.open(paymentData.payUrl, '_blank');
        } else {
          toast.error('支付链接无效', '错误');
        }
      },
      () => {
        // 取消：取消支付
        cancelPaymentOrder(paymentData.paymentNo);
      }
    );
  }
  
  /**
   * 轮询支付状态
   * @param {string} paymentNo - 支付单号
   */
  async function pollPaymentStatus(paymentNo) {
    let pollCount = 0;
    const maxPollCount = 120; // 最多轮询120次（10分钟）
    const pollInterval = 5000; // 每5秒轮询一次
    
    const poll = async () => {
      pollCount++;
      
      try {
        // 查询支付状态
        const result = await getPaymentStatus(paymentNo);
        
        if (!result.success) {
          console.error('查询支付状态失败:', result.message);
          
          if (pollCount < maxPollCount) {
            setTimeout(poll, pollInterval);
          } else {
            toast.warning('支付状态查询超时，请手动刷新页面查看', '提示');
            paymentMethodBtn.style.pointerEvents = 'auto';
            paymentMethodBtn.style.opacity = '1';
          }
          return;
        }
        
        const paymentStatus = result.data;
        console.log('支付状态:', paymentStatus);
        
        // 根据支付状态处理
        if (paymentStatus.status === 1) {
          // 支付成功
          toast.success(
            `支付成功！\n充值金额：¥${formatAmount(paymentStatus.amount)}\n获得积分：${paymentStatus.amount}积分`,
            '支付成功',
            () => {
              // 刷新积分余额
              if (typeof refreshPoints === 'function') {
                refreshPoints();
              }
              // 清空输入框
              amountInput.value = '';
              quickButtons.forEach(b => b.classList.remove('active'));
            }
          );
          
          paymentMethodBtn.style.pointerEvents = 'auto';
          paymentMethodBtn.style.opacity = '1';
          
        } else if (paymentStatus.status === 2 || paymentStatus.status === 3 || paymentStatus.status === 4) {
          // 支付已取消、已过期或失败
          const statusDesc = getPaymentStatusDesc(paymentStatus.status);
          toast.warning(`支付${statusDesc}`, '提示');
          
          paymentMethodBtn.style.pointerEvents = 'auto';
          paymentMethodBtn.style.opacity = '1';
          
        } else {
          // 支付待处理（status: 0）
          if (pollCount < maxPollCount) {
            setTimeout(poll, pollInterval);
          } else {
            toast.warning('支付超时，如已完成支付，请稍后刷新页面查看', '提示');
            paymentMethodBtn.style.pointerEvents = 'auto';
            paymentMethodBtn.style.opacity = '1';
          }
        }
        
      } catch (error) {
        console.error('查询支付状态错误:', error);
        
        if (pollCount < maxPollCount) {
          setTimeout(poll, pollInterval);
        } else {
          toast.error('支付状态查询失败', '查询失败');
          paymentMethodBtn.style.pointerEvents = 'auto';
          paymentMethodBtn.style.opacity = '1';
        }
      }
    };
    
    // 开始轮询
    setTimeout(poll, pollInterval);
  }
  
  /**
   * 取消支付订单
   * @param {string} paymentNo - 支付单号
   */
  async function cancelPaymentOrder(paymentNo) {
    try {
      const result = await cancelPayment(paymentNo);
      
      if (result.success) {
        toast.info('支付已取消', '提示');
      } else {
        console.error('取消支付失败:', result.message);
      }
      
      paymentMethodBtn.style.pointerEvents = 'auto';
      paymentMethodBtn.style.opacity = '1';
      
    } catch (error) {
      console.error('取消支付错误:', error);
      paymentMethodBtn.style.pointerEvents = 'auto';
      paymentMethodBtn.style.opacity = '1';
    }
  }
});

