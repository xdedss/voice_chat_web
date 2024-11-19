# voice_chat_web

1. InputProvider
   - onSentenceBegin
   - onSentencePartialComplete
   - onSentenceComplete
   - onError
2. ChatProvider
   - feedInput(text)
   - confirmOutput(text)
   - interrupt()
   - onChatResponse
3. OutputProvider
   - feedInput(text)
   - onConfirmOutput

### InputProvider

start后，监听输入，发送一句话开始/部分/结束事件

### ChatProvider

start后，接收到feedInput则加入chat history并开始请求回复

部分回复完成时发出onChatResponse事件

接收到confirmOutput则加入chat history

接收到interrupt时，中断正在进行的请求并不再发送已有的response

### OuptutProvider

接受feedInput后入queue开始tts，完成部分或全部时发送onConfirmOutput

接收到interrupt时，中断正在进行的播放并清空queue

### 其他

每个部分提供 onError，以便出错时让其他模块stop

参数机制：通过 const {xxx, yyy} = params; 解包参数字典