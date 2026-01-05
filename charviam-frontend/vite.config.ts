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
      port: 3000,
      host: true, // Allow external connections (needed for subdomain testing)
      // Allow all hosts for subdomain testing (development only)
      // This allows any subdomain of localhost, localtest.me, lvh.me, etc.
      // In production, this should be restricted to specific domains
      allowedHosts: [
        '.localhost',
        '.localtest.me',
        '.lvh.me',
        'localhost',
        'localtest.me',
        'lvh.me',
      ], // Development only - allows all hosts for subdomain testing
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:9000',
          // Preserve original Host header for subdomain resolution
          // The backend extracts subdomain from Host header (e.g., "goldenarcade" from "goldenarcade.localhost:3000")
          changeOrigin: false,
          secure: false,
        },
      },
    },
    // Build optimizations for performance
    build: {
      // Use esbuild for fast minification
      minify: 'esbuild',
      // Disable source maps for smaller production bundles
      sourcemap: false,
      // Chunk size warning limit
      chunkSizeWarningLimit: 500,
      // CSS code splitting for better caching
      cssCodeSplit: true,
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Rollup options for optimal chunking
      rollupOptions: {
        output: {
          // Function-based manual chunks for better caching strategy
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // UI libraries
              if (id.includes('@headlessui') || id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              // Drag and drop library - separate chunk for lazy loading
              if (id.includes('@dnd-kit')) {
                return 'dnd-vendor';
              }
              // Charts library - separate chunk for lazy loading
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'charts-vendor';
              }
              // Utility libraries
              if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx')) {
                return 'utils-vendor';
              }
            }
          },
          // Optimize asset file naming for caching
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
    // Preview server configuration (for ngrok/HTTPS testing)
    preview: {
      allowedHosts: [
        'localhost',
        '.ngrok.io',
        '.ngrok-free.app',
        '.ngrok-free.dev',
        'all',  // Allow all hosts for testing
      ],
    },
  }
})

