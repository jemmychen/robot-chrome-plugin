// background.js
// 使用Manifest V3，Service Worker 脚本，管理 socket.io 连接并转发DOM操作命令

importScripts('socket.io.min.js');
importScripts('actions.js');

// 替换为你的服务端地址
const SERVER_URL = "http://3.143.217.163:3030";
let localsocket = null;
let currentTabId = 0;

chrome.action.onClicked.addListener(function() {
    // 获取 popup.html 的路径
    const popupUrl = chrome.runtime.getURL('popup.html');

    // 在新标签页中打开 popup.html
    chrome.tabs.create({ url: popupUrl }, function(tab) {
        console.log("Popup 已在新标签页中打开，标签页 ID:", tab.id);
    });
});

async function initSocketConnection(token) {
	console.log("initSocketConnection",token);
	localsocket = io(SERVER_URL, {
		transports: ['websocket'],
		reconnection: true,
		reconnectionDelay: 3000,
		auth: {
			token: token
		}
	});

	// Socket 连接成功
	localsocket.on('connect', async () => {
		console.log('Socket.IO connected');

		// socket.on('flows', async (flows, callback) => {
		// 	langicRunFlows(flows);
		// })

		localsocket.on('cmd', async (cmd, callback) => {
			let re = await langicRunStep(cmd);
			callback(re);
		})
	});

	// Socket 断开
	localsocket.on('disconnect', () => {
		console.log('Socket.IO disconnected');
	});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("background message",request);
    if (request.action === "login_success") {
        chrome.storage.local.get("langicToken", function (data) {
			console.log("token",data);
            if (data.langicToken) {
				// chrome.tabs.create({ url: "about:blank" }, (tab) => {
					initSocketConnection(data.langicToken);
				// });
            }
        });
    }
	if(request.action === "disconnect_socket"){
		if(localsocket){
			localsocket.disconnect();
		}
	}
	if(request.action === "run"){
		localsocket.emit('run');
	}
	if(request.action === "stop"){
		localsocket.emit('stop');
	}

	return true;
});

// 监听 Service Worker 生命周期事件（可选）
self.oninstall = () => {
	console.log('Service Worker installing...');
};

self.onactivate = () => {
	console.log('Service Worker activated.');
};
