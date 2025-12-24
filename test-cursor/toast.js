// 提示弹框功能
class Toast {
  constructor() {
    this.modal = document.getElementById('toastModal');
    this.titleEl = document.getElementById('toastTitle');
    this.messageEl = document.getElementById('toastMessage');
    this.closeBtn = document.getElementById('toastClose');
    this.confirmBtn = document.getElementById('toastConfirm');
    this.cancelBtn = document.getElementById('toastCancel');
    
    this.init();
  }

  init() {
    // 关闭按钮点击事件
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    // 点击背景关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('show')) {
        this.hide();
      }
    });
  }

  // 显示弹框
  show(options = {}) {
    const {
      title = '提示',
      message = '这是一条提示信息',
      showCancel = false,
      onConfirm = null,
      onCancel = null
    } = options;

    this.titleEl.textContent = title;
    this.messageEl.textContent = message;
    
    // 显示/隐藏取消按钮
    if (showCancel) {
      this.cancelBtn.style.display = 'inline-block';
    } else {
      this.cancelBtn.style.display = 'none';
    }

    // 确认按钮事件
    this.confirmBtn.onclick = () => {
      if (onConfirm) {
        onConfirm();
      }
      this.hide();
    };

    // 取消按钮事件
    this.cancelBtn.onclick = () => {
      if (onCancel) {
        onCancel();
      }
      this.hide();
    };

    // 显示弹框
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
  }

  // 隐藏弹框
  hide() {
    this.modal.classList.remove('show');
    document.body.style.overflow = ''; // 恢复滚动
  }

  // 成功提示
  success(message, title = '成功', onConfirm = null, autoClose = 0) {
    this.show({
      title,
      message,
      showCancel: false,
      onConfirm
    });
    
    if (autoClose > 0) {
      setTimeout(() => {
        this.hide();
      }, autoClose);
    }
  }

  // 错误提示
  error(message, title = '错误', onConfirm = null, autoClose = 0) {
    this.show({
      title,
      message,
      showCancel: false,
      onConfirm
    });
    
    if (autoClose > 0) {
      setTimeout(() => {
        this.hide();
      }, autoClose);
    }
  }

  // 警告提示
  warning(message, title = '警告', onConfirm = null, autoClose = 0) {
    this.show({
      title,
      message,
      showCancel: false,
      onConfirm
    });
    
    if (autoClose > 0) {
      setTimeout(() => {
        this.hide();
      }, autoClose);
    }
  }

  // 信息提示
  info(message, title = '提示', onConfirm = null, autoClose = 0) {
    this.show({
      title,
      message,
      showCancel: false,
      onConfirm
    });
    
    if (autoClose > 0) {
      setTimeout(() => {
        this.hide();
      }, autoClose);
    }
  }

  // 确认对话框
  confirm(message, title = '确认', onConfirm = null, onCancel = null) {
    this.show({
      title,
      message,
      showCancel: true,
      onConfirm,
      onCancel
    });
  }
}

// 创建全局实例
const toast = new Toast();

// 使用示例：
// toast.show({ title: '提示', message: '操作成功！' });
// toast.success('保存成功！');
// toast.error('操作失败，请重试');
// toast.confirm('确定要删除吗？', '确认删除', () => { console.log('确认'); }, () => { console.log('取消'); });

