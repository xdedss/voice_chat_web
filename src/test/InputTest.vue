<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex } from 'naive-ui';
import { ref } from 'vue';
import { guid } from '@/utils';
import InputProviderTencent from '@/input/inputprovider_tencent';

const params = {
  tencent_secretid: window.debugSecrets.secretId,
  tencent_secretkey: window.debugSecrets.secretKey,
  tencent_appid: window.debugSecrets.appId,
  // 临时密钥参数，非必填
  // token: config.token,
  // 实时识别接口参数
  tencent_asr_engine_model_type: '16k_zh', // 因为内置WebRecorder采样16k的数据，所以参数 engineModelType 需要选择16k的引擎，为 '16k_zh'
  // 以下为非必填参数，可跟据业务自行修改
  // voice_format : 1,
  // hotword_id : '08003a00000000000000000000000000',
  tencent_asr_needvad: 1,
  // filter_dirty: 1,
  // filter_modal: 2,
  // filter_punc: 0,
  // convert_num_mode : 1,
  // word_info: 2
};
const inputProvider = new InputProviderTencent(params);
const textIdentified = ref([]);
const audioDevices = ref([]);
const selectedDeviceId = ref('default');
const btnState = ref(0);

inputProvider.onSentencePartialComplete = text => {
  textIdentified.value[textIdentified.value.length - 1].text = text;
};

inputProvider.onSentenceComplete = text => {
  textIdentified.value[textIdentified.value.length - 1].text = text;
  textIdentified.value[textIdentified.value.length - 1].finished = true;
}

inputProvider.onSentenceBegin = () => {
  textIdentified.value.push({
    text: '',
    finished: false,
    key: guid(),
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
    if (devices.length > 7) {
      selectedDeviceId.value = devices[7].deviceId;
    }
  } catch (error) {
    console.error('Error getting audio devices:', error);
    alert('Error getting audio devices:' + error);
  }
}

async function start() {
  btnState.value = -1;
  inputProvider.deviceId = selectedDeviceId.value;
  await inputProvider.start();
  btnState.value = 1;
}

async function stop() {
  btnState.value = -1;
  await inputProvider.stop();
  btnState.value = 0;
}

function clear() {
  textIdentified.value = [];
}

</script>

<template>
  <n-card title="InputProvider测试">
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
          <n-list-item v-for="t in textIdentified" :key="t.key">
            <n-text :type="t.finished ? '' : 'primary'">{{t.text}}</n-text>
          </n-list-item>
        </n-list>
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