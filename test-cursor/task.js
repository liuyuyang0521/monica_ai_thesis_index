// 统一的初始化函数（脚本在页面底部引入时，直接执行即可）
function initTaskPage() {
  // 左侧模块切换（仅当存在这些按钮时才生效）
  const moduleButtons = document.querySelectorAll(".sidebar-link");
  const titleEl = document.querySelector(".task-main-title");

  const moduleTitleMap = {
    范文生成: "AI 范文生成",
    文章降重: "文章降重 AIGC",
    段落降重: "段落降重 AIGC",
  };

  moduleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      moduleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const text = btn.textContent.trim();
      if (moduleTitleMap[text] && titleEl) {
        titleEl.textContent = moduleTitleMap[text];
      }
    });
  });

  // 通用：注册一个拖拽上传区域（点击打开本地磁盘 + 支持拖拽）
  function setupUploadArea(areaId, inputId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);

    if (!area || !input) return;

    ["dragenter", "dragover"].forEach((eventName) => {
      area.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      area.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.remove("drag-over");
      });
    });

    area.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length) {
        input.files = files;
        if (window.toast && typeof toast.show === "function") {
          toast.show({
            title: "文件已选择",
            message: `共选择 ${files.length} 个文件`,
          });
        }
      }
    });

    input.addEventListener("change", () => {
      const files = input.files;
      if (files && files.length && window.toast && typeof toast.show === "function") {
        toast.show({
          title: "文件已选择",
          message: `共选择 ${files.length} 个文件`,
        });
      }
    });
  }

  // 范文生成页面：相关资料文件上传
  setupUploadArea("taskUploadArea", "taskFiles");
  // 文章降重页面：上传待降重文档
  setupUploadArea("articleUploadArea", "articleFiles");

  // 统一：左上角「主页」按钮：返回首页
  const homeBtn = document.querySelector(".task-header-my");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // 顶部「立即充值」按钮：跳转到在线充值页面
  const rechargeButtons = document.querySelectorAll(".task-header-recharge");
  rechargeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "task-payment.html";
    });
  });

  // 充值页顶部「任务中心」按钮：返回范文生成页面
  const logoBtn = document.querySelector(".logo-text");
  if (logoBtn && window.location.pathname.endsWith("task-payment.html")) {
    logoBtn.addEventListener("click", () => {
      window.location.href = "task-center.html";
    });
  }

  // 充值页面：快捷金额按钮点击填充输入框
  const amountInput = document.getElementById("paymentAmountInput");
  const quickButtons = document.querySelectorAll(".payment-quick-btn");
  if (amountInput && quickButtons.length) {
    quickButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.textContent.trim();
        const value = text.replace("元", "").trim();
        amountInput.value = value || "";

        quickButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // 顶部「切换」按钮：弹出确认提示，确认后跳转登录页
  const toggleBtn = document.querySelector(".task-header-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", handleSwitchClick);
  }
}

// 提供给所有页面公用的“切换账号”弱提示逻辑
function handleSwitchClick() {
  const message = "【切换账号提示】确定要切换当前账号，并返回登录页面吗？";
  const title = "切换账号";

  toast.confirm(
    message,
    title,
    () => {
      window.location.href = "login.html";
    },
    () => {
      // 取消：不做任何事
    }
  );
}

// 脚本在页面底部引入，DOM 已经就绪，直接执行
initTaskPage();
