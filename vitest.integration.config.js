import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/integration/**/*.spec.js'],
    // In-memory DB is a process-wide singleton — avoid parallel workers.
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
      reportsDirectory: './coverage-integration',
    },
  },
});
