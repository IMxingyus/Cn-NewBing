export default {
	async fetch(request, _env) {
		return await handleRequest(request);
	}
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
	//请求头部、返回对象
	let reqHeaders = new Headers(request.headers);
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {}
	}

	//保留头部信息
	const dropHeaders = ['cookie','user-agent:'];
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
