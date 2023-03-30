export default {
	async fetch(request, _env) {
		return await handleRequest(request);
	}
}


let bingCreateEXP = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/Create');
let bingChatHubEXP = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/ChatHub');
let bingcopilotwaitlistEXP = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/bingcopilotwaitlist');

let aiDrawCreateExp = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/AiDraw/Create');
let aiDrawResultsExp = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/images/create/async/results');

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
	if (bingChatHubEXP.test(request.url)) {
		return await bingChatHub(request)
	}
	if (bingCreateEXP.test(request.url)) {
		return await bingCreate(request)
	}
	if (bingcopilotwaitlistEXP.test(request.url)) {
		return await bingcopilotwaitlist(request)
	}
	if(aiDrawCreateExp.test(request.url)){
		return await aiDrawCreate(request)
	}
	if(aiDrawResultsExp.test(request.url)){
		return await aiDrawResults(request)
	}
	return new Response(JSON.stringify({
		result: {
			value: 'error',
			message: '出现错误。也许是插件版本过旧或没有使用插件。'
		}
	}), {
		status: 200,
		statusText: 'ok',
		headers: {
			"content-type": "application/json"
		}
	})
}

async function aiDrawResults(request) {
	//请求头部、返回对象
	let reqHeaders = new Headers(request.headers);
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {
			"sec-fetch-site":"same-origin",
            "referer":"https://www.bing.com/images/create?partner=sydney&showselective=1&sude=1&kseed=7000"
		}
	}

	//保留头部信息
	const dropHeaders = ['cookie', 'user-agent'];
	let he = reqHeaders.entries();
	for (let h of he) {
		const key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	return await fetch(request.url.replace(aiDrawResultsExp,"https://www.bing.com/images/create/async/results"), fp);
}

async function aiDrawCreate(request) {
	//请求头部、返回对象
	let reqHeaders = new Headers(request.headers);
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {
			"sec-fetch-site":"same-origin",
            "referer":"https://www.bing.com/search?q=bingAI"
		}
	}

	//保留头部信息
	const dropHeaders = ['cookie', 'user-agent'];
	let he = reqHeaders.entries();
	for (let h of he) {
		const key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	return await fetch(request.url.replace(aiDrawCreateExp,"https://www.bing.com/images/create"), fp);
}

async function bingChatHub(request) {
	// 如果请求包含 Upgrade 头，说明是 WebSocket 连接
	if (request.headers.get('Upgrade') === 'websocket') {
		const webSocketPair = new WebSocketPair()
		const serverWebSocket = webSocketPair[1]
		var bingws = new WebSocket('wss://sydney.bing.com/sydney/ChatHub')
		serverWebSocket.onmessage = event => {
			bingws.send(event.data);
		}
		bingws.onmessage = event =>{
			serverWebSocket.send(event.data)
		}
		bingws.onopen = event =>{
			serverWebSocket.accept();
		}
		bingws.onclose = event =>{
			serverWebSocket.close(event.code,event.reason);
		}
		bingws.onerror = event =>{
			serverWebSocket.send(JSON.stringify({
				type: 'error',
				mess :"workers接到bing错误："+event
			}));
			serverWebSocket.close();
		}
		serverWebSocket.onerror = event =>{
			serverWebSocket.close();
		}
		serverWebSocket.onclose = event =>{
			bingws.close(event.code,event.reason);
		}

		return new Response(null, { status: 101, webSocket: webSocketPair[0] })
	  } else {
		return new Response('这不是websocket请求！')
	  }
}

async function bingCreate(request) {
	//请求头部、返回对象
	let reqHeaders = new Headers(request.headers);
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {}
	}

	//保留头部信息
	const dropHeaders = ['cookie', 'user-agent'];
	let he = reqHeaders.entries();
	for (let h of he) {
		const key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	return await fetch('https://www.bing.com/turing/conversation/create', fp);
}

async function bingcopilotwaitlist(request) {
	//请求头部、返回对象
	let reqHeaders = new Headers(request.headers);
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {}
	}
	//保留头部信息
	const dropHeaders = ['cookie', 'user-agent'];
	let he = reqHeaders.entries();
	for (let h of he) {
		const key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	return await fetch('https://www.bing.com/msrewards/api/v1/enroll?publ=BINGIP&crea=MY00IA&pn=bingcopilotwaitlist&partnerId=BingRewards&pred=true&wtc=MktPage_MY0291', fp);
}

