<template>
    <!-- <n-space> <n-switch v-model:value="inverted" /> inverted </n-space> -->
    <n-flex vertical style="flex: 1">
        <n-layout-header :inverted="inverted" bordered>
            <n-menu mode="horizontal" :inverted="inverted" :options="topMenuOptions" />
        </n-layout-header>
        <n-layout has-sider style="flex:1">
            <n-layout-sider bordered show-trigger collapse-mode="width" :collapsed-width="64" :width="240"
                :native-scrollbar="false" :inverted="inverted" style="">
                <n-menu :inverted="inverted" :collapsed-width="64" :collapsed-icon-size="22" :options="sideMenuOptions"
                    @update:value="sideMenuUpdate" />
            </n-layout-sider>

            <!-- Main chat -->
            <n-flex vertical v-if="panelSelected == 'home'" justify="center" style="padding: 0 .5rem; width: 100%;">
                <n-flex justify="center">
                    <chat-widget></chat-widget>
                </n-flex>
            </n-flex>

            <!-- Testing -->
            <n-layout v-if="panelSelected == 'test'" :native-scrollbar="false" content-style="padding: 0 .5rem;">
                <n-flex vertical>
                    <input-test></input-test>
                    <chat-test></chat-test>
                    <output-test></output-test>
                    <full-test></full-test>
                </n-flex>
            </n-layout>

            <!-- Settings -->
            <n-layout v-if="panelSelected == 'settings'" :native-scrollbar="false" content-style="padding: 0 .5rem;">
                <n-flex vertical>
                    <settings-panel></settings-panel>
                </n-flex>
            </n-layout>

        </n-layout>
        <n-layout-footer :inverted="inverted" bordered>
            Footer Footer Footer
        </n-layout-footer>
    </n-flex>
</template>

<script setup>
import { h, ref } from "vue";
import { NIcon, NMenu, NLayout, NLayoutHeader, NLayoutSider, NLayoutFooter, NFlex } from "naive-ui";
import {
    BookOutline as BookIcon,
    HomeOutline,
    AnalyticsOutline,
    SettingsOutline,
} from "@vicons/ionicons5";
import InputTest from "./test/InputTest.vue";
import ChatTest from "./test/ChatTest.vue";
import OutputTest from "./test/OutputTest.vue";
import FullTest from "./test/FullTest.vue";
import SettingsPanel from "./SettingsPanel.vue";
import ChatWidget from "./ChatWidget.vue";

function renderIcon(icon) {
    return () => h(NIcon, null, { default: () => h(icon) });
}

const inverted = ref(false);
const panelSelected = ref('home');

function sideMenuUpdate(key, item) {
    console.log('sideMenuUpdate', key, item);
    panelSelected.value = key;
}

const sideMenuOptions = [
    {
        label: "Chat",
        key: "home",
        icon: renderIcon(HomeOutline),
    },
    {
        label: "单元测试",
        key: "test",
        icon: renderIcon(AnalyticsOutline),
    },
    {
        label: "配置",
        key: "settings",
        icon: renderIcon(SettingsOutline),
    },
]

const topMenuOptions = [
    {
        label: "且听风吟",
        key: "hear-the-wind-sing",
        icon: renderIcon(BookIcon)
    },
    // {
    //     label: "1973年的弹珠玩具",
    //     key: "pinball-1973",
    //     icon: renderIcon(BookIcon),
    //     disabled: true,
    //     children: [
    //         {
    //             label: "鼠",
    //             key: "rat"
    //         }
    //     ]
    // },
    // {
    //     label: "寻羊冒险记",
    //     key: "a-wild-sheep-chase",
    //     disabled: true,
    //     icon: renderIcon(BookIcon)
    // },
    // {
    //     label: "舞，舞，舞",
    //     key: "dance-dance-dance",
    //     icon: renderIcon(BookIcon),
    //     children: [
    //         {
    //             type: "group",
    //             label: "人物",
    //             key: "people",
    //             children: [
    //                 {
    //                     label: "叙事者",
    //                     key: "narrator",
    //                     icon: renderIcon(PersonIcon)
    //                 },
    //                 {
    //                     label: "羊男",
    //                     key: "sheep-man",
    //                     icon: renderIcon(PersonIcon)
    //                 }
    //             ]
    //         },
    //         {
    //             label: "饮品",
    //             key: "beverage",
    //             icon: renderIcon(WineIcon),
    //             children: [
    //                 {
    //                     label: "威士忌",
    //                     key: "whisky"
    //                 }
    //             ]
    //         },
    //         {
    //             label: "食物",
    //             key: "food",
    //             children: [
    //                 {
    //                     label: "三明治",
    //                     key: "sandwich"
    //                 }
    //             ]
    //         },
    //         {
    //             label: "过去增多，未来减少",
    //             key: "the-past-increases-the-future-recedes"
    //         }
    //     ]
    // }
];

</script>