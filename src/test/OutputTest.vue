<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NInput, NInputGroup } from 'naive-ui';
import { ref } from 'vue';
import { guid } from '@/utils';
import OutputProviderTencent from '@/output/outputprovider_tencent';

const inputText = ref('');

const params = {
    tencent_secretid: window.debugSecrets.secretId,
    tencent_secretkey: window.debugSecrets.secretKey,
    tencent_appid: window.debugSecrets.appId,
    // tencent_tts_speed: 0,
    tencent_tts_voice_type: 1002,
};
const outputProvider = new OutputProviderTencent(params);
const confirmedOutput = ref('');
const btnState = ref(0);

outputProvider.onConfirmOutput = msg => {
    confirmedOutput.value += msg;
};

function clear() {
    confirmedOutput.value = '';
}

async function start() {
    btnState.value = -1;
    await outputProvider.start();
    btnState.value = 1;
}

async function stop() {
    btnState.value = -1;
    await outputProvider.stop();
    btnState.value = 0;
}

function feedInput() {
    const msg = inputText.value;
    inputText.value = '';
    outputProvider.feedInput(msg);
}

function interrupt() {
    outputProvider.interrupt();
}


</script>

<template>
    <n-card title="OutputProvider测试">
        <!-- <template #header-extra>
      #header-extra
    </template> -->
        <n-flex vertical>
            <n-flex vertical>
                <n-text>Confirmed Output:</n-text>
                <n-text>{{ confirmedOutput }}</n-text>
            </n-flex>
            <n-flex>
                <n-input-group>
                    <n-input v-model:value="inputText" type="text" placeholder="Message..."
                        @keyup.enter="feedInput()" />
                    <n-button v-on:click="feedInput()">Feed Input</n-button>
                    <n-button secondary type="warning" v-on:click="interrupt()">Interrupt</n-button>
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