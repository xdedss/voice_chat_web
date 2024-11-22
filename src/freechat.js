import ChatProviderOpenai from "./chat/chatprovider_openai";
import InputProviderTencent from "./input/inputprovider_tencent";
import OutputProviderTencent from "./output/outputprovider_tencent";

export default class FreeChat {
    constructor(params) {
        this.chatProvider = new ChatProviderOpenai(params);
        this.inputProvider = new InputProviderTencent(params);
        this.outputProvider = new OutputProviderTencent(params);

        this.inputProvider.onSentenceComplete = res => {
            this.chatProvider.feedInput(res);
            this.onUser(res);
        }
        this.inputProvider.onSentenceBegin = () => {
            this.chatProvider.interrupt();
            this.outputProvider.interrupt();
        }
        this.chatProvider.onChatResponse = msg => {
            this.outputProvider.feedInput(msg);
        }
        this.outputProvider.onConfirmOutput = msg => {
            this.chatProvider.confirmOutput(msg);
            this.onAssistant(msg);
        }
    }
    
    async start() {
        await Promise.all([
            this.chatProvider.start(),
            this.inputProvider.start(),
            this.outputProvider.start(),
        ]);
    }

    async stop() {
        await Promise.all([
            this.chatProvider.stop(),
            this.inputProvider.stop(),
            this.outputProvider.stop(),
        ]);
    }

    onUser(msg) { }
    onAssistant(msg) { }
}
