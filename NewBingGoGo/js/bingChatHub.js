var expUrl = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+\\S*$');
function timeString() {
	var d = new Date();
	var year = d.getFullYear();
	var month = (d.getMonth() + 1).toString().padStart(2, "0");
	var date = d.getDate().toString().padStart(2, "0");
	var hour = d.getHours().toString().padStart(2, "0");
	var minute = d.getMinutes().toString().padStart(2, "0");
	var second = d.getSeconds().toString().padStart(2, "0");
	var offset = "+08:00"; // 你可以根据需要修改这个值
	var s = year + "-" + month + "-" + date + "T" + hour + ":" + minute + ":" + second + offset;
	return s;
}

function getUuidNojian() {
	return URL.createObjectURL(new Blob()).split('/')[3].replace(/-/g, '');
}

function getUuid() {
	return URL.createObjectURL(new Blob()).split('/')[3];
}

//聊天选项
let chatTypes = {
	//更有创造力选项
	create: [
		"nlu_direct_response_filter",
		"deepleo",
		"disable_emoji_spoken_text",
		"responsible_ai_policy_235",
		"enablemm",
		"h3imaginative",
		"h3toppfp3",
		"forcerep",
		"dv3sugg",
		"gencontentv3",
		"gencontentv3"
	],
	//balance 平衡模式选项
	balance: [
		"nlu_direct_response_filter",
		"deepleo",
		"disable_emoji_spoken_text",
		"responsible_ai_policy_235",
		"enablemm",
		"galileo",
		"h3toppfp3",
		"forcerep",
		"dv3sugg",
		"glprompt"
	],
	//精准选项
	accurate: [
		"nlu_direct_response_filter",
		"deepleo",
		"disable_emoji_spoken_text",
		"responsible_ai_policy_235",
		"enablemm",
		"h3precise",
		"h3toppfp3",
		"forcerep",
		"dv3sugg"
	]
}

//接收消息类型
let allowedMessageTypes = [
	"Chat",
	"InternalSearchQuery",
	"InternalSearchResult",
	"Disengaged",
	"InternalLoaderMessage",
	"RenderCardRequest",
	"AdsQuery",
	"SemanticSerp",
	"GenerateContentQuery",
	"SearchQuery"
]

//切片id，也不知道是啥意思，反正官网的更新了
let sliceIds = [
	"321bic62up",
	"321bic62",
	"styleqnatg",
	"creatorv2c",
	"sydpayajax",
	"sydperfinput",
	"toneexp",
	"321toppfp3",
	"323frep",
	"303hubcancls0",
	"321jobsgndv0"
]

class SendMessageManager {
	//(会话id，客户端id，签名id，是否是开始)
	//(string,string,string,boolena)
	constructor(conversationId, clientId, conversationSignature) {
		this.startTime = timeString();
		this.invocationId = 1;
		this.conversationId = conversationId;
		this.clientId = clientId;
		this.conversationSignature = conversationSignature;
		this.optionsSets = chatTypes.balance;
	}

	//chatTypes中的一种
	setChatType(chatType) {
		this.optionsSets = chatType;
	}

	//发送json数据
	sendJson(chatWebSocket, json) {
		let go = JSON.stringify(json) + '\u001e';
		chatWebSocket.send(go);
		console.log('发送', go)
	}
	//获取用于发送的握手数据
	//(WebSocket)
	sendShakeHandsJson(chatWebSocket) {
		this.sendJson(chatWebSocket, {
			"protocol": "json",
			"version": 1
		});
	}
	//获取用于发送的聊天数据
	//(WebSocket,sreing)
	sendChatMessage(chatWebSocket, chat) {
		let pos = getStartProposes();
		let previousMessages = [{
			"text": getStartMessage(),
			"author": "bot",
			"adaptiveCards": [],
			"suggestedResponses": [{
				"text": pos[0],
				"contentOrigin": "DeepLeo",
				"messageType": "Suggestion",
				"messageId": getUuid(),
				"offense": "Unknown"
			}, {
				"text": pos[1],
				"contentOrigin": "DeepLeo",
				"messageType": "Suggestion",
				"messageId": getUuid(),
				"offense": "Unknown"
			}, {
				"text": pos[2],
				"contentOrigin": "DeepLeo",
				"messageType": "Suggestion",
				"messageId": getUuid(),
				"offense": "Unknown"
			}],
			"messageId": getUuid(),
			"messageType": "Chat"
		}];
		let json = {
			"arguments": [{
				"source": "cib",
				"optionsSets": this.optionsSets,
				"allowedMessageTypes": allowedMessageTypes,
				"sliceIds": sliceIds,
				"verbosity": "verbose",
				"traceId": getUuidNojian(),
				"isStartOfSession": (this.invocationId <= 1) ? true : false,
				"message": {
					"locale": "zh-CN",
					"market": "zh-CN",
					"region": "US",
					"location": "lat:47.639557;long:-122.128159;re=1000m;",
					"locationHints": [
						{
							"Center": {
								"Latitude": 30.474109798833613,
								"Longitude": 114.39626256171093
							},
							"RegionType": 2,
							"SourceType": 11
						},
						{
							"country": "United States",
							"state": "California",
							"city": "Los Angeles",
							"zipcode": "90060",
							"timezoneoffset": -8,
							"dma": 803,
							"countryConfidence": 8,
							"cityConfidence": 5,
							"Center": {
								"Latitude": 33.9757,
								"Longitude": -118.2564
							},
							"RegionType": 2,
							"SourceType": 1
						}
					],
					"timestamp": this.startTime,
					"author": "user",
					"inputMethod": "Keyboard",
					"text": chat,
					"messageType": "Chat"
				},
				"conversationSignature": this.conversationSignature,
				"participant": {
					"id": this.clientId
				},
				"conversationId": this.conversationId,
				"previousMessages": (this.invocationId <= 1) ? previousMessages : undefined
			}],
			"invocationId": this.invocationId.toString(),
			"target": "chat",
			"type": 4
		};
		this.sendJson(chatWebSocket, json);
		this.invocationId++;
	}
}





//处理返回消息的类
class ReturnMessage {
	//(WebSocket,function:可以不传)
	constructor(catWebSocket, lisin) {
		this.catWebSocket = catWebSocket;
		this.onMessage = [(v) => {
			//console.log(JSON.stringify(v))
		}];
		if ((typeof lisin) == 'function') {
			this.regOnMessage(lisin);
		}
		catWebSocket.onmessage = (mess) => {
			//console.log('收到', mess.data);
			let sss = mess.data.split('\u001e');
			for (let i = 0; i < sss.length; i++) {
				if (sss[i] == '') {
					continue;
				}
				for (let j in this.onMessage) {
					if ((typeof this.onMessage[j]) == 'function') {
						try {
							this.onMessage[j](JSON.parse(sss[i]), this);
						} catch (e) {
							console.warn(e)
						}
					}
				}
			}
		}
		catWebSocket.onclose = (mess) => {
			for (let i in this.onMessage) {
				if ((typeof this.onMessage[i]) == 'function') {
					try {
						this.onMessage[i]({
							type: 'close',
							mess: '连接关闭'
						}, this);
					} catch (e) {
						console.warn(e)
					}
				}
			}
		}
		catWebSocket.onerror = (mess) => {
			console.log(mess);
			for (let i in this.onMessage) {
				if ((typeof this.onMessage[i]) == 'function') {
					try {
						this.onMessage[i]({
							type: 'error',
							mess: mess
						}, this);
					} catch (e) {
						console.warn(e)
					}
				}
			}
		}
	}
	/*
	获取消息WebSocket
	*/
	getCatWebSocket() {
		return this.catWebSocket;
	}
	/**
	 * 注册收到消息监听器
	 */
	//(function(json,ReturnMessage))
	regOnMessage(theFun) {
		this.onMessage[this.onMessage.length] = theFun;
	}
}
//处理聊天的类
class Chat {
	//theChatType chatTypes变量中的其中一个
	//(string,string,string,int)
	constructor(magicUrl, chatWithMagic, charID, clientId, conversationSignature, theChatType) {
		this.magicUrl = magicUrl;
		this.chatWithMagic = chatWithMagic;
		this.sendMessageManager = new SendMessageManager(charID, clientId, conversationSignature);
		if (theChatType) {
			this.sendMessageManager.setChatType(theChatType);
		}
	}
	/**
	 * 返回
	 {
		 ok:true|false，
		 message:显示消息，
		 obj:ReturnMessage对象
	   }
	 当ok等于false时，不返回ReturnMessage
	 * 参数 消息string,当收到消息的函数,当关闭时函数
	 */
	//(string,function:可以不传)
	sendMessage(message, onMessage) {
		try {
			let restsrstUrl = 'wss://sydney.bing.com/sydney/ChatHub';
			if (this.chatWithMagic) {
				restsrstUrl = URLTrue(this.magicUrl.replace('http', 'ws'), "ChatHub");
			}
			let chatWebSocket = new WebSocket(restsrstUrl);
			chatWebSocket.onopen = () => {
				this.sendMessageManager.sendShakeHandsJson(chatWebSocket);
				this.sendMessageManager.sendChatMessage(chatWebSocket, message);
			}
			return {
				ok: true,
				message: 'ok',
				obj: new ReturnMessage(chatWebSocket, onMessage),
				chatWithMagic: this.chatWithMagic
			};
		} catch (e) {
			console.warn(e)
			return {
				ok: false,
				message: "发生错误,可能是网络连接错误:" + e.message
			};
		}
	}
}

async function setMagicUrl(url) {
	return await chrome.storage.local.set({
		GoGoUrl: url
	});
}

async function getMagicUrl() {
	return (await chrome.storage.local.get('GoGoUrl')).GoGoUrl;
}
async function getChatHubWithMagic() {
	return (await chrome.storage.local.get('ChatHubWithMagic')).ChatHubWithMagic;
}

/***
 * 补齐url
 */
function URLTrue(magicUrl, thiePath) {
	let url = magicUrl;
	if (!url.endsWith('/')) {
		url = url + '/';
	}
	url = url + thiePath;
	return url;
}

//获取newbing权限
async function getPower() {
	//设置cookies到魔法链接
	let magicUrl = await getMagicUrl();
	if (!magicUrl) {
		return {
			ok: false,
			message: "需要设置魔法链接才能获取权限哦！"
		};
	}
	if (!expUrl.test(magicUrl)) {
		return {
			ok: false,
			message: "魔法链接不正确！请修改魔法链接。"
		};
	}
	await copyCookies(magicUrl);

	try {
		await fetch(URLTrue(magicUrl, 'bingcopilotwaitlist'));
		return {
			ok: true,
			message: "ok"
		};
	} catch (e) {
		console.warn(e);
		return {
			ok: false,
			message: "发生错误,可能是魔法链接无法链接:" + e.message
		};
	}
}


async function copyCookies(magicUrl) {
	let cookiesjson = [];
	let fr = [".bing.com"];
	for (let i = 0; i < fr.length; i++) {
		let cookies = await chrome.cookies.getAll({
			domain: fr[i]
		});
		cookies.map((m) => {
			cookiesjson[cookiesjson.length] = {
				domain: m.domain,
				name: m.name,
				value: m.value,
				path: m.path
			};
		});
	}
	for (let co in cookiesjson) {
		let r = {
			url: magicUrl,
			//domain: cookiesjson[co].domain,
			name: cookiesjson[co].name,
			value: cookiesjson[co].value,
			path: cookiesjson[co].path
		}
		await chrome.cookies.set(r);
	}
}

//创建一个新对话
/**
 返回结构，如果ok等于false则无chat对象
 {
	 ok:true|false,
	 message:显示消息,
	 obj:Cat对象
 }
 */
async function createChat(theChatType) {
	//设置cookies到魔法链接
	let chatWithMagic = await getChatHubWithMagic();
	let magicUrl = await getMagicUrl();
	if (!magicUrl) {
		return {
			ok: false,
			message: "需要设置魔法链接才能聊天哦！"
		};
	}
	if (!expUrl.test(magicUrl)) {
		return {
			ok: false,
			message: "魔法链接不正确！请修改魔法链接。"
		};
	}
	await copyCookies(magicUrl);

	try {
		let res = await fetch(URLTrue(magicUrl, 'Create'));
		let resjson = await res.json();
		if (!resjson.result) {
			console.warn(resjson);
			return {
				ok: false,
				message: "未知错误！"
			};
		}
		if (resjson.result.value != 'Success') {
			let type = resjson.result.value;
			let mess = resjson.result.message;
			if (resjson.result.value == 'UnauthorizedRequest') {
				type = 'NoLogin'
				mess = '首先你需要在bing登录微软账号！请前往 https://cn.bing.com/ 登录微软账号。';
			} else if (resjson.result.value == 'Forbidden') {
				type = 'NoPower'
				mess = '你还没有获得NewBing的使用权限';
			}
			console.warn(resjson);
			return {
				ok: false,
				type: type,
				message: mess
			};
		}
		return {
			ok: true,
			message: 'ok',
			obj: new Chat(magicUrl, chatWithMagic, resjson.conversationId, resjson.clientId, resjson.conversationSignature, theChatType)
		};
	} catch (e) {
		console.warn(e);
		return {
			ok: false,
			message: "发生错误,可能是魔法链接无法链接:" + e.message
		};
	}

}
