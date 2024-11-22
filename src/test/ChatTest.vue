<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NInput, NInputGroup } from 'naive-ui';
import { ref } from 'vue';
import { guid } from '@/utils';
import ChatProviderOpenai from '@/chat/chatprovider_openai';

const inputText = ref('');

const params = {
  openai_key: window.debugSecrets.openai_key,
  openai_base: window.debugSecrets.openai_base,
  openai_model: window.debugSecrets.openai_model,
};
const chatProvider = new ChatProviderOpenai(params);
const chatLog = ref([]);
const btnState = ref(0);

chatProvider.onChatResponse = msg => {
  chatLog.value.push({
    'role': 'assistant',
    'text': msg,
    'key': guid(),
  });
};

function clear() {
  chatLog.value = [];
  chatLog.value.push({
    'role': 'system',
    'text': chatProvider.systemPrompt,
    'key': guid(),
  });
}
clear();

async function start() {
  btnState.value = -1;
  await chatProvider.start();
  btnState.value = 1;
}

async function stop() {
  btnState.value = -1;
  await chatProvider.stop();
  btnState.value = 0;
}

function feedInput() {
  const msg = inputText.value;
  inputText.value = '';
  chatLog.value.push({
    'role': 'user',
    'text': msg,
    'key': guid(),
  });
  chatProvider.feedInput(msg);
}

function interrupt() {
  chatProvider.interrupt();
}


</script>

<template>
  <n-card title="ChatProvider测试">
    <!-- <template #header-extra>
      #header-extra
    </template> -->
    <n-flex vertical>
      <n-flex vertical>
        <n-list hoverable clickable>
          <n-list-item v-for="t in chatLog" :key="t.key">
            <n-text>{{ t.role }}: {{ t.text }}</n-text>
          </n-list-item>
        </n-list>
      </n-flex>
      <n-flex>
        <n-input-group>
          <n-input v-model:value="inputText" type="text" placeholder="Message..." @keyup.enter="feedInput()" />
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