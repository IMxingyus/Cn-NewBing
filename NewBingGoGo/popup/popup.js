function $(qury){
	return document.querySelector(qury);
}
$('a#go-to-bing-go-go').href = 'chrome-extension://' + chrome.runtime.id + '/bing.html';

//----------------------------------------
var url_input = document.querySelector('input#url-input');
var savecookiesButtun = document.querySelector('input#savecookies');
var loadcookiesButtun = document.querySelector('input#loadcookies');
var speak = document.querySelector('p#speak');
var tallSelect = document.querySelector('select#tallSelect');

var expUrl = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+\\S*$');
var magicUrl;

function loaded() {
	//代理链接输入框更新事件
	url_input.onchange = function(even) {
		let url = url_input.value;
		magicUrl = url;
		setUrl(url);
		speakString();
	}
}

async function setUrl(url) {
	return await chrome.storage.local.set({
		GoGoUrl: url
	});
}

async function getUrl() {
	return (await chrome.storage.local.get('GoGoUrl')).GoGoUrl;
}

async function setChatHubWithMagic(user){
	return await chrome.storage.local.set({
		ChatHubWithMagic : user
	});
}
async function getChatHubWithMagic(){
	return (await chrome.storage.local.get('ChatHubWithMagic')).ChatHubWithMagic;
}

function speakString() {
	if (!magicUrl) {
		speak.innerHTML = '填写代理链接以解锁完整功能';
		return;
	}
	if (!expUrl.test(magicUrl)) {
		speak.innerHTML = '代理链接似乎不太对';
		return;
	}
	speak.innerHTML = '代理可用！';
}

getUrl().then((v) => {
	url_input.value = v ? v : '';
	magicUrl = v;
	speakString(v);
	loaded();
});

getChatHubWithMagic().then((chatWithMagic)=>{
	if(!chatWithMagic){
		tallSelect.selectedIndex = 0;
	}else{
		tallSelect.selectedIndex = 1;
	}
	tallSelect.onchange= ()=>{
		switch (tallSelect.selectedIndex) {
			case 0:
				setChatHubWithMagic(false);
				break;
			case 1:
				setChatHubWithMagic(true);
				break;
		}
	}
});


