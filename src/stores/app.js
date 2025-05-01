// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    subjects: [],
  }),
  actions: {
    setSubjects(subjects) {
      this.subjects = subjects;
    }
  }
})
