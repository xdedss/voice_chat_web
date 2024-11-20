import WebRecorder from "./webrecorder.js";
import { SpeechRecognizer } from "./speechrecognizer.js";
import { extractStandardParams, guid, mapParamNames, PARAM_TYPES, removePrefix, pop_dict } from "../utils.js";

// start之后支持以下回调:
// // 开始说话时
// onSentenceBegin(res) { }
// // 识别结果发生变化的时候
// onSentencePartialComplete(res) { }
// // 一句话结束的时候
// onSentenceComplete(res) { }
// 对外可能有用的变量：
// isUserSpeaking
export default class InputProviderTencent {

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
            {
                id: 'tencent_asr_engine_model_type',
                type: PARAM_TYPES.ENUM,
                required: true,
                choices: [
                    '16k_zh',
                    'whatever',
                ],
            },
            // optional
            {
                id: 'tencent_asr_voice_format',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_hotword_id',
                type: PARAM_TYPES.STRING,
                required: false,
            },
            {
                id: 'tencent_asr_needvad',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_filter_dirty',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_filter_modal',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_filter_punc',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_convert_num_mode',
                type: PARAM_TYPES.INT,
                required: false,
            },
            {
                id: 'tencent_asr_word_info',
                type: PARAM_TYPES.INT,
                required: false,
            },
        ]
    }

    constructor(params) {
        const extractedParams = extractStandardParams(
            params,
            InputProviderTencent.getParams(),
        );
        this.params = mapParamNames(extractedParams, name => {
            name = removePrefix(name, 'tencent_asr_');
            name = removePrefix(name, 'tencent_');
            return name;
        });
        
        this.recorder = null;
        this.speechRecognizer = null;
        this.deviceId = 'default';
        
        // settings
        // ends ASR a sentence after this many miliseconds of slience
        this.splitRecognitionThreshold = 1000;
        // log switch
        this.logEnabled = true;
        // random guid
        this.requestId = guid();

        // state
        this.isRunning = false; // tells the update loop to keep running
        this.isRecognizerRunning = false; // controls whether to send data to recognizer
        this.isUserSpeaking = false; // flag for external use
        // updated vars
        this.updateInterval = 100;
        this.timeSinceLastRecognition = -1; // ms,  <0 means no last update

        this.isNormalEndStop = false;

        // setup modules and callbacks
        // note: this is just a unique id for logging
        this.recorder = new WebRecorder(this.requestId, this.logEnabled);
        this.speechRecognizer = new SpeechRecognizer(this.params, this.requestId, this.logEnabled);
        this.recorder.OnReceivedData = (data) => {
            // console.log('sendToRecognizer', this.isRecognizerRunning);
            if (this.isRecognizerRunning) {
                // console.log(data);
                this.speechRecognizer && this.speechRecognizer.write(data);
            }
        };
        // 录音失败时
        this.recorder.OnError = (err) => {
            this.speechRecognizer && this.speechRecognizer.close();
            this.stop();
            this.OnError(err);
        }
        this.recorder.OnStop = (res) => {
            // if (this.speechRecognizer) {
            //     this.speechRecognizer.stop();
            //     // this.speechRecognizer = null;
            // }
        }
        // 开始识别
        this.speechRecognizer.OnRecognitionStart = (res) => {
            if (this.recorder) { // 录音正常
                // this.OnRecognitionStart(res);
                this.isRecognizerRunning = true;
            } else {
                this.speechRecognizer && this.speechRecognizer.close();
            }
        };
        // 一句话开始
        this.speechRecognizer.OnSentenceBegin = (res) => {
            // this.OnSentenceBegin(res);
        };
        // 识别变化时
        this.speechRecognizer.OnRecognitionResultChange = (res) => {
            if (res.result.voice_text_str.length > 0) {
                if (this.timeSinceLastRecognition < 0) {
                    // this is the first valid string recognized
                    this.logEnabled && console.log('[InputManager] onSentenceBegin');
                    this.onSentenceBegin();
                    this.isUserSpeaking = true;
                }
                // start timeout when valid string is received
                this.timeSinceLastRecognition = 0;
                
                this.logEnabled && console.log('[InputManager] onSentencePartialComplete ' + res.result.voice_text_str);
                this.onSentencePartialComplete(res.result.voice_text_str);
            }
        };
        // 一句话结束
        this.speechRecognizer.OnSentenceEnd = (res) => {
            if (this.isUserSpeaking) {
                this.isUserSpeaking = false;
                this.timeSinceLastRecognition = -1;
                this.logEnabled && console.log('[InputManager] onSentenceComplete ' + res.result.voice_text_str);
                this.onSentenceComplete(res.result.voice_text_str);
            }
        };
        // 识别结束
        this.speechRecognizer.OnRecognitionComplete = (res) => {
            console.log('[InputManager] setting to false sendToRecognizer');
            this.isRecognizerRunning = false;
            // this.OnRecognitionComplete(res);
            this.isNormalEndStop = true; // not sure if this is necessary
        };
        // 识别错误
        this.speechRecognizer.OnError = (res) => {
            if (this.speechRecognizer && !this.isNormalEndStop) {
                this.OnError(res);
            }
            // this.speechRecognizer = null;
            this.recorder && this.recorder.stop();
            this.isRecognizerRunning = false;
        };
    }
    async start() {
        try {
            this.logEnabled && console.log('[InputManager] start function is called');
            // update
            let that = this;
            this.isRunning = true;
            function timeoutFunc() {
                if (that.isRunning) {
                    that.update();
                    setTimeout(timeoutFunc, that.updateInterval);
                }
            }
            setTimeout(timeoutFunc, this.updateInterval);

            await this.recorder.start(this.deviceId);
            this.logEnabled && console.log('[InputManager] recorder started');
            await this.speechRecognizer.start();
            this.logEnabled && console.log('[InputManager] recognizer started');
        } catch (e) {
            console.log(e);
            throw e;
        }
    }
    async stop() {
        this.logEnabled && console.log('[InputManager] stop function is called');
        if (this.speechRecognizer) {
            await this.speechRecognizer.stop();
            this.logEnabled && console.log('[InputManager] recognizer stopped');
        }
        if (this.recorder) {
            await this.recorder.stop();
            this.logEnabled && console.log('[InputManager] recorder stopped');
        }
        // this will stop the animation loop
        this.isRunning = false;
    }
    update() {
        // console.log(1);
        if (this.timeSinceLastRecognition >= 0) {
            this.timeSinceLastRecognition += this.updateInterval;
            // console.log('timeSinceLastRecognition', this.timeSinceLastRecognition);
        }
        if (this.timeSinceLastRecognition >= this.splitRecognitionThreshold) {
            // this.logEnabled && console.log('[InputManager] [recognition eos]');
            // this.timeSinceLastRecognition = -1;
            // // interrupt and then restart.
            // // this will trigger a OnRecognitionComplete eventually
            // this.speechRecognizer.stop().then(() => this.speechRecognizer.start());
        }
    }
    // destroyStream() {
    //     this.logEnabled && console.log('destroyStream function is click', this.recorder);
    //     if (this.recorder) {
    //         this.recorder.destroyStream();
    //     }
    // }
    // 开始识别的时候
    // OnRecognitionStart(res) { }
    // 一句话开始的时候
    // OnSentenceBegin(res) { }
    // 开始识别到一句话的有效内容
    onSentenceBegin() { }
    // 识别结果发生变化的时候
    onSentencePartialComplete(res) { }
    // 一句话结束的时候
    onSentenceComplete(res) { }
    // 识别结束的时候
    // OnRecognitionComplete(res) { }
    // 识别失败
    OnError() { }
};
