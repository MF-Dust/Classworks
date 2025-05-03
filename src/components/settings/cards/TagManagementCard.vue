<template>
  <settings-card title="作业标签管理" icon="mdi-tag-multiple">
    <v-list>
      <v-list-item>
        <template #prepend>
          <v-icon icon="mdi-tag-plus" class="mr-3" />
        </template>
        <v-list-item-title>启用作业标签</v-list-item-title>
        <v-list-item-subtitle>启用后可以为作业添加标签</v-list-item-subtitle>
        <template #append>
          <v-switch
            v-model="settings.tags.enabled"
            density="comfortable"
            hide-details
            @change="saveSettings"
          />
        </template>
      </v-list-item>

      <v-expand-transition>
        <div v-if="settings.tags.enabled">
          <v-divider class="my-2" />
          
          <!-- 标签列表 -->
          <v-list-item>
            <v-list-item-title>标签管理</v-list-item-title>
            <v-list-item-subtitle>添加、编辑或删除作业标签</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <v-row>
              <v-col cols="12">
                <v-sheet class="pa-4 mb-3" rounded border>
                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <div 
                      v-for="tag in settings.tags.list" 
                      :key="tag.id"
                      class="d-flex align-center"
                    >
                      <homework-tag
                        :id="tag.id"
                        :text="tag.text"
                        :color="tag.color"
                        :show-remove="true"
                        @remove="removeTag(tag.id)"
                        @click="editTag(tag)"
                      />
                      <v-tooltip location="top" text="点击标签进行编辑">
                        <template #activator="{ props }">
                          <v-icon 
                            icon="mdi-pencil-outline" 
                            size="x-small" 
                            class="ml-1" 
                            v-bind="props"
                            @click="editTag(tag)"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                    <div v-if="settings.tags.list.length === 0" class="text-caption text-grey pa-2">
                      暂无标签，请添加新标签
                    </div>
                  </div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-list-item>
          
          <!-- 添加新标签 -->
          <v-list-item>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newTag.text"
                  label="标签文本"
                  placeholder="输入标签文本"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTag.color"
                  label="标签颜色"
                  :items="colorOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <div
                        class="mr-2"
                        style="width: 16px; height: 16px; border-radius: 4px"
                        :style="{ backgroundColor: `rgb(var(--v-theme-${item.value}))` }"
                      ></div>
                      {{ item.title }}
                    </div>
                  </template>
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <div
                          style="width: 16px; height: 16px; border-radius: 4px"
                          :style="{ backgroundColor: `rgb(var(--v-theme-${item.value}))` }"
                        ></div>
                      </template>
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" class="d-flex justify-end gap-2">
                <v-btn
                  v-if="isEditing"
                  color="secondary"
                  prepend-icon="mdi-close"
                  @click="cancelEdit"
                >
                  取消编辑
                </v-btn>
                <v-btn
                  color="primary"
                  :prepend-icon="isEditing ? 'mdi-content-save' : 'mdi-plus'"
                  @click="addTag"
                  :disabled="!newTag.text"
                >
                  {{ isEditing ? '保存修改' : '添加标签' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item>
        </div>
      </v-expand-transition>
    </v-list>
  </settings-card>
</template>

<script>
import SettingsCard from '@/components/SettingsCard.vue';
import HomeworkTag from '@/components/HomeworkTag.vue';
import { getSetting, setSetting } from '@/utils/settings';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'TagManagementCard',
  components: {
    SettingsCard,
    HomeworkTag
  },
  data() {
    return {
      settings: {
        tags: {
          enabled: getSetting('tags.enabled') || false,
          list: getSetting('tags.list') || []
        }
      },
      newTag: {
        text: '',
        color: 'primary'
      },
      isEditing: false,
      editingTagId: null,
      colorOptions: [
        { title: '主色调', value: 'primary' },
        { title: '成功', value: 'success' },
        { title: '信息', value: 'info' },
        { title: '警告', value: 'warning' },
        { title: '错误', value: 'error' },
        { title: '紫色', value: 'purple' },
        { title: '深蓝', value: 'indigo' },
        { title: '橙色', value: 'orange' },
        { title: '粉色', value: 'pink' }
      ]
    };
  },
  methods: {
    saveSettings() {
      setSetting('tags.enabled', this.settings.tags.enabled);
      setSetting('tags.list', this.settings.tags.list);
      this.$emit('saved');
    },
    addTag() {
      if (!this.newTag.text) return;
      
      if (this.isEditing && this.editingTagId) {
        // 更新现有标签
        const tagIndex = this.settings.tags.list.findIndex(tag => tag.id === this.editingTagId);
        if (tagIndex !== -1) {
          this.settings.tags.list[tagIndex].text = this.newTag.text;
          this.settings.tags.list[tagIndex].color = this.newTag.color;
          this.saveSettings();
        }
        
        // 重置编辑状态
        this.isEditing = false;
        this.editingTagId = null;
      } else {
        // 添加新标签
        const newTag = {
          id: uuidv4(),
          text: this.newTag.text,
          color: this.newTag.color
        };
        
        this.settings.tags.list.push(newTag);
        this.saveSettings();
      }
      
      // 重置表单
      this.newTag.text = '';
      this.newTag.color = 'primary';
    },
    removeTag(tagId) {
      this.settings.tags.list = this.settings.tags.list.filter(tag => tag.id !== tagId);
      this.saveSettings();
      
      // 如果正在编辑的标签被删除，重置编辑状态
      if (this.editingTagId === tagId) {
        this.isEditing = false;
        this.editingTagId = null;
        this.newTag.text = '';
        this.newTag.color = 'primary';
      }
    },
    editTag(tag) {
      // 设置编辑状态
      this.isEditing = true;
      this.editingTagId = tag.id;
      
      // 填充表单数据
      this.newTag.text = tag.text;
      this.newTag.color = tag.color;
    },
    cancelEdit() {
      // 重置编辑状态
      this.isEditing = false;
      this.editingTagId = null;
      
      // 清空表单
      this.newTag.text = '';
      this.newTag.color = 'primary';
    }
  }
};
</script>

<style lang="scss" scoped>
.tag-preview {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  margin: 4px;
  font-size: 0.9rem;
  color: white;
}
</style>