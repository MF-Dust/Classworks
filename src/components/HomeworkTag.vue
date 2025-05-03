<template>
  <div 
    class="homework-tag" 
    :class="{ 'dragging': isDragging }"
    :style="{ backgroundColor: tagColor }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <span class="tag-text">{{ text }}</span>
    <v-icon 
      v-if="showRemove" 
      size="x-small" 
      class="remove-icon" 
      icon="mdi-close" 
      @click.stop="$emit('remove')"
    />
  </div>
</template>

<script>
export default {
  name: 'HomeworkTag',
  props: {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'primary'
    },
    showRemove: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDragging: false
    };
  },
  computed: {
    tagColor() {
      // 使用 Vuetify 的颜色系统
      if (this.color.startsWith('#')) {
        return this.color;
      }
      return `rgb(var(--v-theme-${this.color}))`;
    }
  },
  methods: {
    handleDragStart(event) {
      this.isDragging = true;
      // 设置拖拽数据
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'homework-tag',
        id: this.id,
        text: this.text,
        color: this.color
      }));
    },
    handleDragEnd() {
      this.isDragging = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.homework-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  margin: 0 4px;
  font-size: 0.85rem;
  color: white;
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.dragging {
    opacity: 0.6;
    transform: scale(0.95);
  }
  
  .tag-text {
    margin-right: 4px;
  }
  
  .remove-icon {
    cursor: pointer;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
}
</style>