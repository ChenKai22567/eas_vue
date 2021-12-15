import Vue from 'vue'
import VueRouter from 'vue-router'
//import login from '../components/login.vue' //导入路由
//import home from '../components/home.vue' 
//import welcome from '../components/welcome.vue' 

// 路由懒加载：分组名称一样则会打包到同一个js文件，其中一个组件加载了其他的也会加载
const login = () => import(/* webpackChunkName: "login_home_welcome" */ '../components/login.vue')
const home = () => import(/* webpackChunkName: "login_home_welcome" */ '../components/home.vue')
const welcome = () => import(/* webpackChunkName: "login_home_welcome" */ '../components/welcome.vue')

//import users from '../components/users/users.vue' 
//import rights from '../components/power/rights.vue'
//import roles from '../components/power/roles.vue'

const users = () => import(/* webpackChunkName: "Users_Rights_Roles" */ '../components/users/users.vue')
const rights = () => import(/* webpackChunkName: "Users_Rights_Roles" */ '../components/power/rights.vue')
const roles = () => import(/* webpackChunkName: "Users_Rights_Roles" */ '../components/power/roles.vue')

//import cate from '../components/infos/cate.vue'
//import params from '../components/infos/params.vue'

const cate = () => import(/* webpackChunkName: "Cate_Params" */ '../components/infos/cate.vue')
const params = () => import(/* webpackChunkName: "Cate_Params" */ '../components/infos/params.vue')

//import infolist from '../components/infos/infos_list.vue'
//import add from '../components/infos/add.vue'

const infolist = () => import(/* webpackChunkName: "infoList_Add" */ '../components/infos/infos_list.vue')
const add = () => import(/* webpackChunkName: "infoList_Add" */ '../components/infos/add.vue')

//import process from '../components/process/process.vue'
//import report from '../components/report/report.vue'

const process = () => import(/* webpackChunkName: "Process_Report" */ '../components/process/process.vue')
const report = () => import(/* webpackChunkName: "Process_Report" */ '../components/report/report.vue')




Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: login },
  { path: '/home', component: home, 
    redirect: '/welcome',
    children: [
    { path: '/welcome', component: welcome}, 
    { path: '/users', component: users, meta:{ keepAlive: true, comp: users, name: '用户列表'} },
    { path: '/rights', component: rights, meta:{ keepAlive: true, comp: rights, name: '使用权限列表'} },
    { path: '/roles', component: roles, meta:{ keepAlive: true, comp: roles, name: '救助角色列表'} },
    { path: '/categories', component: cate, meta:{ keepAlive: true, comp: cate, name: '救助信息分类'} },
    { path: '/params', component: params, meta:{ keepAlive: true, comp: params, name: '分类参数设置'} },
    { path: '/infos', component: infolist, meta:{ keepAlive: true, comp: infolist, name: '救助信息列表'} },
    { path: '/infos/add', component: add, meta:{ keepAlive: true, comp: add, name: '添加救助信息'} },
    { path: '/process', component: process, meta:{ keepAlive: true, comp: process, name: '救助执行情况'} },
    { path: '/reports', component: report, meta:{ keepAlive: true, comp: report, name: '救助信息统计'} }
  ]
 }
]
// 原有定义路由代码，勿动
const router = new VueRouter({
  routes
})
export default router

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


