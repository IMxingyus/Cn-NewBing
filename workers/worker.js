export default {
	async fetch(request, _env) {
		return await handleRequest(request);
	}
}

/**
 * Respond to the request
 * @param {Request} request
 */
let startReg = new RegExp("^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+");
async function handleRequest(request) {
	if (isEquals(request,"/sydney/ChatHub")) {//魔法聊天
		return bingChatHub(request)
	}
	if (isEquals(request,"/turing/conversation/create")) {//创建聊天
		return goUrl(request,"https://www.bing.com/turing/conversation/create");
	}
	if (isEquals(request,"/msrewards/api/v1/enroll\\?(.*)")) {//加入候补
		let a = request.url.split("?");
		return goUrl(request,"https://www.bing.com/msrewards/api/v1/enroll?"+a[1]);
	}
	if (isEquals(request,"/images/create\\?(.*)")) {//AI画图
		let a = request.url.split("?");
		return goUrl(request,"https://www.bing.com/images/create?"+a[1],{
			"sec-fetch-site":"same-origin",
			"referer":"https://www.bing.com/search?q=bingAI"
		});
	}
	if (isEquals(request,"/images/create/async/results(.*)")) {//请求AI画图图片
		let reg = new RegExp("^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+(/images/create/async/results)");
		let a = request.url.replace(reg,"https://www.bing.com/images/create/async/results");
		return goUrl(request,a,{
			"sec-fetch-site":"same-origin",
			"referer":"https://www.bing.com/images/create?partner=sydney&showselective=1&sude=1&kseed=7000"
		});
	}
	return getReturnError('出现错误 可能的原因：浏览器直接访问、插件版本不匹配。');
}

//匹配url
function isEquals(request,path){
	let reg = new RegExp(`^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+(${path})$`);
	return reg.test(request.url);
}

//请求某地址
function goUrl(request, url, addHeaders) {
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {}
	}
	//保留头部信息
	let reqHeaders = new Headers(request.headers);
	let dropHeaders = ["cookie","user-agent","accept","accept-language"];
	let he = reqHeaders.entries();
	for (let h of he) {
		let key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	if (addHeaders) {
		//添加头部信息
		for (let h in addHeaders) {
			fp.headers[h] = addHeaders[h];
		}
	}
	return fetch(url, fp);
}

//获取用于返回的错误信息
function getReturnError(error){
	return new Response(JSON.stringify({
		result: {
			value: 'error',
			message: error
		}
	}), {
		status: 200,
		statusText: 'ok',
		headers: {
			"content-type": "application/json"
		}
	})
}

//websocket
function bingChatHub(request) {
	// 如果请求包含 Upgrade 头，说明是 WebSocket 连接
	if (request.headers.get('Upgrade') === 'websocket') {
		const webSocketPair = new WebSocketPair()
		const serverWebSocket = webSocketPair[1]
		var bingws = new WebSocket('wss://sydney.bing.com/sydney/ChatHub')
		serverWebSocket.onmessage = event => {
			bingws.send(event.data);
		}
		bingws.onmessage = event => {
			serverWebSocket.send(event.data)
		}
		bingws.onopen = event => {
			serverWebSocket.accept();
		}
		bingws.onclose = event => {
			serverWebSocket.close(event.code, event.reason);
		}
		bingws.onerror = event => {
			serverWebSocket.send(JSON.stringify({
				type: 'error',
				mess: "workers接到Bing错误：" + event
			}));
			serverWebSocket.close();
		}
		serverWebSocket.onerror = event => {
			serverWebSocket.close();
		}
		serverWebSocket.onclose = event => {
			bingws.close(event.code, event.reason);
		}

		return new Response(null, { status: 101, webSocket: webSocketPair[0] })
	} else {
		return new Response('这不是websocket请求！')
	}
}