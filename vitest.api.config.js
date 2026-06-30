import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/api/**/*.spec.js'],
    fileParallelism: false,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/routes/loans.js', 'src/routes/reports.js', 'src/fees.js'],
      reporter: ['text', 'text-summary', 'html', 'cobertura'],
      reportsDirectory: './coverage-api',
    },
  },
});
