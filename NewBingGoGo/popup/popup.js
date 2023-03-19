function $(qury){
	return document.querySelector(qury);
}
$('a#go-to-bing-go-go').href = 'chrome-extension://' + chrome.runtime.id + '/bing.html';

//----------------------------------------
var url_input = document.querySelector('input#url-input');
var savecookiesButtun = document.querySelector('input#savecookies');
var loadcookiesButtun = document.querySelector('input#loadcookies');
var speak = document.querySelector('p#speak');

var expUrl = new RegExp('^(https?://)([-a-zA-z0-9]+\\.)+([-a-zA-z0-9]+)+');
var magicUrl;

function loaded() {
	//魔法链接输入框更新事件
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

function speakString() {
	if (!magicUrl) {
		speak.innerHTML = '我没有角角,需要魔法链接才能帮你哦。';
		return;
	}
	if (!expUrl.test(magicUrl)) {
		speak.innerHTML = '魔法链接似乎不太对。';
		return;
	}
	speak.innerHTML = '魔法启动！';
}

getUrl().then((v) => {
	url_input.value = v ? v : '';
	magicUrl = v;
	speakString(v);
	loaded();
});