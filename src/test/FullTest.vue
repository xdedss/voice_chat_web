<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NInput, NInputGroup } from 'naive-ui';
import { ref } from 'vue';
import { guid } from '@/utils';
import FreeChat from '@/freechat';

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
    webrecorder_use_legacy_worklet: true,
};

const chat = new FreeChat(params);
const btnState = ref(0);
const chatLog = ref([]);
const inputText = ref('');
const audioDevices = ref([]);
const selectedDeviceId = ref('default');

chat.onUser = msg => {
    chatLog.value.push({
        'role': 'user',
        'text': msg,
        'key': guid(),
    });
};

chat.onAssistant = msg => {
    chatLog.value.push({
        'role': 'assistant',
        'text': msg,
        'key': guid(),
    });
};


async function refreshDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices);
        audioDevices.value = [];
        devices.forEach(device => {
            if (device.kind === "audioinput") {
                const option = {};
                option.value = device.deviceId;
                option.label = device.label || `Microphone ${devices.value.length + 1}`;
                audioDevices.value.push(option);
            }
        });
        // if (devices.length > 7) {
        //   selectedDeviceId.value = devices[7].deviceId;
        // }
    } catch (error) {
        console.error('Error getting audio devices:', error);
        alert('Error getting audio devices:' + error);
    }
}


async function start() {
    btnState.value = -1;
    chat.inputProvider.deviceId = selectedDeviceId.value;
    await chat.start();
    btnState.value = 1;
}

async function stop() {
    btnState.value = -1;
    await chat.stop();
    btnState.value = 0;
}

function clear() {
    chatLog.value = [];
}

function feedInput() {
    const msg = inputText.value;
    inputText.value = '';
    chat.feedExtraInput(msg);
}

</script>

<template>
    <n-card title="整体测试">
        <!-- <template #header-extra>
      #header-extra
    </template> -->
        <n-flex vertical>
            <n-flex>
                <n-button v-on:click="refreshDevices()">Refresh Devices</n-button>
                <n-select v-model:value="selectedDeviceId" :options="audioDevices" />
            </n-flex>
            <n-flex vertical>
                <n-list hoverable clickable>
                    <n-list-item v-for="t in chatLog" :key="t.key">
                        <n-text>{{ t.role }}: {{ t.text }}</n-text>
                    </n-list-item>
                </n-list>
            </n-flex>
            <n-flex>
                <n-input-group>
                    <n-input v-model:value="inputText" type="text" placeholder="Message..."
                        @keyup.enter="feedInput()" />
                    <n-button v-on:click="feedInput()">Feed Input</n-button>
                    <!-- <n-button secondary type="warning" v-on:click="interrupt()">Interrupt</n-button> -->
                </n-input-group>
            </n-flex>
        </n-flex>
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
                <n-button v-on:click="clear()">
                    Clear
                </n-button>
            </n-flex>
        </template>
    </n-card>
</template>

<style scoped></style>