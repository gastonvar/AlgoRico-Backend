import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    isolate: true,
    restoreMocks: true,
    globals: true,
    setupFiles: ['./tests/setup-env.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
});
