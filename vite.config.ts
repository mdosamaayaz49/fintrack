import { defineConfig, type Plugin } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { readFileSync, writeFileSync } from "fs";

/**
 * Injects Firebase config env vars into public/firebase-messaging-sw.js
 * after the Vite build copies it to dist/.
 * This lets the SW use the same VITE_FIREBASE_* values without bundling.
 */
function firebaseMessagingSWPlugin(): Plugin {
  let resolvedEnv: Record<string, string> = {};
  return {
    name: "firebase-messaging-sw",
    configResolved(config) {
      resolvedEnv = loadEnv(config.mode, config.root, "VITE_");
    },
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/firebase-messaging-sw.js");
      try {
        let content = readFileSync(swPath, "utf-8");
        const replacements: Record<string, string> = {
          "self.__FIREBASE_API_KEY__": JSON.stringify(resolvedEnv.VITE_FIREBASE_API_KEY ?? ""),
          "self.__FIREBASE_AUTH_DOMAIN__": JSON.stringify(resolvedEnv.VITE_FIREBASE_AUTH_DOMAIN ?? ""),
          "self.__FIREBASE_PROJECT_ID__": JSON.stringify(resolvedEnv.VITE_FIREBASE_PROJECT_ID ?? ""),
          "self.__FIREBASE_STORAGE_BUCKET__": JSON.stringify(resolvedEnv.VITE_FIREBASE_STORAGE_BUCKET ?? ""),
          "self.__FIREBASE_MESSAGING_SENDER_ID__": JSON.stringify(resolvedEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ""),
          "self.__FIREBASE_APP_ID__": JSON.stringify(resolvedEnv.VITE_FIREBASE_APP_ID ?? ""),
        };
        for (const [token, value] of Object.entries(replacements)) {
          content = content.replaceAll(token, value);
        }
        writeFileSync(swPath, content);
      } catch {
        // dist/ doesn't exist in watch/serve mode — safe to ignore
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    firebaseMessagingSWPlugin(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "FinTrack — Expense & Budget Tracker",
        short_name: "FinTrack",
        description:
          "A simple and intuitive expense and budget tracking application built with React, TypeScript, Tailwind CSS, and Vite. Works offline",
        theme_color: "#0f6e56",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["finance", "productivity", "utilities"],
        lang: "en-US",
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "firestore-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
              backgroundSync: {
                name: "fintrack-firestore-sync",
                options: {
                  maxRetentionTime: 24 * 60, // retry for up to 24 hours (minutes)
                },
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/\/api\//],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('firebase/messaging')) return 'vendor-firebase-messaging'
          if (id.includes('firebase/auth')) return 'vendor-firebase-auth'
          if (id.includes('firebase/firestore')) return 'vendor-firebase-firestore'
          if (id.includes('firebase')) return 'vendor-firebase-app'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('d3/')) return 'vendor-recharts'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) return 'vendor-forms'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('date-fns')) return 'vendor-datefns'
          if (id.includes('/idb/')) return 'vendor-idb'
        },
      },
    },
  },
});