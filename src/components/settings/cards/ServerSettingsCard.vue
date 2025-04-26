<template>
  <settings-card title="数据源设置" icon="mdi-database" :loading="loading">
    <v-form>
      <setting-item setting-key="server.provider" title="数据提供者" />
      <v-divider class="my-2" />
      <setting-item setting-key="server.domain" title="服务器域名" />      <v-divider class="my-2" />

      <setting-item setting-key="server.classNumber" title="班号" />
     
    </v-form>
  </settings-card>
</template>

<script>
import SettingsCard from "@/components/SettingsCard.vue";
import SettingItem from "@/components/settings/SettingItem.vue";
export default {
  name: "ServerSettingsCard",
  components: { SettingsCard, SettingItem }, // 添加 SettingItem 到 components
  props: {
    loading: Boolean,
  },
  // data() 可以移除，因为没有本地状态
};
</script>
