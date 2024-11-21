
import OpenAI from "openai/index";
import { sleep } from "@/utils";
import { PARAM_TYPES, extractStandardParams } from "@/utils";

function findStreamSplit(existingString, start_i) {
    // find a proper position to split.
    // if none, return -1
    for (let i = start_i; i < existingString.length; i++) {
        if (i > 4) {
            const c = existingString[i];
            switch (c) {
                case '\n':
                case '。':
                case '！':
                case '？':
                    return i + 1;
            }
        }
    }
    return -1;
}

export class ChatProviderOpenai {

    // OPENAI EXAMPLE:
    // const client = new OpenAI();
    // async function main() {
    // const stream = await client.chat.completions.create({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: 'Say this is a test' }],
    //     stream: true,
    // });
    // for await (const chunk of stream) {
    //     process.stdout.write(chunk.choices[0]?.delta?.content || '');
    // }
    // }

    
    static getParams() {
        return [
            {
                id: 'openai_key',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            {
                id: 'openai_base',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            {
                id: 'openai_model',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            {
                id: 'chat_system_prompt',
                type: PARAM_TYPES.STRING,
            },
        ]
    }


    constructor(params) {
        const extractedParams = extractStandardParams(
            params,
            ChatProviderOpenai.getParams(),
        );
        this.logEnabled = true;
        this.stopPromise = null;
        this.isRunning = false; // a flag to tell the worker when to stop
        this.isStreamingResponse = false; // tell the worker when to abort stream
        this.workerInterval = 50;
        this.pendingUserInputs = [];
        this.chatHisotry = [];
        this.systemPrompt = extractedParams.chat_system_prompt || 'You are a voice chat agent. Response like a casual chat, with brief speakable text, without additional formats.';
        this.client = new OpenAI({
            apiKey: extractedParams.openai_key,
            baseURL: extractedParams.openai_base,
            dangerouslyAllowBrowser: true,
        })
        this.openai_model = extractedParams.openai_model;
    }
    // 暂停识别，关闭连接
    async stop() {
        this.logEnabled && console.log('[ChatProvider] stop called');
        this.isRunning = false; // tell the worker to stop;
        let rejectFunc = this.stopPromiseReject;
        setTimeout(() => rejectFunc && rejectFunc('[ChatProvider] wait for stop: timed out'), 5000);
        await this.stopPromise;
        this.isStreamingResponse = false;

    }
    // 
    async start() {
        this.logEnabled && console.log('[ChatProvider] start called');
        if (this.isRunning) {
            this.logEnabled && console.log('[ChatProvider] is already running');
            return;
        }
        this.isStreamingResponse = false;
        this.stopPromiseResolve = null;
        this.stopPromiseReject = null;
        this.stopPromise = new Promise((resolve, reject) => {
            this.stopPromiseResolve = resolve;
            this.stopPromiseReject = reject;
        });
        // reset state
        this.chatHisotry = [{ role: 'system', content: this.systemPrompt }];
        // start async func but do not wait
        try {
            this.isRunning = true;
            this.worker();
        } catch (e) {
            console.log(e);
            this.onError(e);
            throw e;
        }
    }
    async worker() {
        this.logEnabled && console.log('[ChatProvider] worker begin');
        while (this.isRunning) {
            await sleep(this.workerInterval);

            if (this.getLastRole() == 'user') {
                // generate respose for the user
                this.logEnabled && console.log('[ChatProvider] worker start to process user request', JSON.parse(JSON.stringify(this.chatHisotry)));
                const timerStart = new Date().getTime() / 1000;
                let timerEnd = 0;
                const stream = await this.client.chat.completions.create({
                    model: this.openai_model,
                    messages: this.chatHisotry,
                    stream: true,
                });
                // add empty response, so that
                // if the confirmResponse is not called properly, 
                // we do not retry infinitely
                this.confirmOutput('');
                let cumulativeText = '';
                let isCancelled = false;
                this.isStreamingResponse = true;
                for await (const chunk of stream) {
                    const chunkText = chunk.choices[0]?.delta?.content || '';
                    const origLen = cumulativeText.length;
                    if (this.logEnabled && timerEnd == 0 && chunkText) {
                        timerEnd = new Date().getTime() / 1000;
                        console.log('[ChatProvider] first token took', timerEnd - timerStart);
                    }
                    cumulativeText += chunkText;
                    cumulativeText = cumulativeText.trimStart(); // always trim to avoid whitespaces
                    this.logEnabled && console.log('[ChatProvider] stream:', new Date().getTime() / 1000 - timerStart, cumulativeText);

                    const splitPos = findStreamSplit(cumulativeText, origLen);
                    if (splitPos >= 0) {
                        this.logEnabled && console.log('[ChatProvider] split at position', splitPos);
                        this.sendResponse(cumulativeText.slice(0, splitPos));
                        cumulativeText = cumulativeText.slice(splitPos).trimStart();
                    }

                    if (!this.isStreamingResponse) {
                        isCancelled = true;
                        break;
                    }
                }
                if (!isCancelled && cumulativeText.length > 0) {
                    // response ends naturally without cancellation
                    this.sendResponse(cumulativeText);
                }
                this.isStreamingResponse = false;
            }

        }
        this.stopPromiseResolve && this.stopPromiseResolve();
        this.logEnabled && console.log('[ChatProvider] worker end');
    }
    getLastRole() {
        return this.chatHisotry[this.chatHisotry.length - 1].role;
    }
    sendResponse(msg) {
        this.logEnabled && console.log('[ChatProvider] response: ', msg);
        this.onChatResponse(msg);
    }

    // Interfaces
    feedInput(msg) {
        if (!this.isRunning) {
            console.warn('[ChatProvider] not running, can not feedInput')
            return;
        }
        // add user input into the agent history
        this.interrupt();
        if (this.getLastRole() != 'user') {
            // create a new user message
            this.chatHisotry.push({ role: 'user', content: '' });
        }
        this.chatHisotry[this.chatHisotry.length - 1].content += msg;
    }
    confirmOutput(msg) {
        if (!this.isRunning) {
            console.warn('[ChatProvider] not running, can not confirmOutput')
            return;
        }
        // confirm that an output segment is successful, and add it into history
        if (this.getLastRole() != 'assistant') {
            // create a new assistant message
            this.chatHisotry.push({ role: 'assistant', content: '' });
        }
        this.chatHisotry[this.chatHisotry.length - 1].content += msg;
    }
    interrupt() {
        if (!this.isRunning) {
            console.warn('[ChatProvider] not running, can not interrupt')
            return;
        }
        this.isStreamingResponse = false;
    }

    onChatResponse(msg) { }
    onError(e) { }
}