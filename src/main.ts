import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#28293D',
          surface: '#2D2E45',
          primary: '#3170F3',
          secondary: '#424361',
          error: '#CF6679',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
      light: {
        dark: false,
        colors: {
          background: '#FAFAFA',
          surface: '#FFFFFF',
          primary: '#3170F3',
          secondary: '#757575',
        },
      },
    },
  },
  defaults: {
    VCard: {
      elevation: 2,
    },
    VBtn: {
      variant: 'flat',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
