<template>
  <div>
    <!-- 面包屑导航区域 这个组件的样式其他组件也用的到 所以写到公共样式里 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <!-- 点击回到welcome 因为重定向 -->
      <el-breadcrumb-item>求助人员管理</el-breadcrumb-item>
      <el-breadcrumb-item>用户列表</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图区域 -->
    <el-card>
      <!-- layout栅格组件 row行 col列 span是宽度（共24） gutter是间隙（合适即可） -->
      <el-row :gutter="80">
        <el-col :span="11">
          <!-- 搜索与添加区域 -->
          <el-input placeholder="请输入内容">
            <el-button slot="append" icon="el-icon-search"></el-button>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="addDialogVisible = true"
            >添加用户</el-button
          >
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>
      </el-row>
      <!-- 用户列表区域 -->
      <el-table :data="userlist" border stripe>
        <!-- 跟menu一样 把要展示的数据存储到table自带的属性data里面 下面再用prop取对应的数据 和v-model双向绑定 -->

        <el-table-column label="#" type="index"></el-table-column>
        <!-- column索引列 只要加上type="index" -->
        <el-table-column label="姓名" prop="username"></el-table-column>
        <el-table-column label="邮箱" prop="email"></el-table-column>
        <el-table-column label="电话" prop="mobile"></el-table-column>
        <el-table-column label="角色" prop="role_name"></el-table-column>
        <el-table-column label="状态" prop="role_name"><!--作用域插槽覆盖prop-->
          <!--2.6将slot slot-cope弃用，完整的插槽需要template-->
          <!--作用域插槽 v-slot="scope" scope.row从userlist里获取的本行所有数据-->
          <template v-slot="scope">
            <el-switch
              style="display: block"
              v-model="scope.row.mg_state"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-text="true"
              inactive-text="false"
              @change="userStateChanged(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200px">
          <template v-slot="scope"> <!-- 作用域插槽 -->
            <!-- 修改按钮 -->
            <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.id)"></el-button> <!-- 把对应的id传过去发起相应的数据请求 -->
            <!-- 删除按钮 -->
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeUserById(scope.row.id)"></el-button>
            <!-- 分配角色按钮 -->
            <el-tooltip effect="dark" content="设置身份" placement="top" :enterable="false"> <!-- 鼠标提示文字 enterable鼠标不可以进入到提示文字 即自动隐藏 -->
              <el-button type="warning" icon="el-icon-setting" size="mini" @click="setRole(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页区域 -->
      <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="queryInfo.pagenum"
      :page-sizes="[1, 2, 4, 5]"
      :page-size="queryInfo.pagesize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total">
    </el-pagination>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 获取用户列表的参数对象 原数据是一整条 根据页数和条数返回相应的数据 如每页显示3条 第2页 就会把第4 5 6个数据返回 拿到后就把这3个渲染出来 total控制着页码组件的数据显示
      queryInfo: {
        // 搜索关键字 和搜索框的value进行了双向绑定
        query: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 4
      },
      userlist: [] /* 返回的数据存储到这里 */,
      total: 0 /*总数据条数*/
    }
  },
  created() {
    this.getUserList()
  },
  methods: {
    async getUserList() {
      /*await即可获得数据对象，并将其解构赋值出data属性重命名为res*/
      const { data: res } = await this.$http.get('users', {
        params: this
          .queryInfo /* 将参数放到data里面 因为下面还要根据选择的条数等重新请求 参数会变 */
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取用户列表失败！')
      }
      this.userlist = res.data.users
      this.total = res.data.total
      console.log(res)
    },
    // 监听 下拉页码 改变的事件 newsize为选择的条数 选择了几条就把这个作为参数传给数据请求中重新请求
    handleSizeChange(newSize) {
      // console.log(newSize)
      this.queryInfo.pagesize = newSize
      this.getUserList()
    },
    // 监听 页码值 改变的事件 newPage为选择的页码值 选择了第几页就把这个页码作为参数传给数据请求中重新请求
    handleCurrentChange(newPage) {
      console.log(newPage)
      this.queryInfo.pagenum = newPage
      this.getUserList()
    },
    // 监听 switch 开关状态的改变 调用put请求把原数据更改 这样每次刷新页面时就能保存这个状态 相当于把这个状态存储起来了（原数据存储的方式）
    async userStateChanged(userinfo) {
      console.log(userinfo)
      const { data: res } = await this.$http.put(
        'users/'+userinfo.id+'/state/'+userinfo.mg_state
      )
      if (res.meta.status !== 200) { /* 原数据修改失败 页面的状态重置回去（保持跟原数据一样 刷新也行） */
        userinfo.mg_state = !userinfo.mg_state
        return this.$message.error('修改用户状态失败！')
      }
      this.$message.success('修改用户状态成功！')
    }
  }
}
</script>

<style lang="less" scoped></style>
