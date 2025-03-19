import { createApp } from 'vue'
import { initAMapApiLoader } from '@vuemap/vue-amap'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// If you want to use ElMessage, import it.
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/notification.scss'
import 'element-plus/theme-chalk/src/message-box.scss'

// Amap
import '@vuemap/vue-amap/dist/style.css'

import App from './App.vue'
import '@styles/index.scss'
import 'uno.css'

window.forceWebGL = true // 强制所有浏览器使用WebGL渲染，不然可视化效果极差

initAMapApiLoader({
  key: '77e7a717deeb03fd301d8c83111a8ced',
})

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App).use(pinia).mount('#app')
