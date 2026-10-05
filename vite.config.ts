import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const vendorGroups = [
  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/, priority: 30 },
  { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light)[\\/]/, priority: 25 },
  { name: 'dnd', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 25 },
  { name: 'antd', test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/, priority: 20 },
  { name: 'icons', test: /node_modules[\\/]@hugeicons[\\/]/, priority: 20 },
  { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
  { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      // Keep each group to its own packages; otherwise shared deps (clsx, react-is) get dragged into lazy-only chunks.
      output: { codeSplitting: { includeDependenciesRecursively: false, groups: vendorGroups } },
    },
  },
})
