var expUrl = new RegExp('^(https?://)([-a-zA-z]+\\.)+([-a-zA-z]+)+');
function timeString(){
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
  return URL.createObjectURL(new Blob()).split('/')[3].replace(/-/g,'');
}

function getUuid() {
  return URL.createObjectURL(new Blob()).split('/')[3];
}

class SendMessageManager {
	//(会话id，客户端id，签名id，是否是开始)
	//(string,string,string,boolena)
	constructor(conversationId, clientId, conversationSignature) {
		this.startTime = timeString();
		this.invocationId = 1;
		this.conversationId = conversationId;
		this.clientId = clientId;
		this.conversationSignature = conversationSignature;
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
		let previousMessages = [{
			"text": "重新开始总是很棒。问我任何问题!",
			"author": "bot",
			"adaptiveCards": [],
			"suggestedResponses": [{
				"text": "如何制作蛋糕?",
				"contentOrigin": "DeepLeo",
				"messageType": "Suggestion",
				"messageId": getUuid(),
				"offense": "Unknown"
			}, {
				"text": "给我说个笑话",
				"contentOrigin": "DeepLeo",
				"messageType": "Suggestion",
				"messageId": getUuid(),
				"offense": "Unknown"
			}, {
				"text": "教我有关登月的信息",
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
				"optionsSets": ["nlu_direct_response_filter", "deepleo", "disable_emoji_spoken_text",
					"responsible_ai_policy_235", "enablemm", "harmonyv3", "glprompt", "jbf",
					"hubcancel", "dv3sugg"
				],
				"allowedMessageTypes": ["Chat", "InternalSearchQuery", "InternalSearchResult",
					"Disengaged",
					"InternalLoaderMessage", "RenderCardRequest", "AdsQuery", "SemanticSerp",
					"GenerateContentQuery", "SearchQuery"
				],
				"sliceIds": ["styleqnatg", "scfraithct", "scraith70", "revdv3tf2", "sydpayajax",
					"linkimgintf",
					"sydperfinput", "308enbsd", "308sdcnt2", "308jbf2", "0310wlthrots0",
					"302blcklists0",
					"314glprompt", "303hubcancel"
				],
				"traceId": getUuidNojian(),
				"isStartOfSession": (this.invocationId <= 1) ? true : false,
				"message": {
					"locale": "zh-CN",
					"market": "zh-CN",
					"region": "US",
					"location": "lat:47.639557;long:-122.128159;re=1000m;",
					"locationHints": [{
						"Center": {
							"Latitude": 30.480699493524973,
							"Longitude": 114.39288153402381
						},
						"RegionType": 2,
						"SourceType": 11
					}, {
						"country": "Singapore",
						"state": "Central Singapore",
						"city": "Singapore",
						"timezoneoffset": 8,
						"countryConfidence": 8,
						"Center": {
							"Latitude": 1.2894,
							"Longitude": 103.85
						},
						"RegionType": 2,
						"SourceType": 1
					}],
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
				if(sss[i] == ''){
					continue;
				}
				for (let j in this.onMessage) {
					if ((typeof this.onMessage[j]) == 'function') {
						try{
							this.onMessage[j](JSON.parse(sss[i]),this);
						}catch(e){
							console.warn(e)
						}
					}
				}
			}
		}
		catWebSocket.onclose = (mess) => {
			for (let i in this.onMessage) {
				if ((typeof this.onMessage[i]) == 'function') {
					try{
						this.onMessage[i]({
							type: 'close'
						},this);
					}catch(e){
						console.warn(e)
					}
				}
			}
		}
	}
	/*
	获取消息WebSocket
	*/
	getCatWebSocket(){
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
	//(string,string,string)
	constructor(charID, clientId, conversationSignature) {
		this.sendMessageManager = new SendMessageManager(charID, clientId, conversationSignature);
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
	sendMessage(message,onMessage) {
		try {
			let chatWebSocket = new WebSocket("wss://sydney.bing.com/sydney/ChatHub");
			chatWebSocket.onopen = () => {
				this.sendMessageManager.sendShakeHandsJson(chatWebSocket);
				this.sendMessageManager.sendChatMessage(chatWebSocket, message);
			}
			return {
				ok: true,
				message: 'ok',
				obj: new ReturnMessage(chatWebSocket,onMessage)
			};
		} catch (e) {
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

//创建一个新对话
/**
 返回结构，如果ok等于false则无chat对象
 {
	 ok:true|false,
	 message:显示消息,
	 obj:Cat对象
 }
 */
async function createChat() {
	//设置cookies到魔法链接
	let magicUrl = await getMagicUrl();
	if (!magicUrl) {
		return {
			ok: false,
			message: "需要设置魔法链接才能聊天哦！"
		};
	}
	if(!expUrl.test(magicUrl)){
		return {
			ok: false,
			message: "魔法链接不正确！请修改魔法链接。"
		};
	}
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
		chrome.cookies.set(r);
	}
	
	try {
		let res = await fetch(magicUrl);
		let resjson = await res.json();
		if (!resjson.result) {
			return {
				ok: false,
				message: "未知错误！"
			};
		}
		if (resjson.result.value != 'Success') {
			return {
				ok: false,
				message: resjson.result.message.replace('Sorry, you need to login first to access this service.','首先你需要在bing登录微软账号！请前往 https://cn.bing.com/ 登录微软账号。')
			};
		}
		return {
			ok: true,
			message: 'ok',
			obj: new Chat(resjson.conversationId, resjson.clientId, resjson.conversationSignature)
		};
	} catch (e) {
		return {
			ok: false,
			message: "发生错误,可能是魔法链接无法链接:" + e.message
		};
	}

}
