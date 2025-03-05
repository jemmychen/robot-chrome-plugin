document.addEventListener("DOMContentLoaded", function () {
    const loginContainer = document.getElementById("login-container");
    const contentContainer = document.getElementById("content-container");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const errorMsg = document.getElementById("error-msg");
    const messageList = document.getElementById("message-list");

    // 检查是否已经登录
    chrome.storage.local.get("langicToken", function (data) {
        if (data.langicToken) {
            loginSuccess();
        }
    });

    // 登录按钮事件
    loginBtn.addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (!username || !password) {
            errorMsg.textContent = "请输入用户名和密码";
            return;
        }

        fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                chrome.storage.local.set({ langicToken: data.token }, function () {
                    loginSuccess();
                });
            } else {
                errorMsg.textContent = "登录失败，请检查用户名或密码";
            }
        })
        .catch(() => errorMsg.textContent = "网络错误，请稍后重试");
    });

    // 退出登录
    logoutBtn.addEventListener("click", function () {
        chrome.storage.local.remove("token", function () {
            loginContainer.style.display = "block";
            contentContainer.style.display = "none";
            chrome.runtime.sendMessage({ action: "disconnect_socket" });  // 断开 WebSocket
        });
    });

    // 显示消息列表
    function loginSuccess() {
        loginContainer.style.display = "none";
        contentContainer.style.display = "block";
        chrome.storage.local.get("langicToken", function (data) {
            console.log(data)
        });
        // 触发 WebSocket 连接
        chrome.runtime.sendMessage({ action: "login_success" });
    }

    // 监听 WebSocket 消息
    chrome.runtime.onMessage.addListener(function (message) {
        if (message.action === "new_message") {
            const li = document.createElement("li");
            li.textContent = message.data;
            messageList.appendChild(li);
        }
    });
});
