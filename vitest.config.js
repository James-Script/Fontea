import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste
    environment: 'jsdom',
    
    // Arquivos de teste
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/utils/logger.js',
        '**/*.test.js',
        '**/__tests__/**'
      ]
    },

    // Configuração de timeout
    testTimeout: 10000,

    // Hooks de ciclo de vida
    setupFiles: [],

    // Reporters
    reporters: ['verbose'],

    // Include e exclude patterns
    include: ['**/*.test.js'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Mock reset
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
