import Vue from 'vue'
import App from './App.vue'
import router from './router/router'
import './plugins/element.js' //导入的element插件
//导入全局样式表，自己新建于assets
import './assets/css/global.css'
//导入树状表插件
import TreeTable from 'vue-table-with-tree-grid'

import axios from 'axios'
axios.defaults.baseURL = 'http://101.43.37.78:8888/api/private/v1/'
axios.interceptors.request.use(config =>{
  //console.log(config)
  config.headers.Authorization = window.sessionStorage.getItem('token')
  return config  //固定写法，最后必须return config
})
Vue.prototype.$http = axios

Vue.config.productionTip = false
//注册树状表插件
Vue.component('tree-table', TreeTable)
//定义全局时间过滤器
Vue.filter('dateFormat', function(originVal){
  const dt = new Date(originVal)
  //年月日
  const y = dt.getFullYear()
  const m = (dt.getMonth() + 1 +'').padStart(2,'0')
  const d = (dt.getDate() + '').padStart(2,'0')
  //时分秒
  const hh = (dt.getHours() + '').padStart(2,'0')
  const mm = (dt.getMinutes() + '').padStart(2,'0')
  const ss = (dt.getSeconds() + '').padStart(2,'0')
  //return (y+'-'+m+'-'+d+hh+':'+mm+':'+ss)
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
})



new Vue({
  router,
  render: h => h(App)
}).$mount('#app') //原有代码，不动
