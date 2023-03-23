export default {
	async fetch(request, _env) {
		return await handleRequest(request);
	}
}

let bingcopilotwaitlist = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+/bingcopilotwaitlist');
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
	const dropHeaders = ['cookie','user-agent'];
	let he = reqHeaders.entries();
	for (let h of he) {
		const key = h[0],
			value = h[1];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	if(bingcopilotwaitlist.test(request.url)){
		return await fetch('https://www.bing.com/msrewards/api/v1/enroll?publ=BINGIP&crea=MY00IA&pn=bingcopilotwaitlist&partnerId=BingRewards&pred=true&wtc=MktPage_MY0291', fp);
	}else{
		return await fetch('https://www.bing.com/turing/conversation/create', fp);
	}
}
