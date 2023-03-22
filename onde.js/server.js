
const fetch = require('node-fetch');
const http = require('http');
http.createServer(handleRequest).listen(8443);
async function handleRequest(request,response) {
	//console.log(request.headers);
	//请求头部、返回对象
	let reqHeaders = request.headers;
	//构建 fetch 参数
	let fp = {
		method: request.method,
		headers: {}
	}

	//保留头部信息
	const dropHeaders = ['cookie','user-agent:'];
	for (let h in reqHeaders) {
		const key = h,
			value = reqHeaders[h];
		if (dropHeaders.includes(key)) {
			fp.headers[key] = value;
		}
	}
	let res;
	if(request.url.startsWith('/bingcopilotwaitlist')){
		res = await fetch('https://www.bing.com/msrewards/api/v1/enroll?publ=BINGIP&crea=MY00IA&pn=bingcopilotwaitlist&partnerId=BingRewards&pred=true&wtc=MktPage_MY0291', fp);
	}else{
		res = await fetch('https://www.bing.com/turing/conversation/create', fp);
	}
	response.writeHead(res.status,res.headers);
	response.write(await res.text());
	response.end();
}
