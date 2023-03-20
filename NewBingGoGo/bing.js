var chat = document.getElementById('chat');
var searchSuggestions = document.getElementById('SearchSuggestions');

reSetStartChatMessage();
reSetSearchSuggestions();

//(json)
function updateType2(json){
	if(json.item.result.value=='Throttled'){
		addError(json.item.result.message);
		addError('24消息请求数达到了限制！');
	}else{
		console.log(JSON.stringify(json));
	}
}

//(string)
function addMyChat(message) {
	let go = document.createElement('div');
	go.classList.add('my');
	go.innerHTML = `
	<div class="bobo">
		<div class="markdown-body">${message.replaceAll('\n','<br>').replaceAll(" ","&nbsp;")}</div>
	</div>`
	chat.appendChild(go);
}

//(string)
function addError(message) {
	let go = document.createElement('div');
	go.classList.add('error');
	go.innerHTML = message;
	chat.appendChild(go);
}

let onMessageIsOKClose = false;
//(json)
function onMessage(json, returnMessage) {
	if(json.type == "close"){
		isSpeakingFinish();
		if(!onMessageIsOKClose){
			addError("聊天异常中断了！可能是网络问题。");
		}
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
	send_button.value = '正在请求魔法.';
	searchSuggestions.innerHTML = '';
}

function isSpeakingStart(){
	isSpeaking = true;
	send_button.value = '正在响应.';
	searchSuggestions.innerHTML = '';
}

function isSpeakingFinish(){
	isSpeaking = false;
	send_button.value = '发送';
}
function send(text){
	addMyChat(text);
	if (!talk) {
		isAskingToMagic();
		createChat().then((r) => {
			if (!r.ok) {
				isSpeakingFinish();
				addError(r.message);
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
};

function reSetStartChatMessage(){
	chat.innerHTML = `
	<div id="chat">
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
