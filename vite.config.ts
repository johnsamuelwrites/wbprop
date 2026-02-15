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
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify-vendor': ['vuetify'],
          'echarts-core': ['echarts/core', 'echarts/renderers', 'vue-echarts'],
          'echarts-charts': [
            'echarts/charts',
            'echarts/components',
          ],
          'd3-vendor': ['d3'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  }
})
