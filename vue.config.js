module.exports = {
  chainWebpack: config => {
    // 发布模式
    config.when(process.env.NODE_ENV === 'production', config => {
      config
        .entry('app') /* 得到默认的打包入口文件 */
        .clear()/* 清除默认入口文件 */
        .add('./src/main-prod.js')/* 新增自己的 */

      // 解决单个js文件过大问题：external
      config.set('externals', {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        axios: 'axios',
        lodash: '_',
        echarts: 'echarts',
        nprogress: 'NProgress',
        'vue-quill-editor': 'VueQuillEditor'
      })

      // 首页定制：【找到html插件并修改其中参数】
      config.plugin('html').tap(args => {
        args[0].isProd = true /* 追加一个属性 */
        return args
      })
    })

    // 开发模式
    config.when(process.env.NODE_ENV === 'development', config => {
      config
        .entry('app')
        .clear()
        .add('./src/main-dev.js')

      config.plugin('html').tap(args => {
        args[0].isProd = false
        return args
      })
    })
  }
}
