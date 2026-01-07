import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'pwa-192x192.png', 'pwa-512x512.png', 'masked-icon.svg', 'offline.html'],
        manifest: {
          id: '/login',
          name: 'ArcadeX',
          short_name: 'ArcadeX',
          description: 'Gaming Center Management Application',
          start_url: '/login',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#6366f1',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/admin/, /^\/static/, /^\/robots\.txt$/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Image caching - CacheFirst for faster loads
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Font caching - CacheFirst for stable assets
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Google Fonts stylesheets - StaleWhileRevalidate
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
                }
              }
            },
            // Google Fonts webfonts - CacheFirst
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
      },
    },
  server: {
      port: 8080,
      host: true,
      allowedHosts: [
        '.localhost',
        '.localtest.me',
        '.lvh.me',
        'localhost',
        'localtest.me',
        'lvh.me',
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:9000',
          changeOrigin: false,
          secure: false,
        },
      },
    },
    build: {
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              if (id.includes('@headlessui') || id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('@dnd-kit')) {
                return 'dnd-vendor';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'charts-vendor';
              }
              if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx')) {
                return 'utils-vendor';
              }
            }
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
    },
    preview: {
      allowedHosts: [
        'localhost',
        '.ngrok.io',
        '.ngrok-free.app',
        '.ngrok-free.dev',
        'all',
      ],
    },
  }
})
