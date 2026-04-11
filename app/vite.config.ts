import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Needed for Solana web3.js and Anchor
      include: ['buffer', 'process', 'stream', 'util', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  define: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'process.env': {},
  },
})
