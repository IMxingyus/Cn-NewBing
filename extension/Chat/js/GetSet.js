async function setMagicUrl(url) {
	return await chrome.storage.local.set({
		GoGoUrl: url
	});
}

async function getMagicUrl() {
	return (await chrome.storage.local.get('GoGoUrl')).GoGoUrl;
}

// ture:开启使用魔法聊天|false:关闭使用魔法聊天
async function setChatHubWithMagic(user) {
	return await chrome.storage.local.set({
		ChatHubWithMagic: user
	});
}
// ture|false
async function getChatHubWithMagic() {
	return (await chrome.storage.local.get('ChatHubWithMagic')).ChatHubWithMagic ? true : false;
}

ChatRecords=new Object();
//获取全部聊天记录对象
ChatRecords.getAll = async function() {
	let chatRecords = (await chrome.storage.local.get('ChatRecordss')).ChatRecordss
	if (!chatRecords) {
		chatRecords = new Object();
	}
	return chatRecords;
}
//设置一条聊天记录
ChatRecords.set = async function(key,data) {
	let chatRecords = await this.getAll();
	chatRecords[key] = data;
	await chrome.storage.local.set({
		ChatRecordss: chatRecords
	});
	return chatRecords;
}







