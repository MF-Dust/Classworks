<template>
  <settings-card title="显示设置" icon="mdi-monitor" border>
      <v-list>
        <setting-item :setting-key="'display.emptySubjectDisplay'" />
        

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.dynamicSort'" />

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.showRandomButton'" />

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.showFullscreenButton'" />

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.cardHoverEffect'" />

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.enhancedTouchMode'" />

        <v-divider class="my-2" />
        <setting-item :setting-key="'display.showAntiScreenBurnCard'" />



      </v-list>
  </settings-card>
</template>

<script>
import SettingsCard from '@/components/SettingsCard.vue';
import SettingItem from '@/components/settings/SettingItem.vue';
export default {
  name: 'DisplaySettingsCard',
  components: { SettingsCard, SettingItem },
  data() {
    
    return {
     
    };
  },
  
  
};
</script>
