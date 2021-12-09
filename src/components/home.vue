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
        <el-dropdown @command="logout"
          ><el-button type="info" icon="el-icon-switch-button" size="small">
            个人<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>还没做</el-dropdown-item>
            <el-dropdown-item @click="logout"
              >退出<i class="el-icon-switch-button"></i
            ></el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 页面主体区域(侧边栏) -->
      <el-aside :width="isCollapse ? '65px' : '200px'">
        <el-scrollbar style="width: 100%">
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
      <el-container>
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
  </el-container>
</template>

<script>
import welcome from '../components/welcome.vue'
export default {
  data() {
    return {
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
      activePath: '',
      // 被激活的连接地址
      activePath_: '',
      activeTab: '1', 
      //默认显示的tab
      tabIndex: 1, 
      //tab目前显示数
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
      // 左侧菜单数据
      
    }
  },
    computed: {
      activeNav() { //当前激活的导航
        return this.$route.path
      }
    },
  created() {
    /* 一打开页面就获取左侧菜单的激活状态 */
    this.getMenuList()
    this.activePath = window.sessionStorage.getItem('activePath')
    console.log(this.$route)
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
      this.isCollapse = !this.isCollapse  //被我用开关代替了
    },
    // 保存链接的激活状态
    saveNavState(activePath) {
      window.sessionStorage.setItem('activePath', activePath)
      this.activePath = activePath
    },removeTab(targetName) { //删除Tab
            let tabs = this.tabsItem; //当前显示的tab数组
            let activeName = this.activeTab; //点前活跃的tab

            //如果当前tab正活跃 被删除时执行
            if (activeName === targetName) {
            tabs.forEach((tab, index) => {
                if (tab.name === targetName) {
                let nextTab = tabs[index + 1] || tabs[index - 1];
                if (nextTab) {
                    activeName = nextTab.name;
                    this.tabClick(nextTab)
                }
                }
            });
            }
            this.activeTab = activeName;
            this.tabsItem = tabs.filter(tab => tab.name !== targetName);
            //在tabsPath中删除当前被删除tab的path
            this.tabsPath = this.tabsPath.filter(item => item.name !== targetName)
        },
        tabClick(thisTab) {
            /*
            * thisTab:当前选中的tabs的实例
            * 通过当前选中tabs的实例获得当前实例的path 重新定位路由
            * */
            let val = this.tabsPath.filter(item => thisTab.name == item.name)
            this.$router.push({
            path: val[0].path
            })
        }
    },
    watch: {
      '$route': function (to) {  //监听路由的变化，动态生成tabs
        let flag = true //判断是否需要新增页面
        const path = to.path
        console.log(path)
        console.log(to)
        if (Object.keys(to.meta).length != 0) {
          for (let i = 0; i < this.$refs.tabs.length; i++) {
            if (i != 0) { //首页不判断 如果页面已存在，则直接定位当页面，否则新增tab页面
              if (this.$refs.tabs[i].label == to.meta.name) {
                this.activeTab = this.$refs.tabs[i].name  //定位到已打开页面
                flag = false
                break
              }
            }
          }
          //新增页面
          if (flag) {
            //获得路由元数据的name和组件名
            const thisName = to.meta.name
            const thisComp = to.meta.comp
            //对tabs的当前激活下标和tabs数量进行自加
            let newActiveIndex = ++this.tabIndex + ''
            //动态双向追加tabs
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
            if (this.tabsPath.indexOf(path) == -1) {
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
  height: 100%;
  background-color: rgb(236, 242, 246);
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
.el-icon-s-help {
  margin-top: -23px;
  margin-left: 40%;
  color: #aaa;
}
.el-aside {
  background-color: #545c64;
  border-right-style: solid;
  border-color: rgb(67, 74, 80);
  margin: 20px 0px 20px 20px; //上右下左
  border-radius: 10px;
  //background-image: linear-gradient(to right, #015294 , #000000);
  // 菜单右边框对不齐
  .el-menu {
    border-right: none;
    font-weight: bold;
  }
  height: 520px;
}
.el-main {
  background-color: rgb(236, 242, 246);
}
.el-footer {
  display: flex;
  height: 10px;
  align-items: center;
  text-align: center;
  //background-color: #828b94;
  background-color: rgb(236, 242, 246);
}
.toggle-button {
  padding-top: 7px;
  background-color: #545c64;
  font-size: 20px;
  line-height: 30px;
  color: #fff;
  text-align: center;
  //letter-spacing: 0.2em; /* 字体间距 */
  cursor: pointer; /* 鼠标放上去变成手 */
}
.el-main {
  background-color: rgb(236, 242, 246);
}
.el-tabs {
  margin-top: -10px;
}

// 修改nav背景色
/deep/.el-tabs__nav-scroll {
  background-color: #fff;
  padding-left: 10px;
  border-radius: 5px;
}
</style>
