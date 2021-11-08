import Vue from 'vue'
import App from './App.vue'
import router from './router/router'
import './plugins/element.js'
 //导入全局样式表，自己新建于assets
import './assets/css/global.css'

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
