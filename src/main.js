import Vue from 'vue'
import App from './App.vue'
import router from './router/router'
import './plugins/element.js' //导入的element插件
//导入全局样式表，自己新建于assets
import './assets/css/global.css'
//导入树状表插件
import TreeTable from 'vue-table-with-tree-grid'
//导入富文本编辑器
import VueQuillEditor from 'vue-quill-editor'
// require styles 导入富文本编辑器对应的样式
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

// 导入 NProgress 包对应的JS和CSS
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'



import axios from 'axios'
axios.defaults.baseURL = 'http://101.43.37.78:8888/api/private/v1/'
axios.interceptors.request.use(config =>{
  //console.log(config)
  //在requst拦截器中展示进度条
  NProgress.start() 
  config.headers.Authorization = window.sessionStorage.getItem('token')
  return config  //固定写法，最后必须return config
})
// 在 response 拦截器中隐藏进度条 NProgress.done()
axios.interceptors.response.use(config => {
  NProgress.done()
  return config
})
Vue.prototype.$http = axios



//注册富文本编辑器全局可用
Vue.use(VueQuillEditor)

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
