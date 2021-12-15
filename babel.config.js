// 这是项目发布阶段才需要用到的 babel 插件
const prodPlugins = []
// ui界面点build查看--mode
if (process.env.NODE_ENV === 'production') {
  prodPlugins.push('transform-remove-console')
}



module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    [
      'component',
      {
        libraryName: 'element-ui',
        styleLibraryName: 'theme-chalk'
      }
    ],
     // 发布产品时候的插件数组 展开数组的每一项放到这个数组里
     ...prodPlugins,
     // 路由懒加载插件：
    '@babel/plugin-syntax-dynamic-import'
  ]
}
