import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/vue/') || id.includes('/node_modules/vue-router/') || id.includes('/node_modules/pinia/')) {
            return 'vue-vendor'
          }
          if (id.includes('/node_modules/vuetify/')) {
            return 'vuetify-vendor'
          }
          if (id.includes('/node_modules/vue-echarts/') || id.includes('/node_modules/echarts/core') || id.includes('/node_modules/echarts/renderers')) {
            return 'echarts-core'
          }
          if (id.includes('/node_modules/echarts/charts') || id.includes('/node_modules/echarts/components')) {
            return 'echarts-charts'
          }
          if (id.includes('/node_modules/d3/')) {
            return 'd3-vendor'
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  }
})
