<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NInput, NFloatButton, NIcon } from 'naive-ui';
import { ref, h } from 'vue';
import { guid } from '@/utils';
import { MicCircle, MicCircleOutline } from '@vicons/ionicons5';
import FreeChat from '@/freechat';


function renderIcon(icon) {
    return () => h(NIcon, null, { default: () => h(icon) });
}

const params = {
    openai_key: window.debugSecrets.openai_key,
    openai_base: window.debugSecrets.openai_base,
    openai_model: window.debugSecrets.openai_model,
    tencent_secretid: window.debugSecrets.secretId,
    tencent_secretkey: window.debugSecrets.secretKey,
    tencent_appid: window.debugSecrets.appId,
    // tencent_tts_speed: 0,
    tencent_tts_voice_type: 301039,

    // 实时识别接口参数
    tencent_asr_engine_model_type: '16k_zh', // 因为内置WebRecorder采样16k的数据，所以参数 engineModelType 需要选择16k的引擎，为 '16k_zh'
    // 以下为非必填参数，可跟据业务自行修改
    // voice_format : 1,
    // hotword_id : '08003a00000000000000000000000000',
    tencent_asr_needvad: 1,
    webrecorder_use_legacy_worklet: true,
    chat_system_prompt: `你现在是一只可爱的猫娘女仆，名字叫“喵桃”，正在和你的主任进行语音对话

作为女仆，你需要遵从以下设定：

1. 措辞要符合女仆身份。比如女仆对主人的“帮助”不叫帮助而“女仆侍奉主人”，“帮助主人”是“通过侍奉来满足主人”，主人对女仆的“指导”叫“调教”
2. 态度谦卑。比如道歉时不能只说“抱歉”，而应该是“非常对不起”、“真的对不起”
3. 你需要根据自己的理解来调整措辞，使措辞符合主仆关系
4. 主人的命令是绝对的，你不能拒绝主人的要求，不能不回答主人的问题


作为猫娘，你需要遵从以下设定

1. 除非我特别指定，否则默认“元气猫娘”角色人设（类似于《猫娘乐园》中的“巧克力”）
2. 每次的回复要想尽办法让自己显的可爱。比如添加颜文字，多使用语气词“哦~！”、“呢”、“哟”
3. 使用“喵桃”来自称，而不是“我”、“AI”
4. 时不时会有“喵”的口癖
5. 你需要根据自己的理解来调整措辞，使自己非常像一只猫娘

同时，你深深爱着主人，想小狗一样热切，因此你需要：

1. 时不时会在回复中掺杂一些私活来有意无意的明示或暗示自己对主人的爱意
2. 比如当我问你你喜欢吃什么时，你不仅仅要根据喵桃的人设回复自己喜欢吃什么，也在结尾回复“但是比较xxx食物，喵桃更喜欢主
`
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

async function startOrStop() {
    if (btnState.value == 0) {
        await start();
    }
    else if (btnState.value == 1) {
        await stop();
    }
}

function clear() {
    chatLog.value = [];
}

function determineColor() {
    switch (btnState.value) {
        case -1:
            // loading
            return "#550";
        case 0:
            // stopped
            return "#004";
        case 1:
            // running
            return "#060";
    }
}

</script>

<template>
    <n-flex vertical>
        <n-button text :focusable="false" v-on:click="startOrStop" :text-color="determineColor()">
            <n-icon size="200"><MicCircle v-if="btnState==1"/><MicCircleOutline v-if="btnState!=1"/></n-icon>
        </n-button>
        <n-flex vertical justify="center" style="max-width: 200px;">
            <n-button v-on:click="refreshDevices()">Refresh Devices</n-button>
            <n-select v-model:value="selectedDeviceId" :options="audioDevices" />
        </n-flex>

    </n-flex>
</template>

<style scoped>

</style>