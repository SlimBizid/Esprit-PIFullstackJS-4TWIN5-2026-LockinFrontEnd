import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    //devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcovonly'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        'scripts/**',
        'src/main.tsx',
        'src/firebase.ts',
        'src/reportWebVitals.ts',
        'src/routeTree.gen.ts',
        'src/routes/**',
        'src/hooks/**',
        'src/integrations/**',
        'src/components/Devtools.tsx',
        'src/components/BenefitsSection.tsx',
        'src/components/Footer.tsx',
        'src/components/Header.tsx',
        'src/components/HeroSection.tsx',
        'src/components/Navbar.tsx',
        'src/components/StoryTelling.tsx',
        'src/components/TeamChat.tsx',
        'src/components/achievement-timeline.tsx',
        'src/components/achievement-type-card.tsx',
        'src/components/challenge-reviews-panel.tsx',
        'src/components/keyboard-shortcuts-dialog.tsx',
        'src/components/thats-not-my-coder-challenge.tsx',
        'src/components/userprofileachievements.tsx',
        'src/components/accessibility/**',
        'src/components/cosmetics/cosmetic-form-dialog.tsx',
        'src/components/cosmetics/query-constants.ts',
        'src/components/cosmetics/shop-card.tsx',
        'src/components/cosmetics/shop-filters.tsx',
        'src/components/cosmetics/shop-hero.tsx',
      ],
    },
  },
})
