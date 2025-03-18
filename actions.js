//deperated for now
let langicRunFlows = async function (flows) {
    for (let cmd of flows) {
        if (cmd.type == 'newpage') {
            await new Promise((resolve, reject) => {
                chrome.tabs.create({ url: cmd.data.url }, (tab) => {
                    // 定义一个监听函数
                    function handleTabUpdated(tabId, changeInfo, updatedTab) {
                        // 如果是新建的标签，并且加载状态变为 complete
                        if (tabId === tab.id && changeInfo.status === 'complete') {
                            flowTabId = tabId.id;
                            console.log('网页加载完成:', updatedTab.url, new Date().getTime());
                            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
                            resolve();
                        }
                    }
                    // 注册监听器
                    chrome.tabs.onUpdated.addListener(handleTabUpdated);
                });
            });
            await sleep(cmd.data.delay_after * 1000);
        } else {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.tabs.sendMessage(tab.id, cmd, response => {
                console.log('收到 content script 的响应:', response);
            });
            await sleep(cmd.data.delay_after * 1000);
        }
    }
}

//执行命令
let langicRunStep = async function (cmd) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(tab == undefined || tab.id != undefined) return {code:-1, msg:"当前无标签页", data:""};
    let re = {};
    switch (cmd.type) {
        case 'newtab':
            await new Promise((resolve, reject) => {
                chrome.tabs.create({ url: "about:blank" }, (tab) => {
					resolve();
                });
            });
            re = {code:1, msg:"", data:""};
        case 'openurl':
            await setTabUrl(cmd.data.url);
            await sleep(cmd.data.delay_after * 1000);
            re = {code:1, msg:"", data:""};
            break;
        case 'dom':
            await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, cmd, response => {
                    console.log('收到 content script 的响应:', response);
                    re = response;
                    resolve();
                });
            });
            await sleep(cmd.data.delay_after * 1000);
            break;
        case 'geturl':
            let url = await getCurrentTabUrl();
            re = {code:1, msg:"", data:url};
            break;
        default:
            re = {code:-1, msg:'未知命令', data:""};
    }
    return re;
}

async function setTabUrl(newUrl) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let tabId = tab.id;
    try {
        // 更新标签页 URL
        await chrome.tabs.update(tabId, { url: newUrl });

        // 等待标签页加载完成
        await new Promise((resolve) => {
            const listener = function(updatedTabId, changeInfo, updatedTab) {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener); // 移除监听器
                    console.log(`标签页 ${tabId} 已加载完成，当前 URL:`, updatedTab.url);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
        console.log("URL 更新并加载完成");
    } catch (error) {
        console.error("更新 URL 或等待加载时出错:", error);
    }
}

async function getCurrentTabUrl() {
    try {
        // 查询当前活动标签页
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab) {
            console.log("未找到活动标签页");
            return null;
        }

        // 返回当前标签页的 URL
        console.log("当前标签页的 URL:", activeTab.url);
        return activeTab.url;
    } catch (error) {
        console.error("获取当前标签页 URL 时出错:", error);
        return null;
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}