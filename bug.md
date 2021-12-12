1、var定义规则需要放在data开头，原因不明【解决】
2、padding更改右侧左侧反而变化
3、switch开关下方显示不全：删除组件自带属性style="display: block" 【解决】
4、三个图标原本间距不一致，过几天变好了 【怀疑是分配大小不足，但不知道为什么没改动就一致了】
5、_ob_错误：data中return需要有数据，否则删掉。【解决】
6、$confirm取消时报错：使用catch捕获error信息即可   【不是问题】
7、弹出框显示和隐藏时页面长度抽搐*：box-sizing: border-box; 【解决】
8、v-for循环（v，k，index）其中index定义了不用也会报错
9、home页侧边栏有滚动条：el-scrollbar（文档中没有：隐藏组件）   【解决】
10、el-aside的margin颜色丢失：直接对html设置颜色  【解决】
11、el-backtop无法显示：弃用
12、删除角色权限后展开栏会收起：不使用函数重新渲染，直接给数据赋值  【解决】
13、js基础语法问题：obj[]在属性不确定的时候使用，属性确定时才可用obj.   【解决】
14、el-tree组件中勾选项不断累加：每次关闭对话框为勾选数组赋空值     【解决】
15、*getHalfCheckedKeys获取的数据无法使用：①先用展开运算符将方法获得的数组展开 ②再用join(',')将数组拼接起来         【解决】
16、element ui中dropdown组件small外观有问题   【弃用】
17、表格fixed right后下右显示不全：①上：重新设置height覆盖内联样式 ②右：把每一列宽度写死
18、element ui的表格展开stripe属性混乱——换用npm上插件vue-tree-with-grid结果相同还更丑 【无法解决】
19.级联选择器横向滚动条去除：overflow-x: hidden !important;必须加在全局样式中 【解决】
20. formatter 无效 【待解决】
21.data中return的数据未定义，检查其他数据是否有错 【可以用到Bcompare】
22.关闭对话框级联选择器数据保留：注意额外定义的数据清空。  【解决】
23.level数据无法更改格式：formatter不能用于表单