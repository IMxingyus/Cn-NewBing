var chat = document.getElementById('chat');
var searchSuggestions = document.getElementById('SearchSuggestions');
var chatTypeDiv = document.getElementById('chatTypeDiv');
var thisChatType;

reSetStartChatMessage();
reSetSearchSuggestions();

//(json)
function updateType2(json){
	if(json.item.result.value=='Throttled'){
		addError(json.item.result.message);
		addError('24 消息请求数达到了限制！');
	}else{
		console.log(JSON.stringify(json));
	}
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
function addNoPower(){
	let go = document.createElement('div');
	go.classList.add('NoPower');
	go.innerHTML = '加入候补名单;
	chat.appendChild(go);
	go.onclick = ()=>{
		if(go.geting){
			return;
		}
		go.geting = true;
		go.innerHTML = '正在申请加入候补名单...';
		getPower().then((rett)=>{
			if(rett.ok==true){
				go.innerHTML = '请求成功！请刷新页面重试，如果无权限使用请等待几天后重试。'
				return;
			}
			go.innerHTML = '错误：'+rett.message;
		});
	}
}

let onMessageIsOKClose = false;
//(json)
function onMessage(json, returnMessage) {
	if(json.type == "close"){
		isSpeakingFinish();
		if(!onMessageIsOKClose){
			addError("聊天中断 可能是网络问题");
		}
		return;
	}
	if(json.type == 'error'){
		addError("连接错误："+json.mess);
		return;
	}
	onMessageIsOKClose = false
	if (json.type == 3) {
		onMessageIsOKClose = true;
		returnMessage.getCatWebSocket().close(1000, 'ok');
	} else if (json.type == 1) {
		porserArguments(json.arguments);
	}else if(json.type == 2){
		updateType2(json);
	} else {
		console.log(JSON.stringify(json));
	}
}

//页面逻辑
var restart_button = document.getElementById('restart');
var input_text = document.getElementById('input');
var send_button = document.getElementById('send');

//全局变量
var talk;
var returnMessage;
var isSpeaking = false;

function isAskingToMagic(){
	isSpeaking = true;
	send_button.value = '发送中.';
	searchSuggestions.innerHTML = '';
}

function isSpeakingStart(chatWithMagic){
	isSpeaking = true;
	if(chatWithMagic){
		send_button.value = '发送中.';
	}else{
		send_button.value = '回应中.';
	}
	searchSuggestions.innerHTML = '';
}

function isSpeakingFinish(){
	isSpeaking = false;
	send_button.value = '发送';
}
function send(text){
	if(isSpeaking){
		return;
	}
	chatTypeDiv.style.opacity = 0;
	addMyChat(text);
	if (!talk) {
		isAskingToMagic();
		createChat(thisChatType).then((r) => {
			if (!r.ok) {
				addError(r.message);
				if(r.type=='NoPower'){
					addNoPower();
				}
				isSpeakingFinish();
				return;
			}
			talk = r.obj;
			isSpeakingStart();
			r = talk.sendMessage(text, onMessage);
			if (!r.ok) {
				isSpeakingFinish();
				addError(r.message);
				return;
			}
			returnMessage = r.obj;
			isSpeakingStart(r.chatWithMagic);
		});
		return;
	} else {
		isSpeakingStart();
		let r = talk.sendMessage(text, onMessage)
		if (!r.ok) {
			isSpeakingFinish();
			addError(r.message);
			return;
		}
		returnMessage = r.obj;
		isSpeakingStart(r.chatWithMagic);
	}
}

send_button.onclick = () => {
	if(isSpeaking){
		return;
	}
	let text = input_text.value;
	input_text.value = '';
	if (!text) {
		alert('什么都没有输入呀！');
		return;
	}
	send(text);
};

restart_button.onclick = () => {
	if(!returnMessage){
		return;
	}
    onMessageIsOKClose = true;
	returnMessage.getCatWebSocket().close(1000, 'ok');
	returnMessage = undefined;
	talk = undefined;
	reSetStartChatMessage();
	isSpeakingFinish();
	reSetSearchSuggestions();
	chatTypeDiv.style.opacity = 1;
};

function reSetStartChatMessage(){
	chat.innerHTML = `
		<div class="bing">
			<div class="adaptiveCardsFatherDIV">
				<div class="textBlock markdown-body">
					${nextStartMessage()}
				</div>
				<div class="throttling">
					0 / 0
				</div>
			</div>
		</div>
		`;
}

function reSetSearchSuggestions(){
	searchSuggestions.innerHTML = '';
	let prs = nextStartProposes();
	prs.forEach((s)=>{
		let a = document.createElement('a');
		a.innerHTML = s;
		a.onclick = (even)=>{
			send(even.target.innerHTML);
		}
		searchSuggestions.appendChild(a);
	});
}



//滚动到底部显示收聊天建议

// 定义一个函数处理滚动事件
function handleScroll() {
  // 获取文档的高度和滚动距离
  var docHeight = document.body.scrollHeight;
  var scrollPos = window.pageYOffset;
  // 如果滚动到底部，显示元素，否则隐藏元素
  if (scrollPos + window.innerHeight >= docHeight-50) {
    searchSuggestions.style.opacity = "100%";
  } else {
    searchSuggestions.style.opacity = "0%";
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
thisChatType = chatTypes.balance;
chatTypeChoseCreate.onclick = ()=>{
	if(chatTypeDiv.style.opacity == 0){
		return;
	}
	chatTypeChoseCreate.classList.add('Chose');
	chatTypeChoseBalance.classList.remove('Chose');
	chatTypeChoseAccurate.classList.remove('Chose');
	thisChatType = chatTypes.create;
	backgroundDIV.className = 'a';
}
chatTypeChoseBalance.onclick = ()=>{
	if(chatTypeDiv.style.opacity == 0){
		return;
	}
	chatTypeChoseCreate.classList.remove('Chose');
	chatTypeChoseBalance.classList.add('Chose');
	chatTypeChoseAccurate.classList.remove('Chose');
	thisChatType = chatTypes.balance;
	backgroundDIV.className = 'b';
}
chatTypeChoseAccurate.onclick = ()=>{
	if(chatTypeDiv.style.opacity == 0){
		return;
	}
	chatTypeChoseCreate.classList.remove('Chose');
	chatTypeChoseBalance.classList.remove('Chose');
	chatTypeChoseAccurate.classList.add('Chose');
	thisChatType = chatTypes.accurate;
	backgroundDIV.className = 'c';
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
