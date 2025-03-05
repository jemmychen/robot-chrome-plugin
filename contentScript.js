// contentScript.js
// 可选文件，用于在页面中执行持续性的操作或响应 background 发来的消息

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
	console.log(request);
	let re = await langicApi.handleCommand(document, request.data);
	sendResponse(re);
});

function LangicOpt() {
	// 默认使用当前页面的 document
	let doc = {};

	// 允许通过 setDocument 方法来切换/设定不同的文档对象
	this.setDocument = function (newDoc) {
		if (newDoc && typeof newDoc.querySelector === 'function') {
			doc = newDoc;
			console.log('Document 对象已更新');
		} else {
			console.log('无效的 Document 对象');
		}
	};

	this.setValue = function (selector, value) {
		const elem = doc.querySelector(selector);
		if (elem) {
			elem.value = value;
			const event = new Event('input', { bubbles: true });
			elem.dispatchEvent(event);
			return {code:1, msg:`已设置输入框 ${selector} 的值: ${value}`}
		} else {
			return {code:0, msg:`输入框未找到: ${selector}`}
		}
	};

	this.findElement = function (selector) {
		const elem = doc.querySelector(selector);
		if (elem) {
			return {code:1, msg:`元素已找到: ${selector}`}
		} else {
			return {code:0, msg:`元素未找到: ${selector}`}
		}
	};

	this.clickElement = function (selector) {
		const elem = doc.querySelector(selector);
		if (elem) {
			elem.click();
			const event = new Event('click', { bubbles: true });
			elem.dispatchEvent(event);
			return {code:1, msg:`已点击元素: ${selector}`}
		} else {
			return {code:0, msg:`元素未找到: ${selector}`}
		}
	};

	this.focusInput = function (selector) {
		const elem = doc.querySelector(selector);
		if (elem) {
			elem.focus();
			const event = new Event('focus', { bubbles: true });
			elem.dispatchEvent(event);
			return {code:1, msg:`已聚焦输入框: ${selector}`}
		} else {
			return {code:0, msg:`输入框未找到: ${selector}`}
		}
	};

	this.scrollArea = function (selector, distance) {
		const elem = doc.querySelector(selector);
		if (elem) {
			elem.scrollBy(0, distance);
			const scrollEvent = new Event('scroll', { bubbles: true });
			window.dispatchEvent(scrollEvent); // 触发页面滚动事件
			elem.dispatchEvent(scrollEvent);   // 触发某个元素的滚动事件
			return {code:1, msg:`区域 ${selector} 已滚动：${distance}`}
		} else {
			return {code:0, msg:`滚动区域未找到: ${selector}`}
		}
	};

	this.selectValue = function (selector, value) {
		const selectElem = doc.querySelector(selector);
		if (selectElem && selectElem.tagName.toLowerCase() === 'select') {
			selectElem.value = value;
			// 触发 change 事件
			const event = new Event('change', { bubbles: true });
			selectElem.dispatchEvent(event);
			return {code:1, msg:`已选择 ${selector} 的值: ${value}`}
		} else {
			return {code:0, msg:`Select 元素未找到或选择器错误: ${selector}`}
		}
	};

	this.clickCoordinate = function (x, y) {
		const event = new MouseEvent('click', {
			clientX: x,
			clientY: y,
			bubbles: true,
			cancelable: true
		});
		// 在指定坐标找到元素后，执行点击事件
		doc.elementFromPoint(x, y)?.dispatchEvent(event);
		return {code:1, msg:`已在坐标 (${x}, ${y}) 触发点击`}
	};

	this.setAttr = function (selector, attr, value) {
		const elem = doc.querySelector(selector);
		if (elem) {
			elem.setAttribute(attr, value);
			const event = new Event('change', { bubbles: true });
			elem.dispatchEvent(event);
			return {code:1, msg:`已设置元素 ${selector} 的属性: ${attr}=${value}`}
		} else {
			return {code:0, msg:`元素未找到: ${selector}`}
		}
	};

	this.getHtml = function (selector) {
		const elem = doc.querySelector(selector);
		if (elem) {
			return {code:1, msg:elem.innerHTML}
		} else {
			return {code:0, msg:`元素未找到: ${selector}`}
		}
	};
}

let langicOpt = new LangicOpt();
let langicApi = {
	handleCommand: async function (document, cmd) {
		// console.log('handleCommand:', cmd, document);
		let re = "";
		langicOpt.setDocument(document);
		switch (cmd.action) {
			case 'FIND_ELEMENT':
				// 根据DOM规则查找某个元素
				re = langicOpt.findElement(cmd.selector);
				break;

			case 'CLICK_ELEMENT':
				// 根据DOM规则点击某个元素
				re = langicOpt.clickElement(cmd.selector);
				break;

			case 'FOCUS_INPUT':
				// 根据DOM规则点击输入框并获得焦点
				re = langicOpt.focusInput(cmd.selector);
				break;

			case 'SCROLL_AREA':
				// 根据DOM规则选择某个区域并进行上下滚动
				re = langicOpt.scrollArea(cmd.selector, cmd.scrollDistance);
				break;

			case 'SELECT_VALUE':
				// 根据DOM规则选择某个SELECT的值
				re = langicOpt.selectValue(cmd.selector, cmd.value);
				break;

			case 'CLICK_COORDINATE':
				// 点击网页指定坐标
				re = langicOpt.clickCoordinate(cmd.x, cmd.y);
				break;
			case 'SET_VALUE':
				re = langicOpt.setValue(cmd.selector, cmd.value);
				break;
			case 'SET_ATTR':
				re = langicOpt.setAttr(cmd.selector, cmd.attr, cmd.value);
				break;
			default:
				re = {code:0, msg:`未知命令: ${cmd.action}`}
		}
		console.log("in handle command:",re,cmd.action);
		return re;
	}
};