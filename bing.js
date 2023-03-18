var chat = document.getElementById('chat');

//在元素后插入新元素
function insertAfter(newElement, targetElement) {
	var parent = targetElement.parentNode;
	if (parent.lastChild == targetElement) {
		parent.appendChild(newElement);
	} else {
		parent.insertBefore(newElement, targetElement.nextSibling);
	}
}
//(json)
function updateType2(json){
	if(json.item.result.value=='Throttled'){
		addError(json.item.result.message);
		addError('24消息请求数达到了限制！');
	}else{
		console.log(JSON.stringify(json));
	}
}

//(json)
function updateBingChat(argument) {
	/*
	 */
	let id = argument.requestId;
	let box = document.getElementById(id + 'box');
	if (!box) {
		box = document.createElement('div');
		box.classList.add('bing');
		box.id = id + 'box';
		chat.appendChild(box);
	}

	let bobo = document.getElementById(id);
	if (!bobo) {
		bobo = document.createElement('div');
		bobo.id = id;
		bobo.classList.add('bobo');
		box.appendChild(bobo);
	}

	let message = bobo.getElementsByClassName('message')[0];
	if (!message) {
		message = document.createElement('div');
		message.classList.add('message');
		message.classList.add('markdown-body')
		bobo.appendChild(message);
	}

	let throttling = bobo.getElementsByClassName('throttling')[0];
	if (!throttling) {
		throttling = document.createElement('div');
		throttling.classList.add('throttling');
		bobo.appendChild(throttling);
	}

	if (argument.throttling) {
		throttling.innerHTML =
			`${argument.throttling.numUserMessagesInConversation} / ${argument.throttling.maxNumUserMessagesInConversation}`;
	}

	if (argument.messages) {
		let mestext = argument.messages[0];
		if (mestext) {
			if (!mestext.messageType) {
				let bodys = mestext.adaptiveCards[0].body;
				for (let i in bodys) {
					body = bodys[i];
					if (body.type == 'TextBlock') {
						if (!body.size) {
							message.innerHTML = marked.marked(body.text);
						} else if (body.size = 'small') {
							setSmallTextBlock(box, body.text, id);
						}
					}
				}
			} else if (mestext.messageType == 'InternalSearchQuery') {
				addInternalSearchQuery(box, mestext.spokenText);
			}
		}
	}
}
/**
 * 添加引用内容
 */
function setSmallTextBlock(box, text, id) {
	let smallTextBlock = document.getElementById(id + 'smallTextBlock');
	if (!smallTextBlock) {
		smallTextBlock = document.createElement('div');
		smallTextBlock.id = id + 'smallTextBlock';
		smallTextBlock.classList.add('smallTextBlock');
		insertAfter(smallTextBlock, box);
	}
	smallTextBlock.innerHTML = marked.marked(text);
}

/*
添加收索内容
*/
function addInternalSearchQuery(box, spokenText) {
	let intqury = document.createElement('div');
	intqury.classList.add('InternalSearchQuery');
	intqury.innerHTML = spokenText;
	box.parentNode.insertBefore(intqury, box);
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

//(json)
function onMessage(json, returnMessage) {
	if (json.type == 3) {
		returnMessage.getCatWebSocket().close(1000, 'ok');
		isSpeakingFinish();
	} else if (json.type == 1) {
		let argument = json.arguments[0];
		updateBingChat(argument);
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

function isSpeakingStart(){
	isSpeaking = true;
	send_button.value = '正在响应.';
}

function isSpeakingFinish(){
	isSpeaking = false;
	send_button.value = '发送';
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
	addMyChat(text);
	if (!talk) {
		createChat().then((r) => {
			if (!r.ok) {
				addError(r.message);
				return;
			}
			talk = r.obj;
			r = talk.sendMessage(text, onMessage);
			if (!r.ok) {
				addError(r.message);
				return;
			}
			isSpeakingStart();
			returnMessage = r.obj;
		});
		return;
	} else {
		let r = talk.sendMessage(text, onMessage)
		if (!r.ok) {
			addError(r.message);
			return;
		}
		isSpeakingStart();
		returnMessage = r.obj;
	}
};

restart_button.onclick = () => {
	if(!returnMessage){
		return;
	}
	returnMessage.getCatWebSocket().close(1000, 'ok');
	returnMessage = undefined;
	talk = undefined;
	chat.innerHTML = `
<div class="bing">
	<div class="bobo">
		<div class="message">
			我已经准备好啦！快和我聊天吧！
		</div>
		<div class="throttling">
			0 / 0
		</div>
	</div>
</div>
	`;
};
