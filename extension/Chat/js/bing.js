var chat = document.getElementById('chat');
var searchSuggestions = document.getElementById('SearchSuggestions');
searchSuggestions.style.opacity = 1;
var chatTypeDiv = document.getElementById('chatTypeDiv');
var goGoSubtitle = document.getElementById('goGoSubtitle');
var docTitle = document.getElementById('docTitle');
var restart_button = document.getElementById('restart');
var input_text = document.getElementById('input');
var send_button = document.getElementById('send');
let restartNewChat = document.getElementById('restartNewChat');
let chatRecordsNameInputDiv = document.getElementById('ChatRecordsNameInputDiv');
let chatRecordsServer = document.getElementById('ChatRecordsServer');
let chatRecordsNameInput = document.getElementById('ChatRecordsNameInput');
let chatRecordsNameNo = document.getElementById('ChatRecordsNameNo');
let showChatRecords = document.getElementById('showChatRecords');
let chatRecordsListDivOut = document.getElementById("ChatRecordsListDivOut");
let chatRecordsListDiv = document.getElementById("ChatRecordsListDiv");
var isSaveChatRecords = false;
var thisChatType;

reSetStartChatMessage();

function getCurrentTime() {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let seconds = date.getSeconds();
	return year + "-" + month + "-" + day + " " + hours + "-" + minutes + "-" + seconds;
}

//(string)
function addMyChat(message) {
	let bobo = document.createElement('div');
	bobo.style.whiteSpace = 'pre-wrap';
	bobo.innerText = message;
	bobo.classList.add('bobo');
	bobo.classList.add('markdown-body');
	let go = document.createElement('div');
	go.classList.add('my');
	go.appendChild(bobo);
	chat.appendChild(go);
}

//(string)
function addError(message) {
	let go = document.createElement('div');
	go.classList.add('error');
	go.innerHTML = message;
	chat.appendChild(go);
}

//尝试获取聊天权限按钮
function addNoPower() {
	let go = document.createElement('div');
	go.classList.add('NoPower');
	go.innerHTML = '加入候补名单';
	chat.appendChild(go);
	go.onclick = () => {
		if (go.geting) {
			return;
		}
		go.geting = true;
		go.innerHTML = '正在请求申请加入候补名单..';
		getPower().then((rett) => {
			if (rett.ok == true) {
				go.innerHTML = '请求成功！请刷新页面重试，如果无权限使用请等待几天后重试。'
				return;
			}
			go.innerHTML = '错误：' + rett.message;
		});
	}
}

let onMessageIsOKClose = false;
//(json)
function onMessage(json, returnMessage) {
	if (json.type == "close") {
		isSpeakingFinish();
		if (!onMessageIsOKClose) {
			addError("聊天中断 可能是网络问题");
		}
		return;
	}
	if (json.type == 'error') {
		addError("连接错误：" + json.mess);
		return;
	}
	onMessageIsOKClose = false
	if (json.type == 3) {
		onMessageIsOKClose = true;
		returnMessage.getCatWebSocket().close(1000, 'ok');
	} else if (json.type == 1) {
		porserArguments(json.arguments);
	} else if (json.type == 2) {
		porserType2Item(json.item);
	} else {
		console.log(JSON.stringify(json));
	}
}


//页面逻辑


//回车键发送 ctrl+回车换行
input_text.addEventListener('keydown', (event) => {
	if (event.key === 'Enter' && !event.altKey) {
		event.preventDefault();
		//调用发送消息的函数
		send_button.onclick();
	} else if (event.key === 'Enter' && event.altKey) {
		event.preventDefault();
		// 插入换行符
		input_text.value += "\n";
	}
});


//全局变量
var talk;
var returnMessage;
var isSpeaking = false;


/**重置聊天框和聊天建议到初始状态 */
function reSetStartChatMessage(type) {
	chat.innerHTML = `
		<div class="bing">
			<div class="adaptiveCardsFatherDIV">
				<div class="textBlock markdown-body">
					${nextStartMessage(type)}
				</div>
				<div class="throttling">
					0 / 0
				</div>
			</div>
		</div>
		`;
	searchSuggestions.innerHTML = '';
	let prs = nextStartProposes();
	prs.forEach((s) => {
		let a = document.createElement('a');
		a.innerHTML = s;
		a.onclick = (even) => {
			if (searchSuggestions.style.opacity >= 1) {
				send(even.target.innerHTML);
			}
		}
		searchSuggestions.appendChild(a);
	});
	goGoSubtitle.innerText = 'Chat';
	docTitle.innerText = 'Bing AI';
}

/**正在创建聊天 */
function isAskingToMagic() {
	isSpeaking = true;
	goGoSubtitle.innerText = 'Chat - 连接到代理. ';
	send_button.value = '创建中.';
	searchSuggestions.innerHTML = '';
}

/**bing正在回复 */
function isSpeakingStart(chatWithMagic, sendText) {
	isSpeaking = true;
	if (chatWithMagic == undefined) {
		goGoSubtitle.innerText = 'Chat - 发送中.';
	} else if (chatWithMagic) {
		goGoSubtitle.innerText = 'Chat - 读取中.';
	} else {
		goGoSubtitle.innerText = 'Chat - 回应中.';
	}
	if (sendText) {
		docTitle.innerText = sendText;
	}
	send_button.value = '响应中.';
	searchSuggestions.innerHTML = '';
}

/**bing回复结束 */
function isSpeakingFinish() {
	send_button.value = '✓';
	goGoSubtitle.innerText = 'Chat - 正在保存聊天记录';
	//回复结束,调用自动保存聊天记录
	autoSaveChatRecords().then(() => {
		goGoSubtitle.innerText = 'Chat - 已发送';
		isSpeaking = false;
		reloadChatRecordsList();
	});
}

async function send(text) {
	if (isSpeaking) {
		return;
	}
	chatTypeDiv.style.opacity = 0;
	addMyChat(text);
	if (!talk) {
		isAskingToMagic();
		let r = await createChat(thisChatType);
		if (!r.ok) {
			addError(r.message);
			if (r.type == 'NoPower') {
				addNoPower();
			}
			isSpeakingFinish();
			return;
		}
		talk = r.obj;
	}
	isSpeakingStart();
	let r = await talk.sendMessage(text, onMessage)
	if (!r.ok) {
		isSpeakingFinish();
		addError(r.message);
		return;
	}
	returnMessage = r.obj;
	isSpeakingStart(r.chatWithMagic, text);
}

send_button.onclick = () => {
	if (isSpeaking) {
		return;
	}
	let text = input_text.value;
	input_text.value = '';
	input_update_input_text_sstyle_show_update({ target: input_text });
	if (!text) {
		alert('内容为空');
		return;
	}
	send(text);
};

//开始新主题
restart_button.onclick = () => {
	onMessageIsOKClose = true;
	if (returnMessage) {
		returnMessage.getCatWebSocket().close(1000, 'ok');
		returnMessage = undefined;
	}
	talk = undefined;
	isSpeakingFinish();
	reSetStartChatMessage();
	chatTypeDiv.style.opacity = 1;

	//重置自动保存状态
	//还原自动保存状态
	isSaveChatRecords = false;
	chatRecordsNameInput.value = '新的聊天';
	chatRecordsServer.classList.remove('noshow');
	chatRecordsNameInputDiv.classList.add('noshow');
};



//滚动到底部显示收聊天建议

// 定义一个函数处理滚动事件
function handleScroll() {
	// 获取文档的高度和滚动距离
	var docHeight = document.body.scrollHeight;
	var scrollPos = window.pageYOffset;
	// 如果滚动到底部，显示元素，否则隐藏元素
	if (scrollPos + window.innerHeight >= docHeight - 50) {
		searchSuggestions.style.opacity = 1;
	} else {
		searchSuggestions.style.opacity = 0;
	}
}
// 添加滚动事件监听器
window.addEventListener("scroll", handleScroll);




//选择聊天类型，创造力，平衡，精准
let backgroundDIV = document.getElementById('background');
let chatTypeChoseCreate = document.getElementById('chatTypeChoseCreate');
let chatTypeChoseBalance = document.getElementById('chatTypeChoseBalance');
let chatTypeChoseAccurate = document.getElementById('chatTypeChoseAccurate');
//默认平衡
thisChatType = 'balance';
//创造力模式
chatTypeChoseCreate.onclick = () => {
	if (chatTypeDiv.style.opacity == 0) {
		return;
	}
	setChatModType('create');
	reSetStartChatMessage('create');
}
//平衡模式
chatTypeChoseBalance.onclick = () => {
	if (chatTypeDiv.style.opacity == 0) {
		return;
	}
	setChatModType('balance');
	reSetStartChatMessage('balance');
}
//准确模式
chatTypeChoseAccurate.onclick = () => {
	if (chatTypeDiv.style.opacity == 0) {
		return;
	}
	setChatModType('accurate');
	reSetStartChatMessage('accurate');
}

//设置聊天模式
function setChatModType(chatType) {
	if (chatType == 'create') {//有创造力的
		thisChatType = 'create';
		chatTypeChoseCreate.classList.add('Chose');
		chatTypeChoseBalance.classList.remove('Chose');
		chatTypeChoseAccurate.classList.remove('Chose');
		backgroundDIV.className = 'a';
	} else if (chatType == 'balance') {//平衡
		thisChatType = 'balance';
		chatTypeChoseCreate.classList.remove('Chose');
		chatTypeChoseBalance.classList.add('Chose');
		chatTypeChoseAccurate.classList.remove('Chose');
		backgroundDIV.className = 'b';
	} else if (chatType == 'accurate') {//精确的
		thisChatType = 'accurate';
		chatTypeChoseCreate.classList.remove('Chose');
		chatTypeChoseBalance.classList.remove('Chose');
		chatTypeChoseAccurate.classList.add('Chose');
		backgroundDIV.className = 'c';
	} else {
		console.warn("错误的聊天类型", chatType);
	}
}


// "resourceTypes": [
// 	"main_frame",
// 	"sub_frame",
// 	"stylesheet",
// 	"script",
// 	"image",
// 	"font",
// 	"object",
// 	"xmlhttprequest",
// 	"ping",
// 	"csp_report",
// 	"media",
// 	"websocket",
// 	"webtransport",
// 	"webbundle",
// 	"other"
//   ]


//发送按钮出现逻辑
function input_update_input_text_sstyle_show_update(v) {
	if (v.target.value) {
		send_button.style.opacity = 1;
	} else {
		send_button.style.opacity = 0;
	}
}
input_text.addEventListener("input", input_update_input_text_sstyle_show_update);
input_update_input_text_sstyle_show_update({ target: input_text });




//保存聊天记录,如果保存成功返回聊天记录列表，当前没有聊天返回undefined
//name 聊天记录的名称
async function saveChatRecords(name) {
	//保存聊天记录
	if (talk) {
		let conversationId = talk.sendMessageManager.conversationId;
		let messobj = {
			name: name,
			daateTime: getCurrentTime(),
			startTime: talk.sendMessageManager.startTime,
			invocationId: talk.sendMessageManager.invocationId,
			clientId: talk.sendMessageManager.clientId,
			conversationSignature: talk.sendMessageManager.conversationSignature,
			optionsSets: talk.sendMessageManager.optionsSets,
			html: chat.innerHTML,
			searchSuggestionsHtml:searchSuggestions.innerHTML
		};
		return await ChatRecords.set(conversationId, messobj);
	}
	return undefined;
}

//加载聊天记录,成功返回加载的聊天记录，聊天记录不存在返回undefined
async function loadChatRecords(conversationId) {
	let chatRecords = await ChatRecords.getAll();
	let theRecords = chatRecords[conversationId];
	if (!theRecords) {
		return undefined;
	}
	//还原chat对象
	talk = new Chat(
		conversationId,
		theRecords.clientId,
		theRecords.conversationSignature,
		theRecords.optionsSets,
		theRecords.invocationId
	);
	//还原页面
	chat.innerHTML = theRecords.html;
	//还原聊天建议
	searchSuggestions.innerHTML = theRecords.searchSuggestionsHtml;
	searchSuggestionsAddOnclick();
	//还原自动保存状态
	isSaveChatRecords = true;
	chatRecordsNameInput.value = theRecords.name;
	chatRecordsServer.classList.add('noshow');
	chatRecordsNameInputDiv.classList.remove('noshow');
	//还原聊天类型
	setChatModType(theRecords.optionsSets);
	//隐藏聊天类型选择按钮
	chatTypeDiv.style.opacity = 0;
	return theRecords;
}

//给聊天建议添设置点击事件
async function searchSuggestionsAddOnclick(){
	let adds = document.querySelectorAll("#SearchSuggestions>a");
	for(let add in adds){
		adds[add].onclick = (event)=>{
			if(searchSuggestions.style.opacity>=1){
                send(event.target.innerHTML);
            }
		}
	}
}

//自动保存，如果开启保存当前聊天记录就保存，这个函数在需要自动保存的时候调用。
async function autoSaveChatRecords() {
	if (isSaveChatRecords) {
		return await saveChatRecords(chatRecordsNameInput.value);
	}
}

async function reloadChatRecordsList() {
	chatRecordsListDiv.innerHTML = '';
	let all = await ChatRecords.getAll();
	for (let i in all) {
		let theChat = all[i];
		let div = document.createElement('div');
		div.innerHTML = `
		<h3>${theChat.name}</h3>
		<p>${theChat.daateTime}</p>
		`;
		div.onclick = () => {//被点击时就加载当前聊天，隐藏聊天记录列表
			if (isSpeaking) {
				alert('请等待当前响应结束。');
				return;
			}
			chatRecordsListDivOut.classList.add('notShow');
			loadChatRecords(i);
		}
		chatRecordsListDiv.appendChild(div);
	}
}

//保存聊天记录按钮
chatRecordsServer.onclick = () => {
	isSaveChatRecords = true;
	chatRecordsServer.classList.add('noshow');
	chatRecordsNameInputDiv.classList.remove('noshow');
	saveChatRecords(chatRecordsNameInput.value).then(() => {
		reloadChatRecordsList();
	});
}
//删除聊天记录按钮
chatRecordsNameNo.onclick = () => {
	isSaveChatRecords = false;
	chatRecordsServer.classList.remove('noshow');
	chatRecordsNameInputDiv.classList.add('noshow');
	//如果有聊天对象就删除当前聊天对象保存的聊记录
	if (talk) {
		let conversationId = talk.sendMessageManager.conversationId;
		ChatRecords.set(conversationId).then(() => {
			reloadChatRecordsList();
		});
	}
}
//输入文字改变时，如果保存聊天记录，保存当前聊天记录
chatRecordsNameInput.onchange = () => {
	autoSaveChatRecords().then(() => {
		reloadChatRecordsList();
	});
}


//显示和隐藏聊天记录
showChatRecords.onclick = () => {
	if (!chatRecordsListDivOut.classList.contains('notShow')) {
		chatRecordsListDivOut.classList.add('notShow');
		return;
	}
	chatRecordsListDivOut.classList.remove('notShow');
	//加载聊天记录列表
	reloadChatRecordsList();
}





