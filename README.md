# easvue_web
实现功能统计：
一、branch login：
1、基本设置：router.js:默认地址路由到/login页面，login.vue作为组件渲染到/login页面；【app.vue中的路由占位符】；main.js:element的组件的引入（element.js中组件需用才引）,导入axios并将其挂载到vue的原型函数上（可以通过this访问并发起请求），并把baseURL设置为接口的根路径；
2、输入初始值设置：通过export default使用element ui中的：model与v-model为账户密码设置初始值
3、输入值验证：通过element组件：rules和prop实现输入内容blur时的错误提示；使用element ui中validate回调函数实现提交前数据的预验证。
4、提交与重置：利用ref选择和element ui中的form method组件resetFields实现重置。
5、登陆验证与路由导航守卫：将接口获得的token存于session。使用beforeEach为router挂载路由导航守卫：在访问login以外的界面都需验证token，否则拦截跳转回login。可以在后面使用退出按钮清除token数据
6、组件美化：通过element中的prefix-icon组件美化input，message弹出提示
7、页面美化：main.js中import.css文件实现全局的样式，less scope对本页面进行的的圆角、阴影、padding、border、absolute position、flex display实现定位

二、/home：
1、axios请求拦截器：interceptors为axios的config请求头挂载Authorization保证权限允许数据请求
2、通过接口请求侧边栏内容：插槽胡须语法将菜单文本动态绑定为接口获取的数据（bug点：index需要字符串类型，接口返回int类型 解决：在返回数据后+'',强行转换为字符串格式），图标根据id属性从自己设置的数组中动态绑定
优点：①避免造轮子 ②便于根据权限显示内容
3、菜单的折叠与展开：将组件的展开属性绑定为自定义变量isCollapse，并将自定义变量绑定到switch开关上即可。
4、子菜单的点击路由：开启router属性，并在生成的子菜单的index中动态绑定相应的路径，如'/users'等
5、菜单的显示优化：
（1）每次仅能展开一个子菜单：:collapse-transition="false"
（2）点击高亮的保持：监听点击菜单动作并在session中保存当前激活的菜单，将其动态绑定到组件中的default-active属性上。
（3）保证菜单展开和折叠的流畅(解读组件源码并改造)：在module中找到element ui在其中packages文件中，对el-menu进行改造，去除其过渡动画。
（4）菜单右框对不齐：border：none
6、路由占位符
7、页面布局和美化：网页占满屏幕的调试（利用f12检查发现是container未占满，为其设置属性），基于element ui的NavMenu 导航菜单组件将页面划分为四部分，对组件各类大小的微调（从element ui 中attribute查看）

三、/users
1、对用户状态进行操作：
2、查找用户与清空：clear
3、对话框：
    （1）显示与隐藏：
    （2）预验证：（自定义规则）
    （3）取消清空表单及预验证：
4、多选与批量删除：
2、breadcrumb导航：点击首页路由回首页
3、卡片视图:
4、layout栅格布局：
5、分页区域：element-pagination组件

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

