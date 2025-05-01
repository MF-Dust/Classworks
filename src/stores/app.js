// Utilities
import { defineStore } from 'pinia'
import { getSetting } from '@/utils/settings'; // Import getSetting

export const useAppStore = defineStore('app', {
  state: () => {
    const initialSubjects = getSetting('subjects');
    console.log('[app.js] Initial subjects from getSetting:', initialSubjects);
    const subjectsArray = Array.isArray(initialSubjects) ? initialSubjects : [];
    console.log('[app.js] Initialized subjects state:', subjectsArray);
    return {
      // Initialize subjects from settings, ensuring it's always an array
      subjects: subjectsArray,
    };
  },
  actions: {
    setSubjects(subjects) {
      console.log('[app.js] Setting subjects:', subjects);
      this.subjects = subjects;
    }
  }
})
