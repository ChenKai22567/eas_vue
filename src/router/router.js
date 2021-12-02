import Vue from 'vue'
import VueRouter from 'vue-router'
import login from '../components/login.vue' //导入路由
import home from '../components/home.vue' 
import welcome from '../components/welcome.vue' 
import users from '../components/users/users.vue' 
import rights from '../components/power/rights.vue'
import roles from '../components/power/roles.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: login },
  { path: '/home', component: home, 
    redirect: '/welcome',
    children: [
    { path: '/welcome', component: welcome },
    { path: '/users', component: users },
    { path: '/rights', component: rights },
    { path: '/roles', component: roles }
  ]
 }
]
// 原有定义路由代码，勿动
const router = new VueRouter({
  routes
})

// 挂载路由导航守卫
router.beforeEach((to, from, next) => {
  // to 将要访问的路径
  // from 代表从哪个路径跳转而来
  // next 是一个函数，表示放行
  //     next()  放行    next('/login')  强制跳转的路径
  if (to.path === '/login') return next()
  // 其他页面则要有token才能放行 之后的网络请求中要拿这个token放入请求头中
  const tokenStr = window.sessionStorage.getItem('token')  //获取token，如果实际使用需要比对等等安全措施
  if (!tokenStr){return next('/login')}  /* 可以不使用else */
  next()
})

export default router
