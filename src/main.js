/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import GlobalMessage from '@/components/GlobalMessage.vue'
import AppFooter from '@/components/AppFooter.vue'

// Composables
import { createApp } from 'vue'

import messageService from './utils/message';

const app = createApp(App)

registerPlugins(app)

app.use(messageService);

app.component('GlobalMessage', GlobalMessage)
app.component('AppFooter', AppFooter)

app.mount('#app')
