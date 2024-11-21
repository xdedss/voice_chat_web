import '../lib/cryptojs';
import { extractStandardParams, guid, mapParamNames, PARAM_TYPES, removePrefix, pop_dict, sleep } from "../utils.js";
import { OpusDecoder } from 'opus-decoder';

function formatSignString(params) {
    let strParam = "";
    let signStr = "GETtts.cloud.tencent.com/stream_ws";
    const keys = Object.keys(params);
    keys.sort();
    for (let i = 0, len = keys.length; i < len; i++) {
        strParam += `&${keys[i]}=${params[keys[i]]}`;
    }
    return `${signStr}?${strParam.slice(1)}`;
}

function formatQueryParams(params) {
    let strParam = "";
    const keys = Object.keys(params);
    keys.sort();
    for (let i = 0, len = keys.length; i < len; i++) {
        strParam += `&${keys[i]}=${encodeURIComponent(params[keys[i]])}`;
    }
    return strParam.slice(1);
}


async function createQuery(params, text) {
    let convertedParams = {};

    async function getServerTime() {
        return new Promise((resolve, reject) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", 'https://asr.cloud.tencent.com/server_time', true);
                xhr.send();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        resolve(xhr.responseText);
                    }
                }
            } catch (error) {
                reject(error);
            }
        })
    }
    const time = new Date().getTime();
    const serverTime = await getServerTime();
    convertedParams['Action'] = 'TextToStreamAudioWS';
    convertedParams['AppId'] = parseInt(params.appid);
    convertedParams['SecretId'] = params.secretid || '';
    convertedParams['Timestamp'] = parseInt(serverTime) || Math.round(time / 1000);
    convertedParams['Expired'] = Math.round(time / 1000) + 24 * 60 * 60;
    convertedParams['SessionId'] = guid();
    convertedParams['Text'] = text;
    convertedParams['VoiceType'] = params.voice_type || 1003;
    convertedParams['ModelType'] = 1;
    convertedParams['Volume'] = params.volume || 0;
    convertedParams['Speed'] = params.speed || 0;
    convertedParams['SampleRate'] = params.sample_rate || 16000;
    convertedParams['EnableSubtitle'] = true;

    return convertedParams;
}

// 获取websocket url，带签名
async function getUrl(self, params, text) {
    if (!params.appid || !params.secretid) {
        self.isLog && console.log(self.requestId, '请确认是否填入账号信息', TAG);
        self.OnError('请确认是否填入账号信息');
        return false;
    }
    const convertedParams = await createQuery(params, text);
    const signStr = formatSignString(convertedParams);
    const queryStr = formatQueryParams(convertedParams);
    let signature = '';
    if (params.signCallback) {
        signature = params.signCallback(signStr);
    } else {
        signature = signCallback(params.secretkey, signStr);
    }
    console.log('url and sign:');
    console.log(signStr);
    console.log(signature);
    return `wss://tts.cloud.tencent.com/stream_ws?${queryStr}&Signature=${encodeURIComponent(signature)}`;
}

function toUint8Array(wordArray) {
    // Shortcuts
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;

    // Convert
    const u8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
        u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return u8;
}

function Uint8ArrayToString(fileData) {
    let dataString = '';
    for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
    }
    return dataString;
}
function signCallback(secretKey, signStr) {
    // console.log('sk', secretKey);
    // console.log('sign str', signStr);
    const hash = window.CryptoJSTest.HmacSHA1(signStr, secretKey);
    // console.log(hash);
    const bytes = Uint8ArrayToString(toUint8Array(hash));
    // console.log(bytes);
    return window.btoa(bytes);
}

function parseTencentOpus(buffer) {
    const results = [];
    let view = new DataView(buffer);
    let offset = 0;

    while (offset < buffer.byteLength) {
        // [0:4] is always 'opus'
        const opusStr = new TextDecoder().decode(buffer.slice(offset, offset + 4));
        offset += 4;

        // [4:8] -> int (index)
        const index = view.getInt32(offset, true); // true for little-endian
        offset += 4;

        // [8:12] -> int (length)
        const length = view.getInt32(offset, true); // true for little-endian
        offset += 4;

        // [12:12+length] -> string (base64)
        const base64Data = new TextDecoder().decode(buffer.slice(offset, offset + length));
        offset += length;

        const binStr = atob(base64Data);

        // to ArrayBuffer
        const binStrLen = binStr.length;
        const arrayBuffer = new ArrayBuffer(binStrLen);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binStrLen; i++) {
            uint8Array[i] = binStr.charCodeAt(i);
        }

        results.push({ opusStr, index, length, base64Data, binStr, arrayBuffer });
    }

    return results;
}

const TAG = '[OutputProviderTencent]'
export default class OutputProviderTencent {

    static getParams() {
        return [
            {
                id: 'tencent_secretid',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            {
                id: 'tencent_secretkey',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            {
                id: 'tencent_appid',
                type: PARAM_TYPES.STRING,
                required: true,
            },
            // {
            //     id: 'tencent_asr_engine_model_type',
            //     type: PARAM_TYPES.ENUM,
            //     required: true,
            //     choices: [
            //         '16k_zh',
            //         'whatever',
            //     ],
            // },
            // optional
            {
                id: 'tencent_tts_voice_type',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_tts_volume',
                type: PARAM_TYPES.FLOAT,
                required: false,
            },
            {
                id: 'tencent_tts_speed',
                type: PARAM_TYPES.FLOAT,
                required: false,
            },
            {
                id: 'tencent_tts_sample_rate',
                type: PARAM_TYPES.INT,
                required: false,
            },
        ]
    }

    constructor(params) {
        const extractedParams = extractStandardParams(
            params,
            OutputProviderTencent.getParams(),
        );
        this.params = mapParamNames(extractedParams, name => {
            name = removePrefix(name, 'tencent_tts_');
            name = removePrefix(name, 'tencent_');
            return name;
        });

        this.logEnabled = true;
        this.workerInterval = 100;

        // state
        this.isRunning = false;
        this.queuedText = [];
        this.queuedAudioSources = []
        this.nextTime = -1;
        this.ongoingTtsPromise = null;
        this.breakOngoingTts = false; // tells ongoing tts to stop
    }

    async *ttsStream(text, onSubtitle) {

        const url = await getUrl(this, this.params, text);
        let socket;
        if (!url) {
            throw 'OutPutProvider鉴权失败';
        }
        if ('WebSocket' in window) {
            socket = new WebSocket(url);
        } else if ('MozWebSocket' in window) {
            // do not check eslint for deprecated api
            // eslint-disable-next-line
            socket = new MozWebSocket(url);
        } else {
            throw '浏览器不支持WebSocket';
        }

        const messages = [];
        let finished = false;
        socket.onopen = (e) => { // 连接建立时触发

        };
        socket.onmessage = async (event) => { // 连接建立时触发
            if (typeof event.data === "string") {
                const response = JSON.parse(event.data);
                if (response.code !== 0) {
                    socket.close();
                    console.warn(`Server synthesis failed: request_id=${response.request_id}, code=${response.code}, message=${response.message}`);
                    finished = true;
                }
                if (response.final === 1) {
                    console.log("Received FINAL frame");
                    // socket.close();
                    finished = true;
                } else if (response.result) {
                    onSubtitle(response);
                }
            } else {
                // console.log(event.data);
                messages.push(event.data);
            }
        };

        while (true) {
            if (finished && messages.length == 0) {
                break;
            }
            if (messages.length > 0) {
                yield messages.shift();
            }
            else {
                await sleep(10);
            }
        }
        await sleep(1000);
        socket.close();

    }

    queueAudioSegment(decodedData, sampleRate, onEnded) {
        this.nextTime = Math.max(this.nextTime, this.audioContext.currentTime);
        // create source
        const buffer = this.audioContext.createBuffer(
            decodedData.length, // Number of channels
            decodedData[0].length, // Number of frames (samples)
            sampleRate // Sample rate
        );
        for (let channel = 0; channel < decodedData.length; channel++) {
            buffer.getChannelData(channel).set(decodedData[channel]);
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        // Schedule the source to play at the next available time
        source.start(this.nextTime);

        // add to queue and remove when finished
        this.queuedAudioSources.push(source);
        source.onended = () => {
            const index = this.queuedAudioSources.indexOf(source);
            if (index !== -1) {
                this.queuedAudioSources.splice(index, 1);
            }
            if (onEnded) {
                onEnded();
            }
        };

        // Update the next playback time
        const frameDuration = buffer.length / sampleRate;
        this.nextTime += frameDuration;

    }

    async start() {
        try {
            this.logEnabled && console.log('[OutputProvider] start function is called');
            this.queuedText = [];
            this.queuedAudioSources = []
            this.nextTime = -1;
            this.ongoingTtsPromise = null;
            this.breakOngoingTts = false;

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                // sampleRate: 16000,
            });

            this.decoder = new OpusDecoder({
                sampleRate: 16000,
            });

            // wait for decoder and context ready
            await this.decoder.ready;
            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }


        } catch (e) {
            console.log(e);
            throw e;
        }

        try {
            this.isRunning = true;
            this.worker();
        } catch (e) {
            console.log(e);
            this.OnError(e);
            throw e;
        }
    }

    async stop() {
        this.logEnabled && console.log('[OutputProvider] stop function is called');
        this.socket && this.socket.close(1000);
        this.audioContext && this.audioContext.suspend();
        this.decoder && this.decoder.free();
        // stop the worker
        this.isRunning = false;
        // interrupt any ongoing tts stream
        this.interrupt();
        this.ongoingTtsPromise && await this.ongoingTtsPromise;
    }

    async worker() {
        this.logEnabled && console.log('[OutputProvider] worker begin');
        while (this.isRunning) {
            // when we have unprocessed text, and we do not have too many audio segments packed up
            if (this.queuedText.length > 0 && this.queuedAudioSources.length < 50) {
                const nextText = this.queuedText.shift();
                this.logEnabled && console.log('[OutputProvider] got text ' + nextText);
                // start stream, make a promise
                let streamPromiseResolve;
                this.ongoingTtsPromise = new Promise(resolve => streamPromiseResolve = resolve);
                // we want to emit onConfirmOutput only once
                const confirmOutputWithClosure = (() => {
                    let thatText = nextText;
                    let hasConfirmedOutput = false;
                    return () => {
                        if (!hasConfirmedOutput) {
                            hasConfirmedOutput = true;
                            this.onConfirmOutput(thatText);
                        }
                    }
                })();
                // stream
                for await (let data of this.ttsStream(nextText, console.log)) {
                    const dataBuffer = await data.arrayBuffer();
                    const decoded = parseTencentOpus(dataBuffer);
                    // console.log(decoded);
                    for (let seg of decoded) {
                        const { channelData, samplesDecoded, sampleRate } = this.decoder.decodeFrame(new Uint8Array(seg.arrayBuffer));
                        // console.log(channelData);
                        // console.log(samplesDecoded);
                        // console.log(sampleRate);

                        // check if we need to break right before playing audio
                        if (this.breakOngoingTts) {
                            break;
                        }
                        this.queueAudioSegment(channelData, sampleRate, confirmOutputWithClosure);
                    }
                    if (this.breakOngoingTts) {
                        break;
                    }
                }
                // end of stream, resolve promise
                streamPromiseResolve();
                this.ongoingTtsPromise = null;
                this.breakOngoingTts = false;
            }
            await sleep(this.workerInterval);
        }
    }

    // interfaces

    interrupt() {

        // stop all queued sources
        this.queuedAudioSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                console.error("Error stopping source:", e);
            }
        });

        // reset next time
        this.nextTime = -1;

        // clear queued text
        this.queuedText = [];

        if (this.ongoingTtsPromise) {
            this.breakOngoingTts = true;
        }

    }

    feedInput(msg) {
        this.queuedText.push(msg);
    }

    // confirm that some text is successfully output
    onConfirmOutput(msg) { }
    // error
    OnError(e) { }
};


