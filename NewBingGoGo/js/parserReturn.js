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
            let nextFather = getByID(argumentss[i].requestId, 'div', chatDiv,'bing');
            porserMessages(argumentss[i].messages, nextFather);
        }else if(argumentss[i].throttling && argumentss[i].requestId){
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
        //解析adaptiveCards 也就是聊天消息部分
        if (message.adaptiveCards) {
            if(!message.messageType){
                let adaptiveCardsFatherDIV = getByID(message.messageId, 'div', father,'adaptiveCardsFatherDIV');
                porserAdaptiveCards(message.adaptiveCards, adaptiveCardsFatherDIV);
            }else if(message.messageType=='InternalSearchQuery'){
                let div = document.createElement('div');
                div.classList.add('InternalSearchQuery');
                father.appendChild(div);
                porserAdaptiveCards(message.adaptiveCards, div);
            }else if(message.messageType=='InternalLoaderMessage'){
                let div = document.createElement('div');
                div.classList.add('InternalLoaderMessage');
                father.appendChild(div);
                porserAdaptiveCards(message.adaptiveCards, div);
            }else{
                console.log('发现一个另类message', JSON.stringify(message));
            }
        }
        //解析sourceAttributions 也就是引用链接部分
        if (message.sourceAttributions) {
            if(message.sourceAttributions.length>0){
                let sourceAttributionsDIV = getByID(message.messageId+'sourceAttributions', 'div', father,'sourceAttributions');
                porserSourceAttributions(message.sourceAttributions, sourceAttributionsDIV);
            }
        }
        //解析suggestedResponses 建议发送的消息，聊天建议
        if (message.suggestedResponses) {
            porserSuggestedResponses(message.suggestedResponses);
        }
    }
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
        let div = getByClass('textBlock', 'div', father,'markdown-body');
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
    for(let i=0;i<sourceAttributions.length;i++){
        let sourceAttribution = sourceAttributions[i];
        html = html+`<a target="_blank" href="${sourceAttribution.seeMoreUrl}">${sourceAttribution.providerDisplayName}</a>`;
    }
    father.innerHTML = html;
}
/***
解析suggestedResponses 建议发送的消息，聊天建议
 */
function porserSuggestedResponses(suggestedResponses) {
    var searchSuggestions = document.getElementById('SearchSuggestions');
    searchSuggestions.innerHTML = '';
    for(let i=0;i<suggestedResponses.length;i++){
        let a = document.createElement('a');
        a.innerHTML = suggestedResponses[i].text;
        a.onclick = (even)=>{
            send(even.target.innerHTML);
        }
        searchSuggestions.appendChild(a);
    }
}