import Vue from 'vue'
import App from './App.vue'
import router from './router/router'
import './plugins/element.js' //导入的element插件
//导入全局样式表，自己新建于assets
import './assets/css/global.css'

import axios from 'axios'
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/private/v1/'
Vue.prototype.$http = axios

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app') //原有代码，不动
