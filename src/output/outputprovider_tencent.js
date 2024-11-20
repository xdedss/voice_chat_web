

import { extractStandardParams, guid, mapParamNames, PARAM_TYPES, removePrefix, pop_dict } from "../utils.js";


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
            // {
            //     id: 'tencent_asr_voice_format',
            //     type: PARAM_TYPES.INT,
            //     required: false,
            // },
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


        
    }
    async start() {
        try {
            this.logEnabled && console.log('[OutputProvider] start function is called');
            
        } catch (e) {
            console.log(e);
            throw e;
        }
    }
    async stop() {
        this.logEnabled && console.log('[OutputProvider] stop function is called');
        
    }

    // interfaces

    interrupt() {

    }

    feedInput(msg) {
        this.onConfirmOutput(msg);
    }

    // confirm that some text is successfully output
    onConfirmOutput(msg) { }
    // error
    OnError() { }
};


