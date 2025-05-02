<template>
  <v-dialog v-model="dialog" max-width="600" fullscreen-breakpoint="sm">
    <v-card class="random-picker-card">
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon icon="mdi-account-question" class="mr-2" />
        随机抽选
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-card-text v-if="!isPickingStarted" class="text-center py-6">
        <!-- Mode Toggle -->
        <v-btn-toggle v-model="pickingMode" mandatory color="primary" variant="outlined" class="mode-toggle">
          <v-btn value="individual" prepend-icon="mdi-account">
            抽个人
          </v-btn>
          <v-btn value="group" prepend-icon="mdi-account-group">
            抽小组
          </v-btn>
        </v-btn-toggle>

        <div class="text-h6 mb-4">请选择抽取{{ countLabel }}</div>

        <div class="d-flex justify-center align-center counter-container">
          <v-btn size="x-large" icon="mdi-minus" variant="tonal" color="primary" :disabled="(pickingMode === 'individual' ? count : numberOfGroups) <= minAllowedCount"
            @click="decrementCount" class="counter-btn" />

          <div class="count-display mx-8">
            <span class="text-h2 font-weight-bold">{{ pickingMode === 'individual' ? count : numberOfGroups }}</span>
            <span class="text-subtitle-1 ml-2">{{ countLabel }}</span>
          </div>

          <v-btn size="x-large" icon="mdi-plus" variant="tonal" color="primary" :disabled="(pickingMode === 'individual' ? count : numberOfGroups) >= maxAllowedCount"
            @click="incrementCount" class="counter-btn" />
        </div>

        <div class="mt-4">
          <v-btn size="x-large" color="primary" prepend-icon="mdi-dice-multiple" @click="startPicking"
            :disabled="startDisabled" class="start-btn">
            开始抽取
          </v-btn>
        </div>

        <div v-if="startDisabled && filteredStudents.length > 0" class="mt-4 text-warning">
          {{ pickingMode === 'group' ? '学生人数不足以分成所选组数' : '可抽取学生人数不足' }}
        </div>
        <div v-else-if="filteredStudents.length === 0" class="mt-4 text-error">
          没有可抽取的学生，请调整过滤选项
        </div>

        <div class="mt-4 text-caption">
          当前可抽取学生: {{ filteredStudents.length }}人
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" icon="mdi-information-outline" size="small" class="ml-1" />
            </template>
            <div class="pa-2">
              <div v-if="tempFilters.excludeAbsent">• 已排除请假学生 ({{ absentCount }}人)</div>
              <div v-if="tempFilters.excludeLate">• 已排除迟到学生 ({{ lateCount }}人)</div>
              <div v-if="tempFilters.excludeExcluded">• 已排除不参与学生 ({{ excludedCount }}人)</div>
            </div>
          </v-tooltip><!-- 添加临时过滤选项 -->
       
              <div class="d-flex flex-wrap justify-center gap-2 mt-4">
                <v-chip :color="tempFilters.excludeLate ? 'warning' : 'default'"
                  :variant="tempFilters.excludeLate ? 'elevated' : 'text'"
                  @click="tempFilters.excludeLate = !tempFilters.excludeLate" prepend-icon="mdi-clock-alert"
                  class="filter-chip">
                  {{ tempFilters.excludeLate ? '排除' : '包含' }}迟到学生
                </v-chip>
                <v-chip :color="tempFilters.excludeAbsent ? 'error' : 'default'"
                  :variant="tempFilters.excludeAbsent ? 'elevated' : 'text'"
                  @click="tempFilters.excludeAbsent = !tempFilters.excludeAbsent" prepend-icon="mdi-account-off"
                  class="filter-chip">
                  {{ tempFilters.excludeAbsent ? '排除' : '包含' }}请假学生
                </v-chip>

                

                <v-chip :color="tempFilters.excludeExcluded ? 'grey' : 'default'"
                  :variant="tempFilters.excludeExcluded ? 'elevated' : 'text'"
                  @click="tempFilters.excludeExcluded = !tempFilters.excludeExcluded" prepend-icon="mdi-account-cancel"
                  class="filter-chip">
                  {{ tempFilters.excludeExcluded ? '排除' : '包含' }}不参与学生
                </v-chip>
         </div>
        </div>
      </v-card-text>

      <v-card-text v-else class="text-center py-6">
        <!-- Animation for Individual Picking -->
        <div v-if="isAnimating && pickingMode === 'individual'" class="animation-container">
          <div class="animation-wrapper">
            <transition-group name="shuffle" tag="div" class="shuffle-container">
              <div v-for="(student, index) in animationStudents" :key="student.id" class="student-item"
                :class="{ 'highlighted': highlightedIndices.includes(index) }">
                {{ student.name }}
              </div>
            </transition-group>
          </div>
        </div>

        <!-- Results Display -->
        <div v-else class="result-display">
          <div class="text-h6 mb-4">抽取结果</div>

          <!-- Individual Results -->
          <div v-if="pickingMode === 'individual'">
            <v-card v-for="(student, index) in pickedStudents" :key="index" variant="outlined" color="primary"
              class="mb-2 result-card">
              <v-card-text class="text-h4 text-center py-4 d-flex align-center justify-center">
                {{ student }}
                <v-btn icon="mdi-refresh" variant="text" size="small" class="ml-2 refresh-btn"
                  @click="refreshSingleStudent(index)" :disabled="remainingStudents.length === 0"
                  :title="remainingStudents.length === 0 ? '没有更多可用学生' : '重新抽取此学生'" />
              </v-card-text>
            </v-card>
          </div>

          <!-- Group Results -->
          <div v-else-if="pickingMode === 'group'">
            <v-card v-for="(group, index) in pickedGroups" :key="index" class="mb-3 group-result-card" variant="tonal">
              <v-card-title class="group-title">小组 {{ index + 1 }}</v-card-title>
              <v-card-text>
                <v-chip v-for="student in group" :key="student" class="student-chip" label size="large">
                  {{ student }}
                </v-chip>
                <div v-if="group.length === 0" class="text-grey">（空）</div>
              </v-card-text>
            </v-card>
          </div>

          <div class="mt-8 d-flex justify-center">
            <v-btn color="primary" prepend-icon="mdi-refresh" @click="resetPicker()" size="large" class="mx-2">
              重新抽取
            </v-btn>
            <v-btn color="grey" variant="outlined" @click="dialog = false" size="large" class="mx-2">
              关闭
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { getSetting, settingsDefinitions } from '@/utils/settings'; // Import settingsDefinitions

export default {
  name: 'RandomPicker',
  props: {
    studentList: {
      type: Array,
      required: true
    },
    attendance: {
      type: Object,
      required: true,
      default: () => ({ absent: [], late: [], exclude: [] })
    }
  },
  data() {
    return {
      dialog: false,
      count: getSetting('randomPicker.defaultCount'),
      pickingMode: 'individual', // 'individual' or 'group'
      numberOfGroups: getSetting('randomPicker.numberOfGroups'),
      isPickingStarted: false,
      isAnimating: false,
      pickedStudents: [],
      pickedGroups: [], // To store the results for group picking
      animationStudents: [],
      highlightedIndices: [],
      animationTimer: null,
      getSetting,
      // 添加临时过滤选项
      tempFilters: {
        excludeAbsent: getSetting('randomPicker.excludeAbsent'),
        excludeLate: getSetting('randomPicker.excludeLate'),
        excludeExcluded: getSetting('randomPicker.excludeExcluded')
      }
    };
  },
  computed: {
    // 计算请假、迟到、不参与的学生数量
    absentCount() {
      return this.attendance.absent ? this.attendance.absent.length : 0;
    },
    lateCount() {
      return this.attendance.late ? this.attendance.late.length : 0;
    },
    excludedCount() {
      return this.attendance.exclude ? this.attendance.exclude.length : 0;
    },

    // 使用临时过滤选项过滤学生
    filteredStudents() {
      if (!this.studentList || !this.studentList.length) return [];

      return this.studentList.filter(student => {
        // 根据临时过滤选项过滤学生
        if (this.tempFilters.excludeAbsent && this.attendance.absent.includes(student)) {
          return false;
        }
        if (this.tempFilters.excludeLate && this.attendance.late.includes(student)) {
          return false;
        }
        if (this.tempFilters.excludeExcluded && this.attendance.exclude.includes(student)) {
          return false;
        }
        return true;
      });
    },

    // 兼容性：保留原有的 availableStudents 计算属性，但使用新的过滤逻辑
    availableStudents() {
      return this.filteredStudents;
    },

    maxAllowedCount() {
      // Adjust max count based on mode
      if (this.pickingMode === 'individual') {
        return Math.min(getSetting('randomPicker.maxCount'), this.filteredStudents.length);
      } else {
        // For groups, the 'count' represents number of groups, not individuals
        // Max groups is defined in settings, min is 2
        const maxGroupsFromSettings = settingsDefinitions['randomPicker.numberOfGroups'].validate ? settingsDefinitions['randomPicker.numberOfGroups'].validate(10) ? 10 : 2 : 10; // Use validation if possible, fallback
        return Math.min(maxGroupsFromSettings, Math.floor(this.filteredStudents.length / 2)); // Cannot have more groups than half the students
      }
    },
    minAllowedCount() {
      return this.pickingMode === 'individual' ? 1 : 2; // Min 1 individual, min 2 groups
    },
    countLabel() {
      return this.pickingMode === 'individual' ? '人数' : '组数';
    },
    startDisabled() {
      if (this.pickingMode === 'individual') {
        return this.filteredStudents.length === 0 || this.count > this.filteredStudents.length;
      } else {
        // Disable if not enough students for the selected number of groups (at least 1 per group ideally, min 2 groups)
        return this.filteredStudents.length < this.numberOfGroups || this.numberOfGroups < 2;
      }
    },

    // 计算剩余可用学生（排除已抽取的学生）
    remainingStudents() {
      return this.filteredStudents.filter(student => !this.pickedStudents.includes(student));
    }
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        // 打开对话框时重置状态
        this.count = getSetting('randomPicker.defaultCount');
        this.isPickingStarted = false;
        this.isAnimating = false;
        this.pickedStudents = [];

        // 重置临时过滤选项为设置中的值
        this.tempFilters = {
          excludeAbsent: getSetting('randomPicker.excludeAbsent'),
          excludeLate: getSetting('randomPicker.excludeLate'),
          excludeExcluded: getSetting('randomPicker.excludeExcluded')
        };
      } else {
        // 关闭对话框时清除计时器
        if (this.animationTimer) {
          clearTimeout(this.animationTimer);
          this.animationTimer = null;
        }
      }
    },

    // 监听过滤选项变化，确保count不超过可用学生数
    'tempFilters': {
      handler() {
        if (this.count > this.maxAllowedCount) {
          this.count = Math.max(1, this.maxAllowedCount);
        }
      },
      deep: true
    }
  },
  methods: {
    open() {
      this.dialog = true;
      // Reset state when opening
      this.resetPicker(false); // Don't reset filters on open
      // Re-fetch settings in case they changed
      this.count = getSetting('randomPicker.defaultCount');
      this.numberOfGroups = getSetting('randomPicker.numberOfGroups');
      this.tempFilters.excludeAbsent = getSetting('randomPicker.excludeAbsent');
      this.tempFilters.excludeLate = getSetting('randomPicker.excludeLate');
      this.tempFilters.excludeExcluded = getSetting('randomPicker.excludeExcluded');
    },
    decrementCount() {
      if (this.pickingMode === 'individual' && this.count > 1) {
        this.count--;
      } else if (this.pickingMode === 'group' && this.numberOfGroups > this.minAllowedCount) {
        this.numberOfGroups--;
      }
    },
    incrementCount() {
      if (this.pickingMode === 'individual' && this.count < this.maxAllowedCount) {
        this.count++;
      } else if (this.pickingMode === 'group' && this.numberOfGroups < this.maxAllowedCount) {
        this.numberOfGroups++;
      }
    },
    startPicking() {
      if (this.startDisabled) return;

      this.isPickingStarted = true;
      this.pickedStudents = [];
      this.pickedGroups = [];

      if (this.pickingMode === 'individual') {
        this.startIndividualPicking();
      } else {
        this.startGroupPicking();
      }
    },

    startIndividualPicking() {
      const useAnimation = getSetting('randomPicker.animation');
      if (useAnimation && this.count > 0) {
        this.isAnimating = true;
        this.runAnimation(() => {
          this.pickStudents();
          this.isAnimating = false;
        });
      } else {
        this.pickStudents();
        this.isAnimating = false; // Ensure animation state is false
      }
    },

    startGroupPicking() {
      // Group picking doesn't use the shuffle animation for now
      this.isAnimating = false;
      this.pickGroups();
    },

    pickStudents() {
      const shuffled = [...this.filteredStudents].sort(() => 0.5 - Math.random());
      this.pickedStudents = shuffled.slice(0, this.count);
    },

    pickGroups() {
      if (this.filteredStudents.length < this.numberOfGroups || this.numberOfGroups < 2) {
        console.error("无法分组，学生人数不足或组数无效");
        this.pickedGroups = [];
        return;
      }

      // Shuffle the filtered students
      let shuffled = [...this.filteredStudents].sort(() => 0.5 - Math.random());

      // Distribute students into groups
      const groups = Array.from({ length: this.numberOfGroups }, () => []);
      let groupIndex = 0;
      shuffled.forEach(student => {
        groups[groupIndex].push(student);
        groupIndex = (groupIndex + 1) % this.numberOfGroups;
      });

      this.pickedGroups = groups;
    },

    runAnimation(callback) {
      const totalSteps = 5; // 动画总步数
      let currentStep = 0;
      const intervalTime = 50; // 初始间隔时间

      const animate = () => {
        // 清除之前的高亮
        this.highlightedIndices = [];

        // 随机选择要高亮的索引
        const indices = [];
        for (let i = 0; i < this.count; i++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * this.animationStudents.length);
          } while (indices.includes(randomIndex));
          indices.push(randomIndex);
        }

        this.highlightedIndices = indices;

        currentStep++;

        // 逐渐增加间隔时间，使动画变慢
        const nextInterval = intervalTime + (currentStep * 20);

        if (currentStep < totalSteps) {
          this.animationTimer = setTimeout(animate, nextInterval);
        } else {
          // 动画结束，显示最终结果
          setTimeout(() => {
            this.finishPicking();
          }, 500);
        }
      };

      // 开始动画
      animate();
    },
    finishPicking() {
      this.isAnimating = false;

      // 随机选择学生
      const shuffled = [...this.filteredStudents].sort(() => 0.5 - Math.random());
      this.pickedStudents = shuffled.slice(0, this.count);
    },
    resetPicker() {
      this.isPickingStarted = false;
      this.isAnimating = false;
      this.pickedStudents = [];
      this.pickedGroups = []; // Reset groups as well
      this.animationStudents = [];
      this.highlightedIndices = [];
      clearTimeout(this.animationTimer);
      this.count = getSetting('randomPicker.defaultCount'); // Reset count
      this.numberOfGroups = getSetting('randomPicker.numberOfGroups'); // Reset group count
      // Optionally reset filters
      if (resetFilters) {
          this.tempFilters.excludeAbsent = getSetting('randomPicker.excludeAbsent');
          this.tempFilters.excludeLate = getSetting('randomPicker.excludeLate');
          this.tempFilters.excludeExcluded = getSetting('randomPicker.excludeExcluded');
      }
    }
  }
};
</script>

<style scoped>
.random-picker-card {
  overflow: hidden;
}

.counter-container {
  margin: 2rem 0;
}

.counter-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.count-display {
  min-width: 100px;
  text-align: center;
}

.start-btn {
  min-width: 200px;
  height: 64px;
  border-radius: 32px;
  font-size: 1.2rem;
}

/* 过滤选项卡片样式 */
.filter-options-card {
  max-width: 450px;
  margin: 0 auto;
}

.filter-chip {
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
}

/* 学生列表提示框样式 */
.student-list-tooltip {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 5px;
  font-size: 0.9em;
}

.animation-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.animation-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.shuffle-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.student-item {
  padding: 10px 15px;
  background-color: rgba(var(--v-theme-surface-variant), 0.7);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 1.2rem;

  &.highlighted {
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
    transform: scale(1.1);
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.result-container {
  min-height: 300px;
}

.result-card {
  max-width: 400px;
  margin: 0 auto;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);

    .refresh-btn {
      opacity: 1;
    }
  }
}

.refresh-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
}

/* 刷新动画 */
@keyframes refresh-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(var(--v-theme-primary), 0.5);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.7);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(var(--v-theme-primary), 0.5);
  }
}

.refresh-animation {
  animation: refresh-pulse 0.5s ease;
}

/* 动画效果 */
.shuffle-enter-active,
.shuffle-leave-active {
  transition: all 0.5s ease;
}

.shuffle-enter-from,
.shuffle-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.shuffle-move {
  transition: transform 0.5s ease;
}

/* 触摸屏优化 */
@media (hover: none) {

  .counter-btn,
  .start-btn {
    min-height: 72px;
  }

  .student-item {
    padding: 12px 20px;
    font-size: 1.4rem;
  }

  .refresh-btn {
    opacity: 1;
    min-width: 36px;
    min-height: 36px;
  }

  .filter-chip {
    min-height: 40px;
    font-size: 1rem;
  }
}
.mode-toggle {
  margin-bottom: 20px;
}

.group-result-card {
  margin-bottom: 12px;
}

.group-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #1976D2; /* Or use Vuetify theme color */
}

.student-chip {
  margin: 2px;
}

.gap-2 > * {
  margin-left: 4px;
  margin-right: 4px;
}

.counter-container {
  margin-bottom: 20px;
}

.count-display {
  min-width: 120px; /* Ensure space for label change */
  text-align: center;
}

.result-container {
  max-height: calc(100vh - 200px); /* Adjust as needed */
  overflow-y: auto;
}

/* Add styles for group results if needed */
.group-list {
  padding-left: 0;
  list-style: none;
}

.group-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.group-item-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.group-student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

</style>