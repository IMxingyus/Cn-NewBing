/**
(id,元素的tag,父元素,创建时顺便添加的class:可以多个)
获取一个指定id的元素如果没用就在服元素创建这个元素
*/
function getByID(id, tag, father) {
    let t = document.getElementById(id);
    if (!t) {
        t = document.createElement(tag);
        t.id = id;
        for (let i = 3; i < arguments.length; i++) {
            if (arguments[i]) {
                t.classList.add(arguments[i]);
            }
        }
        father.appendChild(t);
    }
    return t;
}
function getByClass(className, tag, father) {
    let t = father.getElementsByClassName(className)[0];
    if (!t) {
        t = document.createElement(tag);
        t.classList.add(className);
        for (let i = 3; i < arguments.length; i++) {
            if (arguments[i]) {
                t.classList.add(arguments[i]);
            }
        }
        father.appendChild(t);
    }
    return t;
}

function test(test) {
    porserArguments(test.arguments);
}

var throttling = {
    "maxNumUserMessagesInConversation": 0,
    "numUserMessagesInConversation": 0
};
/**
 * 解析arguments
 * 解析聊天消息，将消息添加到页面
 * **/
function porserArguments(argumentss) {
    let chatDiv = document.getElementById('chat');
    for (let i = 0; i < argumentss.length; i++) {
        if (argumentss[i].messages && argumentss[i].requestId) {
            let nextFather = getByID(argumentss[i].requestId, 'div', chatDiv, 'bing');
            porserMessages(argumentss[i].messages, nextFather);

        } else if (argumentss[i].throttling && argumentss[i].requestId) {
            throttling = argumentss[i].throttling;

        } else {
            console.log('发现一个另类argument', JSON.stringify(argumentss[i]));
        }
    }
}
/* 
解析messages
*/
function porserMessages(messages, father) {
    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];

        //解析adaptiveCards 也就是聊天消息部分 下面类型的都是带有adaptiveCards的
        if (!message.messageType && message.adaptiveCards) {//如果是正常的聊天
            let adaptiveCardsFatherDIV = getByID(message.messageId, 'div', father, 'adaptiveCardsFatherDIV');
            porserAdaptiveCards(message.adaptiveCards, adaptiveCardsFatherDIV);

            //解析sourceAttributions 也就是引用链接部分
            if (message.sourceAttributions) {
                if (message.sourceAttributions.length > 0) {
                    let sourceAttributionsDIV = getByID(message.messageId + 'sourceAttributions', 'div', father, 'sourceAttributions');
                    porserSourceAttributions(message.sourceAttributions, sourceAttributionsDIV);
                }
            }
            //解析suggestedResponses 建议发送的消息，聊天建议
            if (message.suggestedResponses) {
                porserSuggestedResponses(message.suggestedResponses);
            }

        } else if (message.messageType == 'InternalSearchQuery' && message.adaptiveCards) { //如果是收索消息
            let div = document.createElement('div');
            div.classList.add('InternalSearchQuery');
            father.appendChild(div);
            porserAdaptiveCards(message.adaptiveCards, div);

        } else if (message.messageType == 'InternalLoaderMessage' && message.adaptiveCards) { //如果是加载消息
            let div = document.createElement('div');
            div.classList.add('InternalLoaderMessage');
            father.appendChild(div);
            porserAdaptiveCards(message.adaptiveCards, div);

        } else if (message.messageType == 'GenerateContentQuery') {//如果是生成内容查询
            let div = document.createElement('div');
            div.classList.add('GenerateContentQuery');
            father.appendChild(div);
            generateContentQuery(message, div);
        } else {
            console.log('发现一个另类message', JSON.stringify(message));
        }

    }
}

/*
解析generateContentQuery生成内容查询,目前是只有图片
*/
function generateContentQuery(message, father) {
    getMagicUrl().then(async magicUrl => {
        if (!magicUrl) {
            addError("魔法链接不正确！无法加载图片");
            return;
        }
        if (!expUrl.test(magicUrl)) {
            addError("魔法链接不正确！无法加载图片")
            return;
        }
        let theUrls = new URLSearchParams();
        theUrls.append('re', '1');
        theUrls.append('showselective', '1');
        theUrls.append('sude', '1');
        theUrls.append('kseed', '7500');
        theUrls.append('SFX', '2');
        theUrls.append('q', message.text);
        theUrls.append('iframeid', message.requestId);
        let theUrl = URLTrue(magicUrl,"AiDraw/Create?") + theUrls.toString();
        
        try{
            father.innerHTML = `正在生成${message.text}的图片.`;
            let html = (await (await fetch(theUrl)).text());
            let urr = new RegExp('"/(images/create/async/results/(\\S*))"').exec(html);
            if(!urr || !urr[1]){
                urr = new RegExp('class="gil_err_mt">([^<>]*)</div>').exec(html);
                if(urr || urr[1]){
                    father.innerHTML = `${urr[1]}`
                    return;
                }
                console.log(html);
                addError("请求图片返回不正确的页面，无法加载图片。");
                return;
            }
            let ur = urr[1];
            let imgPageHtmlUrl = URLTrue(magicUrl,ur);
            let count = 0;
            let run = async ()=>{
                father.innerHTML = `正在生成${message.text}的图片.${count}`;
                if(count>20){
                    addError("请求图片超时！");
                    return;
                }
                count++;
                let imgPageHtml;
                try{
                    imgPageHtml = (await (await fetch(imgPageHtmlUrl)).text());
                }catch(e){
                    console.error(e);
                }
                if(!imgPageHtml){
                    setTimeout(run,3000);
                    return;
                }
                let div = document.createElement("div");
                div.innerHTML = imgPageHtml;
                let imgs = div.getElementsByTagName("img");
                father.innerHTML = '';
                for(let el=0;el<imgs.length;el++){
                    let img = document.createElement('img');
                    img.src = imgs[el].src;
                    father.appendChild(img);
                }
                div.remove();
            }
            setTimeout(run,3000);
            
        }catch(e){
            console.error(e);
            addError("请求图片失败:"+e);
        }
    });
}

/*
解析adaptiveCards 聊天消息部分
*/
function porserAdaptiveCards(adaptiveCards, father) {
    for (let i = 0; i < adaptiveCards.length; i++) {
        let adaptiveCard = adaptiveCards[i];
        if (adaptiveCard.type == 'AdaptiveCard') {
            porserbody(adaptiveCard.body, father);
        } else {
            console.log('发现一个不是AdaptiveCard的adaptiveCard', JSON.stringify(adaptiveCard));
        }
    }

}
/**
解析body adaptiveCards[].body这个部分
 */
function porserbody(bodys, father) {
    for (let i = 0; i < bodys.length; i++) {
        let body = bodys[i];
        if (body.type == 'TextBlock') {
            porserTextBlock(body, father);
        } else if (body.type == 'RichTextBlock') {
            porserRichTextBlocks(body.inlines, father);
        } else {
            console.log('发现一个不是TextBlock,RichTextBlock的body', JSON.stringify(body));
        }
    }
}
/*
解析TextBlock body.type==TextBlock
*/
function porserTextBlock(body, father) {
    if (!body.size) {
        let div = getByClass('textBlock', 'div', father, 'markdown-body');
        div.innerHTML = marked.marked(body.text);
        div = getByClass('throttling', 'div', father);
        div.innerHTML = `${throttling.numUserMessagesInConversation} / ${throttling.maxNumUserMessagesInConversation}`;
    } else if (body.size == 'small') {
        //原本bing官网的small并没有输出
    }
}
/*
解析RichTextBlock body.type==RichTextBlock
*/
function porserRichTextBlocks(inlines, father) {
    for (let i = 0; i < inlines.length; i++) {
        inline = inlines[i];
        let line = document.createElement('p');
        line.innerHTML = inline.text;
        father.appendChild(line);
    }
}

/***
解析sourceAttributions 聊天消息引用链接部分
 */
function porserSourceAttributions(sourceAttributions, father) {
    let html = '';
    for (let i = 0; i < sourceAttributions.length; i++) {
        let sourceAttribution = sourceAttributions[i];
        html = html + `<a target="_blank" href="${sourceAttribution.seeMoreUrl}">${sourceAttribution.providerDisplayName}</a>`;
    }
    father.innerHTML = html;
}
/***
解析suggestedResponses 建议发送的消息，聊天建议
 */
function porserSuggestedResponses(suggestedResponses) {
    var searchSuggestions = document.getElementById('SearchSuggestions');
    searchSuggestions.innerHTML = '';
    for (let i = 0; i < suggestedResponses.length; i++) {
        let a = document.createElement('a');
        a.innerHTML = suggestedResponses[i].text;
        a.onclick = (even) => {
            send(even.target.innerHTML);
        }
        searchSuggestions.appendChild(a);
    }
}