<script setup>
import { ref } from 'vue';
import InputProviderTencent from './input/inputprovider_tencent';

const params = {
  tencent_secretid: config.secretId,
  tencent_secretkey: config.secretKey,
  tencent_appid: config.appId,
  // 临时密钥参数，非必填
  // token: config.token,
  // 实时识别接口参数
  tencent_asr_engine_model_type: '16k_zh', // 因为内置WebRecorder采样16k的数据，所以参数 engineModelType 需要选择16k的引擎，为 '16k_zh'
  // 以下为非必填参数，可跟据业务自行修改
  // voice_format : 1,
  // hotword_id : '08003a00000000000000000000000000',
  // needvad: 1,
  // filter_dirty: 1,
  // filter_modal: 2,
  // filter_punc: 0,
  // convert_num_mode : 1,
  // word_info: 2
};
const inputProvider = new InputProviderTencent(params);
const textIdentified = ref('[text here]');
const selectDevices = ref([]);
const selectedDeviceId = ref('default');

inputProvider.OnRecognitionResultChange = text => {
  textIdentified.value = text;
}


async function refreshDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);
    selectDevices.value = [];
    devices.forEach(device => {
      if (device.kind === "audioinput") {
        const option = {};
        option.value = device.deviceId;
        option.label = device.label || `Microphone ${devices.value.length + 1}`;
        selectDevices.value.push(option);
      }
    });
  } catch (error) {
    console.error('Error getting audio devices:', error);
    alert('Error getting audio devices:' + error);
  }
}

async function start() {
  inputProvider.deviceId = selectedDeviceId.value;
  console.log('[][][]' + inputProvider.deviceId);
  inputProvider.start();
}

</script>

<template>
  <main>
    <button v-on:click="refreshDevices()">refresh</button>
    <select v-model="selectedDeviceId" class="dropdown">
      <option v-for="option in selectDevices" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <button v-on:click="start()">start</button>
    <button v-on:click="inputProvider.stop()">stop</button>
    {{ textIdentified }}
  </main>
</template>

<style scoped></style>