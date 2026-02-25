import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    // port: 8080,
  },
  // resolve: {
  //   alias: {
  //     '@omnipad/core': resolve(__dirname, '../packages/core/src/index.ts'),
  //     '@omnipad/vue': resolve(__dirname, '../packages/vue/src/index.ts')
  //   }
  // }
});
