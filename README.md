# easvue_web
实现功能统计：
一、branch login：
1、基本设置：router.js:默认地址路由到/login页面，login.vue作为组件渲染到/login页面；【app.vue中的路由占位符】；main.js:element的组件的引入（element.js中组件需用才引）,导入axios并将其挂载到vue的原型函数上（可以通过this访问并发起请求），并把baseURL设置为其根路径；
2、初始值设置：通过export default使用element ui中的：model与v-model为账户密码设置初始值
3、输入值验证：通过element组件：rules和prop实现输入内容blur时的错误提示；使用validate回调函数实现提交前数据的预验证。
4、提交与重置：利用ref选择和element ui中的form method组件resetFields实现重置。
5、登陆验证与路由导航守卫：将接口获得的token存于session，在访问login以外的界面都需验证token，否则拦截跳转回login，可以在后面使用退出按钮清除token数据
6、组件美化：通过element中的prefix-icon组件美化input，message弹出提示
7、页面美化：main.js中import.css文件实现全局的样式，less scope对本页面进行的的圆角、阴影、padding、border、absolute position、flex display实现定位

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

