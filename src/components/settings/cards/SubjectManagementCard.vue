<template>
  <v-card class="settings-card">
    <v-card-title>
      <v-icon left>mdi-book-open-page-variant-outline</v-icon>
      科目管理
    </v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col v-if="localSubjects.length === 0" cols="12">
          <p class="text-grey text-center my-4">暂无科目</p>
        </v-col>
        <v-col
          v-for="(subject, index) in localSubjects"
          :key="index"
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card variant="outlined" class="subject-card">
            <v-card-text class="d-flex justify-space-between align-center pa-2">
              <span class="text-body-1">{{ subject }}</span>
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                @click="removeSubject(index)"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <v-text-field
        v-model="newSubject"
        label="添加新科目"
        variant="outlined"
        density="compact"
        hide-details="auto"
        append-inner-icon="mdi-plus-circle"
        @click:append-inner="addSubject"
        @keyup.enter="addSubject"
        class="mb-2"
      ></v-text-field>

    </v-card-text>
     <v-snackbar v-model="showSnackbar" :timeout="2000" :color="snackbarColor" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-card>
</template>

<script>
import { getSetting, setSetting } from '@/utils/settings';
import { useAppStore } from '@/stores/app';

export default {
  name: 'SubjectManagementCard',
  data() {
    return {
      localSubjects: [],
      newSubject: '',
      showSnackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
    };
  },
  created() {
    this.loadSubjects();
  },
  methods: {
    loadSubjects() {
      // 从设置加载科目列表，确保是数组类型
      const subjects = getSetting('subjects');
      this.localSubjects = Array.isArray(subjects) ? [...subjects] : []; // 创建副本以避免直接修改原始设置
      console.log('Loaded subjects:', this.localSubjects);
    },
    addSubject() {
      const subjectToAdd = this.newSubject.trim();
      if (subjectToAdd && !this.localSubjects.includes(subjectToAdd)) {
        this.localSubjects.push(subjectToAdd);
        this.saveSubjects();
        this.newSubject = ''; // 清空输入框
        this.showSnackbarMessage('科目添加成功', 'success');
      } else if (this.localSubjects.includes(subjectToAdd)) {
         this.showSnackbarMessage('科目已存在', 'warning');
      } else {
         this.showSnackbarMessage('请输入科目名称', 'warning');
      }
    },
    removeSubject(index) {
      const removedSubject = this.localSubjects.splice(index, 1)[0];
      this.saveSubjects();
      this.showSnackbarMessage(`科目 "${removedSubject}" 已删除`, 'info');
    },
    saveSubjects() {
      console.log('Saving subjects:', this.localSubjects);
      const success = setSetting('subjects', this.localSubjects);
      if (success) {
        // 使用 store 来通知其他组件更新
        const appStore = useAppStore();
        appStore.setSubjects(this.localSubjects);
        console.log('Subjects saved successfully and store updated.');
      } else {
        console.error('Failed to save subjects.');
        this.showSnackbarMessage('保存科目失败', 'error');
        // 如果保存失败，可能需要重新加载原始数据
        this.loadSubjects();
      }
    },
     showSnackbarMessage(message, color = 'success') {
      this.snackbarText = message;
      this.snackbarColor = color;
      this.showSnackbar = true;
    },
  },
};
</script>

<style scoped>
/* 可以添加一些样式 */
.settings-card {
  margin-bottom: 16px;
}
</style>
