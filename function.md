精简版：
项目地址：http://101.43.37.78:88

一、基本技术选型
1.基本设置：
①vue2.6.11    ①vue-cli项目搭建     ①vue-router：使用hash模式的路由#
②主要插件：element.js组件、 quill editor富文本编辑器、tree-grid树状表插件【已弃用】、lodash深拷贝、Nprogress进度条、echarts简单使用
③axios封装的Ajax异步处理  ⑤git与bcompare进行多分支版本管理  ⑥Prettier进行代码格式化设置⑦less语言页面美化  ⑧babel编译器
⑩postman接口测试
⑨external加载外部cdn资源

二、具体页面功能与实现

2./login：登录与权限验证
①输入初始值绑定  ②输入格式的规范提示
③发起登录请求前的规则预验证  ④axios路由导航守卫（阻止输入url进入其他页面） ⑤jwt权限验证
⑥验证码

3./home：页面框架与布局搭建
①侧面menus栏的折叠展开与高亮保存，展开数量限制，子路由绑定
②功能点：上方导航栏（监听$route实现）【新增、关闭、高亮】
③global与scoped共同的页面美化（less中deep的穿透）

3./users：增删查改用户信息
①layout布局  ②页面刷新 ③批量选中与操作
④搜索与其清空  ⑤翻页  ⑥排序 ⑦设置角色分配权限 ⑧删除的预提示
⑧按钮弹出的各种对话框
⑨相对准确表单预验证
⑧状态栏的特色渲染  ⑨固定表头与固定左右两列
⑩操作逻辑的优化：每次操作展示最新数据  表单与输入框的及时清空
⑩表格内数据请求的加载动画

4./roles：用户角色及权限的增删查改
①左侧展开列  ②展开列权限的树形美化渲染（可在其中直接删除权限）
③添加权限时树形控件的全部展示

5./rights：所有权限的展示
①筛选功能 ②固定表头

6./infos：救助信息的增删查改
①美化的数据渲染方式  ②添加页面的跳转

7./add:救助信息的引导添加
①进度条的联动进度展示  ②级联选择器
③其他模块数据的联动
⑤图片上传与缩略图
⑥富文本编辑器

8./params：分类参数的增删查改
①操作逻辑优化：不选择禁用按钮 选错清空 仅选三级
②参数展开属性名的美化渲染与动态添加删除

9./categories：救助信息分类的增删查改
①默认展开全部的树形表  ②表内属性的美化渲染

10./process：正在执行中的救助信息的查改
①特色渲染 ②编辑中级联选择器实现了全地址选择

11./report：
①echarts报表的初步学习与简单运行

三、项目优化：
1.优化结果对比: ①可视化打包报告
2.第三方库加载CDN  
3.路由懒加载（三个页面一组）
4.开发模式与发布模式不同的打包入口

四、项目上线：云服务器


















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