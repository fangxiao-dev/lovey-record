import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni({
    inputDir: path.resolve(__dirname, './')
  })],
  server: {
    port: 5173,
    host: 'localhost'
  }
})
