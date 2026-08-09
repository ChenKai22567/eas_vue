<template>
  <!-- 头部区域 -->
  <el-container class="home-container"
    ><!--检查element发现session没有占满屏幕，设置类可调格式-->
    <el-header height="55px"
      ><!-- 这个element标签就是类名 可以直接拿这个设置样式 -->
      <div>
        <!--<img src="../assets/logo.png" alt="最右侧图标" />-->
        <span>救助信息后台管理系统</span>
      </div>
      <div>
        <!--<el-avatar :size="43"> admin </el-avatar>-->
        <el-dropdown @command="handleAccountCommand"
          ><el-button type="info" icon="el-icon-switch-button" size="small">
            个人<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile">个人资料</el-dropdown-item>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" divided
              >退出<i class="el-icon-switch-button"></i
            ></el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="home-body" :class="{ 'mobile-layout': isMobile, 'compact-layout': isCompact }">
      <!-- 页面主体区域(侧边栏) -->
      <el-aside :width="asideWidth">
        <el-scrollbar class="nav-scrollbar">
          <div class="toggle-button" @click="toggleCollapse">
            <i class="el-icon-s-fold"
            v-if="!isCollapse"
            ></i>
            <i class="el-icon-s-unfold"
            v-if="isCollapse"
            ></i>

              <!-- active-text=""inactive-text=""-->

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
              :index="item.id + ''"
              v-for="item in menulist"
              :key="item.id"
            >
              <!-- 一级菜单的模板区域 -->
              <template slot="title">
                <!-- 图标 -->
                <i :class="iconsObj[item.id]"></i>
                <!--注意此处的[],在属性不确定的时候使用-->
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
          </el-menu>
        </el-scrollbar>
      </el-aside>
      <!-- 侧边栏 -->
      <!-- 右侧内容主体 -->
      <el-container class="content-shell">
        <el-main>
          <!-- tab标签页区域 - 用于标签页切换 -->
          <el-tabs
            tabPosition="top"
            @tab-remove="removeTab"
            @tab-click="tabClick"
            v-model="activeTab"
          >
            <el-tab-pane
              v-for="item in tabsItem"
              :key="item.name"
              :label="item.title"
              :name="item.name"
              :closable="item.closable"
              :ref="item.ref"
            >
            </el-tab-pane>
          </el-tabs>
           <transition name="fade" mode="out-in">
         <keep-alive>
             <router-view v-if="$route.meta.keepAlive"></router-view>
         </keep-alive>
     </transition>
     <router-view v-if="!$route.meta.keepAlive"></router-view>

          <!-- 路由占位符 welcome users等子组件,哪里有路由放在哪里 -->
        </el-main>
        <el-footer height="15px">
          <i class="el-icon-s-help">救助信息后台管理系统</i>
        </el-footer>
      </el-container>
    </el-container>

    <el-dialog title="个人资料" :visible.sync="profileVisible" width="420px">
      <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="profileForm.role_name" disabled></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email"></el-input>
        </el-form-item>
        <el-form-item label="电话" prop="mobile">
          <el-input v-model="profileForm.mobile"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="profileVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveProfile">保 存</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="修改密码"
      :visible.sync="passwordVisible"
      width="420px"
      :show-close="!passwordForm.force"
      :close-on-click-modal="!passwordForm.force"
      :close-on-press-escape="!passwordForm.force"
    >
      <el-alert v-if="passwordForm.force" title="首次登录必须先修改初始密码" type="warning" show-icon :closable="false"></el-alert>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" class="password-form">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" autocomplete="current-password"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" autocomplete="new-password"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button v-if="!passwordForm.force" @click="passwordVisible = false">取 消</el-button>
        <el-button type="primary" @click="savePassword">确认修改</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>
import welcome from '../components/welcome.vue'
export default {
  data () {
    return {
      menulist: [],
      iconsObj: {
        125: 'el-icon-s-custom',
        103: 'el-icon-s-cooperation',
        101: 'el-icon-s-platform',
        102: 'el-icon-s-claim',
        145: 'el-icon-s-marketing'
      },
      // 是否折叠
      isCollapse: false,
      // 被激活的链接地址
      activePath: '',
      // 被激活的连接地址
      activePath_: '',
      activeTab: '1',
      // 默认显示的tab
      tabIndex: 1,
      // tab目前显示数
      tabsItem: [
        {
          title: '首页',
          name: '1',
          closable: false,
          ref: 'tabs',
          content: welcome
        }
      ],
      tabsPath: [
        {
          name: '1',
          path: '/welcome'
        }
      ],
      profileVisible: false,
      profileForm: {
        username: '',
        role_name: '',
        email: '',
        mobile: ''
      },
      profileRules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        mobile: [{ required: true, message: '请输入电话', trigger: 'blur' }]
      },
      passwordVisible: false,
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        force: false
      },
      passwordRules: {
        currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 12, max: 128, message: '密码长度为 12 到 128 位', trigger: 'blur' }
        ],
        confirmPassword: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }]
      },
      viewportWidth: window.innerWidth
      // 左侧菜单数据

    }
  },
  computed: {
    isMobile () {
      return this.viewportWidth <= 700
    },
    isCompact () {
      return this.viewportWidth <= 1180
    },
    asideWidth () {
      if (this.isMobile) return '100%'
      return this.isCollapse ? '64px' : 'clamp(160px, 15vw, 200px)'
    },
    activeNav () { // 当前激活的导航
      return this.$route.path
    }
  },
  created () {
    /* 一打开页面就获取左侧菜单的激活状态 */
    this.getMenuList()
    this.activePath = window.sessionStorage.getItem('activePath')
    if (window.sessionStorage.getItem('forcePasswordChange') === '1') {
      this.passwordForm.force = true
      this.passwordVisible = true
    }
  },
  mounted () {
    this.handleViewportChange()
    window.addEventListener('resize', this.handleViewportChange, { passive: true })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleViewportChange)
  },
  methods: {
    handleViewportChange () {
      this.viewportWidth = window.innerWidth
      if (this.isMobile) this.isCollapse = false
    },
    logout () {
      window.sessionStorage.clear() /* 清空token */
      this.$router.push('/login')
    } /* 重定向到登录页 要用replace push还是能点返回回到这个home页 */,
    handleAccountCommand (command) {
      if (command === 'logout') return this.logout()
      if (command === 'profile') return this.openProfile()
      if (command === 'password') {
        this.passwordForm.force = false
        this.passwordVisible = true
      }
    },
    async openProfile () {
      const { data: res } = await this.$http.get('me')
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      this.profileForm = res.data
      this.profileVisible = true
    },
    saveProfile () {
      this.$refs.profileFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.put('me', {
          email: this.profileForm.email,
          mobile: this.profileForm.mobile
        })
        if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
        this.profileForm = res.data
        this.profileVisible = false
        this.$message.success('个人资料已保存')
      })
    },
    savePassword () {
      this.$refs.passwordFormRef.validate(async valid => {
        if (!valid) return
        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
          return this.$message.error('两次输入的新密码不一致')
        }
        const { data: res } = await this.$http.put('me/password', {
          currentPassword: this.passwordForm.currentPassword,
          newPassword: this.passwordForm.newPassword
        })
        if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
        this.$message.success(res.meta.msg)
        this.logout()
      })
    },
    async getMenuList () {
      const { data: res } = await this.$http.get('menus')
      // 获取失败：
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      // 获取成功：存放到data里面
      this.menulist = res.data
    }, // 点击按钮，切换菜单的折叠与展开 同时aside的宽度变小 即切换menu的collapse属性 用isCollapse存储数据实现切换
    toggleCollapse () {
      this.isCollapse = !this.isCollapse // 被我用开关代替了
    },
    // 保存链接的激活状态
    saveNavState (activePath) {
      window.sessionStorage.setItem('activePath', activePath)
      this.activePath = activePath
    },
    removeTab (targetName) { // 删除Tab
      const tabs = this.tabsItem // 当前显示的tab数组
      let activeName = this.activeTab // 点前活跃的tab

      // 如果当前tab正活跃 被删除时执行
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.name === targetName) {
            const nextTab = tabs[index + 1] || tabs[index - 1]
            if (nextTab) {
              activeName = nextTab.name
              this.tabClick(nextTab)
            }
          }
        })
      }
      this.activeTab = activeName
      this.tabsItem = tabs.filter(tab => tab.name !== targetName)
      // 在tabsPath中删除当前被删除tab的path
      this.tabsPath = this.tabsPath.filter(item => item.name !== targetName)
    },
    tabClick (thisTab) {
      /*
            * thisTab:当前选中的tabs的实例
            * 通过当前选中tabs的实例获得当前实例的path 重新定位路由
            * */
      const val = this.tabsPath.filter(item => thisTab.name === item.name)
      this.$router.push({
        path: val[0].path
      })
    }
  },
  watch: {
    $route: function (to) { // 监听路由的变化，动态生成tabs
      let flag = true // 判断是否需要新增页面
      const path = to.path
      if (Object.keys(to.meta).length !== 0) {
        for (let i = 0; i < this.$refs.tabs.length; i++) {
          if (i !== 0) { // 首页不判断 如果页面已存在，则直接定位当页面，否则新增tab页面
            if (this.$refs.tabs[i].label === to.meta.name) {
              this.activeTab = this.$refs.tabs[i].name // 定位到已打开页面
              flag = false
              break
            }
          }
        }
        // 新增页面
        if (flag) {
          // 获得路由元数据的name和组件名
          const thisName = to.meta.name
          const thisComp = to.meta.comp
          // 对tabs的当前激活下标和tabs数量进行自加
          const newActiveIndex = ++this.tabIndex + ''
          // 动态双向追加tabs
          this.tabsItem.push({
            title: thisName,
            name: String(newActiveIndex),
            closable: true,
            ref: 'tabs',
            content: thisComp
          })
          this.activeTab = newActiveIndex
          /*
            * 当添加tabs的时候，把当前tabs的name作为key，path作为value存入tabsPath数组中
            * key:tabs的name
            * value:tabs的path
            * {
            *   key: name,
            *   value: path
            * }
            * ///后面需要得到当前tabs的时候可以通过当前tabs的name获得path
            * */
          if (this.tabsPath.indexOf(path) === -1) {
            this.tabsPath.push({
              name: newActiveIndex,
              path: path
            })
          }
        }
      }
    }

  }

}
</script>

<style lang="less" scoped>
.home-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background-color: rgb(236, 242, 246);
}
.el-header {
  flex: 0 0 55px;
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
.home-body {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.content-shell {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.el-icon-s-help {
  margin-left: auto;
  margin-right: auto;
  color: #aaa;
}
.el-aside {
  flex: 0 0 auto;
  align-self: stretch;
  background-color: #545c64;
  border: 0;
  margin: 20px 0 15px 20px; //上右下左
  border-radius: 10px;
  overflow: hidden;
  //background-image: linear-gradient(to right, #015294 , #000000);
  // 菜单右边框对不齐
  .el-menu {
    border-right: none;
    font-weight: bold;
  }
  min-height: 0;
  height: auto;
  transition: width 180ms ease, margin 180ms ease;
}
.nav-scrollbar {
  width: 100%;
  height: 100%;
}
/deep/.nav-scrollbar .el-scrollbar__wrap {
  width: 100%;
  height: 100%;
  margin: 0 !important;
  overflow-x: hidden;
  scrollbar-width: none;
}
/deep/.nav-scrollbar .el-scrollbar__wrap::-webkit-scrollbar,
/deep/.nav-scrollbar > .el-scrollbar__bar {
  display: none;
}
/deep/.nav-scrollbar .el-scrollbar__view {
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow-x: hidden;
}
/deep/.nav-scrollbar .el-menu {
  width: 100%;
  min-height: calc(100% - 40px);
}
/deep/.nav-scrollbar .el-submenu__title {
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 32px !important;
  padding-left: 14px !important;
}
/deep/.nav-scrollbar .el-submenu__title > i:first-child {
  flex: 0 0 18px;
  margin-right: 6px;
}
/deep/.nav-scrollbar .el-submenu__title > span {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/deep/.nav-scrollbar .el-submenu__icon-arrow {
  right: 10px;
  width: 12px;
  margin-top: -6px;
  text-align: center;
}
/deep/.nav-scrollbar .el-menu--collapse > .el-submenu > .el-submenu__title,
/deep/.nav-scrollbar .el-menu--collapse > .el-menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  padding: 0 !important;
}
/deep/.nav-scrollbar .el-menu--collapse > .el-submenu > .el-submenu__title > i:first-child,
/deep/.nav-scrollbar .el-menu--collapse > .el-menu-item > i:first-child {
  flex: 0 0 24px;
  width: 24px;
  margin: 0 !important;
  text-align: center;
}
/deep/.nav-scrollbar .el-menu--collapse > .el-submenu > .el-submenu__title > span,
/deep/.nav-scrollbar .el-menu--collapse > .el-submenu > .el-submenu__title > .el-submenu__icon-arrow {
  display: none;
}
.el-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  background-color: rgb(236, 242, 246);
}
.el-footer {
  flex: 0 0 30px;
  display: flex;
  height: 30px !important;
  margin-bottom: 15px;
  align-items: center;
  justify-content: center;
  text-align: center;
  //background-color: #828b94;
  background-color: rgb(236, 242, 246);
}
.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  margin: 0;
  padding: 0;
  padding-top: 0;
  background-color: #545c64;
  font-size: 20px;
  line-height: 1;
  color: #fff;
  text-align: center;
  //letter-spacing: 0.2em; /* 字体间距 */
  cursor: pointer; /* 鼠标放上去变成手 */
}
.toggle-button i {
  display: block;
  width: 1em;
  margin: 0;
  line-height: 1;
  text-align: center;
}
.el-tabs {
  margin-top: -10px;
}
.password-form {
  margin-top: 18px;
}

// 修改nav背景色
/deep/.el-tabs__nav-scroll {
  background-color: #fff;
  padding-left: 10px;
  border-radius: 5px;
}

.compact-layout {
  .el-aside {
    margin-left: 12px;
  }
  .el-main {
    padding: 14px;
  }
}

.mobile-layout {
  flex-direction: column;

  .el-aside {
    flex: 0 0 48px;
    width: calc(100% - 20px) !important;
    min-height: 48px;
    height: 48px;
    margin: 8px 10px 0;
    overflow: hidden;
  }

  .toggle-button {
    display: none;
  }

  /deep/.nav-scrollbar .el-scrollbar__wrap {
    height: 48px;
    margin: 0 !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
  }

  /deep/.nav-scrollbar .el-scrollbar__view,
  /deep/.nav-scrollbar .el-menu {
    display: flex;
    width: max-content;
    min-width: 100%;
    min-height: 48px;
    height: 48px;
  }

  /deep/.el-submenu {
    flex: 0 0 auto;
  }

  /deep/.el-submenu__title {
    height: 48px;
    padding: 0 16px !important;
    line-height: 48px;
  }

  .content-shell {
    flex: 1 1 auto;
    min-height: 0;
  }

  /deep/.el-main {
    padding: 10px;
    overflow-x: hidden;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .el-header {
    height: auto !important;
    min-height: 55px;
    padding: 8px 10px;
    gap: 8px;

    > div:first-child {
      min-width: 0;
    }

    > div span {
      margin-left: 0;
      overflow: hidden;
      font-size: clamp(16px, 4.8vw, 21px);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .el-footer {
    display: none;
  }
}
</style>
