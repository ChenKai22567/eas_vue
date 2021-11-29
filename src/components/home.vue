<template>
  <!-- 头部区域 -->
  <el-container class="home-container"
    ><!--检查element发现session没有占满屏幕，设置类可调格式-->
    <el-header height="55px"
      ><!-- 这个element标签就是类名 可以直接拿这个设置样式 -->
      <div>
        <img src="../assets/logo.png" alt="最右侧图标" />
        <span>救助信息后台管理系统</span>
      </div>
      <el-button type="info" @click="logout" icon="el-icon-switch-button">
        退出</el-button>
    </el-header>
    <el-container>
      <!-- 页面主体区域(侧边栏) -->
      <el-aside :width="isCollapse ? '65px' : '200px'">
        <div class="toggle-button" @click="toggleCollapse">
          <el-switch
            v-model="isCollapse"
            active-color="#828b94"
            inactive-color="#828b94"
          > <!-- active-text=""inactive-text=""-->
          </el-switch>
          
        </div>
        <el-menu
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          :unique-opened="true"
          :collapse="isCollapse"
          :collapse-transition="false"
          :router="true"
          :default-active="activePath"
          ><!--active-text-color="#7BCEEB" 或者简写直接router即可-->
          <!--接受布尔值需要属性绑定-->
          <!-- 一级菜单 -->
          <el-submenu
            v-bind:index="item.id + ''"
            v-for="item in menulist"
            :key="item.id"
          >
            <!-- 一级菜单的模板区域 -->
            <template slot="title">
              <!-- 图标 -->
              <i :class="iconsObj[item.id]"></i>
              <!-- 文本 -->
              <span>{{ item.authName }}</span>
              <!--胡须语法的动态绑定-->
            </template>
            <!-- 二级菜单 -->
            <el-menu-item
              :index="'/' + subItem.path"
              v-for="subItem in item.children"
              :key="subItem.id"
               @click="saveNavState('/' + subItem.path)"
            >
              <!-- 图标 -->
              <i class="el-icon-menu"></i>
              <!-- 文本 -->
              <span>{{ subItem.authName }}</span>
            </el-menu-item>
          </el-submenu>
        </el-menu> </el-aside
      ><!-- 侧边栏 -->
      <!-- 右侧内容主体 -->
      <el-container>
        <el-main>
        <!-- 路由占位符 welcome users等子组件,哪里有路由放在哪里 -->
        <router-view></router-view>
        </el-main>
        <el-footer height="40px">
           <el-divider content-position="center"><i class="el-icon-s-help">救助信息后台管理系统</i></el-divider>
        </el-footer>
      </el-container>
    </el-container>
  </el-container>
</template>

<script>
export default {
  data() {
    return {
      // 左侧菜单数据
      menulist: [],
      iconsObj: {
        '125': 'el-icon-s-custom',
        '103': 'el-icon-s-cooperation',
        '101': 'el-icon-s-platform',
        '102': 'el-icon-s-claim',
        '145': 'el-icon-s-marketing'
      },
      // 是否折叠
      isCollapse: false,
      // 被激活的链接地址
      activePath: ''
    }
  },
  created() {
    /* 一打开页面就获取左侧菜单的激活状态 */
    this.getMenuList()
    this.activePath = window.sessionStorage.getItem('activePath')
  },
  methods: {
    logout() {
      window.sessionStorage.clear() /* 清空token */
      this.$router.push('/login')
    } /* 重定向到登录页 要用replace push还是能点返回回到这个home页 */,
    async getMenuList() {
      const { data: res } = await this.$http.get('menus')
      // 获取失败：
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      // 获取成功：存放到data里面
      this.menulist = res.data
      console.log(res)
    }, // 点击按钮，切换菜单的折叠与展开 同时aside的宽度变小 即切换menu的collapse属性 用isCollapse存储数据实现切换
    toggleCollapse() {
      //this.isCollapse = !this.isCollapse  //被我用开关代替了
    },
    // 保存链接的激活状态
    saveNavState(activePath) {
      window.sessionStorage.setItem('activePath', activePath)
      this.activePath = activePath
    }
  }
}
</script>

<style lang="less" scoped>
.home-container {
  height: 100%;
}
.el-header {
  background-color: rgb(2, 17, 41);
  display: flex;
  justify-content: space-between;
  padding-left: 0;
  align-items: center; /*使内部组件 el-button上下居中 */
  color: #fff;
  font-size: 25px;


  > div {
    display: flex;
    align-items: center;
    span {
      margin-left: 15px;
      font-weight: bold;
    }
  }
}
.el-aside {
  background-color: #545c64;
  border-right-style: solid;
  border-color:rgb(67,74,80);
  //background-image: linear-gradient(to right, #015294 , #000000);
  // 菜单右边框对不齐
  .el-menu {
    border-right: none;
    font-weight: bold;
  }
}
.el-main {
  background-color: rgb(236,242,246);
}
.el-footer {
  background-color: #828b94;
}
.toggle-button {
  background-color: rgb(67,74,80);
  font-size: 10px;
  line-height: 30px;
  color: #fff;
  text-align: center;
  //letter-spacing: 0.2em; /* 字体间距 */
  cursor: pointer; /* 鼠标放上去变成手 */
}

</style>
