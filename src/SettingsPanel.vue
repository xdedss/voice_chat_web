<script setup>
import { NCard, NButton, NText, NSelect, NList, NListItem, NFlex, NFormItem } from 'naive-ui';
import { ref } from 'vue';
import { getChatProviders, getInputProviders, getOutputProviders } from './registry';
import store from 'store2';

const settingsObject = ref({});

const inputProviders = getInputProviders();
const inputProviderOptions = [];
for (let inputProvider of inputProviders) {
    inputProviderOptions.push({
        value: inputProvider.name,
        label: inputProvider.name,
    })
}

const chatProviders = getChatProviders();
const chatProviderOptions = [];
for (let chatProvider of chatProviders) {
    chatProviderOptions.push({
        value: chatProvider.name,
        label: chatProvider.name,
    })
}

const outputProviders = getOutputProviders();
const outputProviderOptions = [];
for (let outputProvider of outputProviders) {
    outputProviderOptions.push({
        value: outputProvider.name,
        label: outputProvider.name,
    })
}

</script>

<template>
    <n-card title="模块选择">
        <n-flex vertical>
            <n-form-item path="input" label="InputProvider">
                <n-select v-model:value="settingsObject.inputProviderName" :options="inputProviderOptions"></n-select>
            </n-form-item>
            <n-form-item path="chat" label="ChatProvider">
                <n-select v-model:value="settingsObject.chatProviderName" :options="chatProviderOptions"></n-select>
            </n-form-item>
            <n-form-item path="output" label="OutputProvider">
                <n-select v-model:value="settingsObject.outputProviderName" :options="outputProviderOptions"></n-select>
            </n-form-item>
        </n-flex>
        <n-text>{{ settingsObject }}</n-text>
        <!-- <template #action>
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
        </template> -->
    </n-card>
</template>

<style scoped></style>