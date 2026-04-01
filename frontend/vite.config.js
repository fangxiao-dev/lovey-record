import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni({
    inputDir: path.resolve(__dirname, './'),
    outputDir: path.resolve(__dirname, './unpackage/dist/dev/h5')
  })],
  server: {
    port: 5173,
    host: 'localhost'
  }
})
