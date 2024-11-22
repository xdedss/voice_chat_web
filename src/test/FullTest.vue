<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NInput, NInputGroup } from 'naive-ui';
import { ref } from 'vue';
import { guid } from '@/utils';
import FreeChat from '@/freechat';

const inputText = ref('');

const params = {
    openai_key: window.debugSecrets.openai_key,
    openai_base: window.debugSecrets.openai_base,
    openai_model: window.debugSecrets.openai_model,
    tencent_secretid: window.debugSecrets.secretId,
    tencent_secretkey: window.debugSecrets.secretKey,
    tencent_appid: window.debugSecrets.appId,
    // tencent_tts_speed: 0,
    tencent_tts_voice_type: 1002,

    // 实时识别接口参数
    tencent_asr_engine_model_type: '16k_zh', // 因为内置WebRecorder采样16k的数据，所以参数 engineModelType 需要选择16k的引擎，为 '16k_zh'
    // 以下为非必填参数，可跟据业务自行修改
    // voice_format : 1,
    // hotword_id : '08003a00000000000000000000000000',
    tencent_asr_needvad: 1,
};

const chat = new FreeChat(params);
const btnState = ref(0);


async function start() {
    btnState.value = -1;
    await chat.start();
    btnState.value = 1;
}

async function stop() {
    btnState.value = -1;
    await chat.stop();
    btnState.value = 0;
}



</script>

<template>
    <n-card title="全流程测试">
        <!-- <template #header-extra>
      #header-extra
    </template> -->

        <!-- <template #footer>
      #footer
    </template> -->
        <template #action>
            <n-flex>
                <n-button type="success" v-on:click="start()" :disabled="btnState != 0">
                    Start
                </n-button>
                <n-button type="error" v-on:click="stop()" :disabled="btnState != 1">
                    Stop
                </n-button>
            </n-flex>
        </template>
    </n-card>
</template>

<style scoped></style>