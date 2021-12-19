# 详细功能介绍：
项目地址：http://101.43.37.78:88

## 一、基本技术选型
1.基本设置：
```
①vue2.6.11    ①vue-cli项目搭建     ①vue-router：使用hash模式的路由#
②主要插件：element.js组件、 quill editor富文本编辑器、tree-grid树状表插件【已弃用】、lodash深拷贝、Nprogress进度条、echarts简单使用
③axios封装的Ajax异步处理  ⑤git与bcompare进行多分支版本管理  ⑥Prettier进行代码格式化设置⑦less语言页面美化  ⑧babel编译器
⑩postman接口测试
⑨external加载外部cdn资源
```

## 二、具体页面功能与实现

2./login：登录与权限验证
```
①输入初始值绑定  ②输入格式的规范提示
③发起登录请求前的规则预验证  ④axios路由导航守卫（阻止输入url进入其他页面） ⑤jwt权限验证
⑥验证码
```

3./home：页面框架与布局搭建
```
①侧面menus栏的折叠展开与高亮保存，展开数量限制，子路由绑定
②功能点：上方导航栏（监听$route实现）【新增、关闭、高亮】
③global与scoped共同的页面美化（less中deep的穿透）
```

3./users：增删查改用户信息
```
①layout布局  ②页面刷新 ③批量选中与操作
④搜索与其清空  ⑤翻页  ⑥排序 ⑦设置角色分配权限 ⑧删除的预提示
⑧按钮弹出的各种对话框
⑨相对准确表单预验证
⑧状态栏的特色渲染  ⑨固定表头与固定左右两列
⑩操作逻辑的优化：每次操作展示最新数据  表单与输入框的及时清空
⑩表格内数据请求的加载动画
```

4./roles：用户角色及权限的增删查改
```
①左侧展开列  ②展开列权限的树形美化渲染（可在其中直接删除权限）
③添加权限时树形控件的全部展示
```

5./rights：所有权限的展示
```
①筛选功能 ②固定表头
```

6./infos：救助信息的增删查改
```
①美化的数据渲染方式  ②添加页面的跳转
```

7./add:救助信息的引导添加
```
①进度条的联动进度展示  ②级联选择器
③其他模块数据的联动
⑤图片上传与缩略图
⑥富文本编辑器
```

8./params：分类参数的增删查改
```
①操作逻辑优化：不选择禁用按钮 选错清空 仅选三级
②参数展开属性名的美化渲染与动态添加删除
```

9./categories：救助信息分类的增删查改
```
①默认展开全部的树形表  ②表内属性的美化渲染
```

10./process：正在执行中的救助信息的查改
```
①特色渲染 ②编辑中级联选择器实现了全地址选择
```

11./report：
```
①echarts报表的初步学习与简单运行
```

## 三、项目优化：
```
1.优化结果对比: ①可视化打包报告
2.第三方库加载CDN  
3.路由懒加载（三个页面一组）
4.开发模式与发布模式不同的打包入口
```

## 四、项目上线：云服务器






# easvue_web
具体内容见fuction.md及bug.md

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

