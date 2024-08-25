import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createManager } from '@vue-youtube/core';
import vue3GoogleLogin from 'vue3-google-login'
import './style.css'



const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.use(createManager())
app.use(vue3GoogleLogin, {
  clientId: '314080941126-4t3fosnf64q4jcqe3lltftq1melsguq8.apps.googleusercontent.com'
})
app.mount('#app')