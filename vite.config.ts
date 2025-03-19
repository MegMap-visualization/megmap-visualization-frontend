import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { VueAmapResolver } from '@vuemap/unplugin-resolver'
import Unocss from 'unocss/vite'
import {
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces/'),
      '@components': path.resolve(__dirname, 'src/components/'),
      '@composables': path.resolve(__dirname, 'src/composables/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@config': path.resolve(__dirname, 'src/config/'),
      '@styles': path.resolve(__dirname, 'src/styles/'),
      '@views': path.resolve(__dirname, 'src/views/'),
      '@assets': path.resolve(__dirname, 'src/assets/'),
      '@store': path.resolve(__dirname, 'src/store/'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/element/index.scss" as *;`,
      },
    },
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', '@vueuse/core'],
      resolvers: [
        ElementPlusResolver({
          exclude: /^ElAmap[A-Z]*/,
        }),
        VueAmapResolver(),
      ],
      dts: 'src/auto-imports.d.ts',
    }),

    Components({
      dirs: ['src/components', 'src/views'],
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
          exclude: /^ElAmap[A-Z]*/,
        }),
        VueAmapResolver(),
      ],
      dts: 'src/components.d.ts',
    }),

    // https://github.com/antfu/unocss
    // see unocss.config.ts for config
    Unocss({
      presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
          scale: 1.2,
          warn: true,
        }),
      ],
      transformers: [transformerDirectives(), transformerVariantGroup()],
    }),
  ],
})
