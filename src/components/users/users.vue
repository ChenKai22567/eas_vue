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
      <el-row :gutter="130">
        <el-col :span="9">
          <!-- 搜索与添加区域 -->
          <el-input
            placeholder="在这里可以按用户姓名搜索"
            v-model="queryInfo.query"
            clearable
            @clear="getUserList"
          >
            <el-button
              slot="append"
              icon="el-icon-search"
              @click="getUserList"
            ></el-button>
          </el-input>
        </el-col>
        
        <el-col :span="4">
          <el-button type="primary" @click="addDialogVisible = true"
            >添加用户</el-button>
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>

      </el-row>
      <!-- 用户列表区域 -->
      <el-table :data="userlist" border stripe >
        <!-- 跟menu一样 把要展示的数据存储到table自带的属性data里面 下面再用prop取对应的数据 和v-model双向绑定 -->

        <el-table-column label="#" type="index"></el-table-column>
        <!-- column索引列 只要加上type="index" -->
        <el-table-column label="姓名" prop="username"></el-table-column>
        <el-table-column label="邮箱" prop="email"></el-table-column>
        <el-table-column label="电话" prop="mobile"></el-table-column>
        <el-table-column label="角色" prop="role_name"></el-table-column>
        <el-table-column label="状态"  ><!--作用域插槽覆盖prop-->
          <!--2.6将slot slot-cope弃用，完整的插槽需要template-->
          <!--作用域插槽 v-slot="scope" scope.row从userlist里获取的本行所有数据-->
          <template v-slot="scope"> <!--scope只是名字-->
            <el-switch
              v-model="scope.row.mg_state"
              active-text="开"
              inactive-text="关"
              @change="userStateChanged(scope.row)"
            >
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200px">
          <template v-slot="line">
            <!-- 作用域插槽 -->
            <!-- 修改按钮 -->
            <el-button
              type="primary"
              icon="el-icon-edit"
              size="mini"
              @click="showEditDialog(line.row.id)"
              plain
            ></el-button>
            <!-- 把对应的id传过去发起相应的数据请求 -->
            <!-- 删除按钮 -->
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="mini"
              @click="removeUserById(line.row.id)"
              plain
            ></el-button>
            <!-- 分配角色按钮 -->
            <el-tooltip
              effect="dark"
              content="设置身份"
              placement="top"
              :enterable="false"
            >
              <!-- 鼠标提示文字 enterable鼠标不可以进入到提示文字 即自动隐藏 -->
              <el-button
                type="warning"
                icon="el-icon-setting"
                size="mini"
                @click="setRole(scope.row)"
                plain
              ></el-button>
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
        :total="total"
      >
      </el-pagination>
    </el-card>

    <!-- 添加用户的对话框 根据addDialogVisible显示或隐藏 -->
    <el-dialog
      title="添加新用户"
      :visible.sync="addDialogVisible"
      width="35%"
      @close="addDialogClosed">

      <!-- 内容主体区域 -->
      <el-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        label-width="70px"
        class="addForm"
      >
        <!--注意绑定命名要留ref-->
        <el-form-item label="姓名：" prop="username">
          <el-input v-model="addForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码：" prop="password">
          <el-input v-model="addForm.password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱：" prop="email">
          <el-input v-model="addForm.email"></el-input>
        </el-form-item>
        <el-form-item label="电话：" prop="mobile">
          <el-input v-model="addForm.mobile"></el-input>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addUser">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改用户的对话框 -->
    <el-dialog title="修改用户信息" :visible.sync="editDialogVisible" width="35%" @close="editDialogClosed">
      <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="70px" class="editForm">
        <el-form-item label="姓 名：">
          <el-input v-model="editForm.username" disabled></el-input>  <!--对话框禁用的属性-->
        </el-form-item>
        <el-form-item label="邮 箱：" prop="email">
          <el-input v-model="editForm.email"></el-input>
        </el-form-item>
        <el-form-item label="电 话：" prop="mobile">
          <el-input v-model="editForm.mobile"></el-input>
        </el-form-item>    <!--根据接口内容绑定-->
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editUserInfo">确 定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
export default {
  data() {
    // 验证邮箱的自定义规则（查看element）
    var checkEmail = (rule, value, callback) => {
      // 验证邮箱的正则表达式（搜索可得）
      const regEmail = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/
      if (regEmail.test(value)) {
        /* 校验通过 */
        return callback() /* 回调函数名称可变，组件定义好了 */
      }
      callback(new Error('请输入正确的邮箱')) /* 传递一个错误对象 */
    }
    // 验证手机号的自定义规则
    var checkMobile = (rule, value, callback) => {
      // 验证手机号的正则表达式
      const regMobile = /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
      if (regMobile.test(value)) {
        return callback()
      }
      callback(new Error('请输入正确的手机号'))
    }
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
      total: 0 /*总数据条数*/,
      // 控制添加用户对话框的显示与隐藏
      addDialogVisible: false,
      addForm: {
        username: '',
        password: '',
        email: '',
        mobile: ''
      },
      // 添加表单的验证规则对象 跟之前一样
      addFormRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' } /* 必填项 验证是否输入了用户名 */,
          { min: 3, max: 10, message: '用户名的长度在3~10个字符之间', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 15, message: '密码的长度在6~15个字符之间', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { validator: checkEmail, trigger: 'blur' } /* 查看element */
        ],
        mobile: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { validator: checkMobile, trigger: 'blur' }
        ]
      },

      // 控制修改用户对话框的显示与隐藏
      editDialogVisible: false,
      // 查询到的用户信息对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        email: [
          { required: true, message: '请输入用户邮箱', trigger: 'blur' },
          { validator: checkEmail, trigger: 'blur' }
        ],
        mobile: [
          { required: true, message: '请输入用户电话号码', trigger: 'blur' },
          { validator: checkMobile, trigger: 'blur' }
        ]
      }
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
        'users/' + userinfo.id + '/state/' + userinfo.mg_state
      )
      if (res.meta.status !== 200) {
        /* 原数据修改失败 页面的状态重置回去（保持跟原数据一样 刷新也行） */
        userinfo.mg_state = !userinfo.mg_state
        return this.$message.error('修改用户状态失败！')
      }
      this.$message.success('修改用户状态成功！') //$挂载在原型函数上
    },
    // 监听添加用户对话框的关闭事件 表单重置 状态保存 这样每次打开都是上次关闭的状态
    addDialogClosed() {
      this.$refs.addFormRef.resetFields() /* resetFields是element中表单的方法,用此方法需要ref引用表单【常用】 */
    },
    // 点击确定，添加新用户 进行预校验
    addUser() {
      this.$refs.addFormRef.validate(async valid => { /* elementui校验通过 valid为true,否则为false */
        if (!valid) return
        // 校验通过 发起添加用户的网络请求
        const { data: res } = await this.$http.post('users', this.addForm)
        // 请求的返回结果
        if (res.meta.status !== 201) {
          return this.$message.error('添加用户失败！')
        }
        this.$message.success('添加用户成功！')
        // 隐藏添加用户的对话框
        this.addDialogVisible = false
        // 重新获取用户列表数据（因为有绑定,所以自动渲染）
        this.getUserList()
      })
    },

    // 展示编辑用户的对话框
    async showEditDialog(id) {
      const { data: res } = await this.$http.get('users/' + id)
      //解构赋值语法勿忘
      if (res.meta.status !== 200) {
        return this.$message.error('查询用户信息失败！')
      }
      // 储存数据
      this.editForm = res.data
      // 显示对话框
      this.editDialogVisible = true
    },
    // 监听修改用户对话框,关闭时重置
    editDialogClosed() {
      this.$refs.editFormRef.resetFields()
    },
    // 点击确定进行预验证 并提交数据
    editUserInfo() {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return
        // 发起修改用户信息的数据请求
        const { data: res } = await this.$http.put(
          'users/' + this.editForm.id,
          { 
            email: this.editForm.email,
            mobile: this.editForm.mobile
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改用户信息失败！')
        }
        // 关闭对话框
        this.editDialogVisible = false
        // 刷新数据列表
        this.getUserList()
        // 提示修改成功
        this.$message.success('修改用户信息成功！')
      })
    },
       // 根据Id删除对应的用户信息
    async removeUserById(id) {
      // 弹框询问用户是否删除数据（参见element）
      const confirmResult = await this.$confirm( /* 先给vue挂载了$confirm函数 里面的参数代表弹框显示的内容样式 函数的返回值是promise 所以可以用asyc和await来优化 这样返回的值即confirmResult就是一个字符串了（之前的是一个数据）如果确定就是confirm 取消就是cancle 由catch捕获 */
        '  此操作将永久删除该用户，请选择是否确认？','删除操作',
        { //因为$confirm返回promise所有可以使用await优化
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          //center: true  //文字居中
        }
      ).catch(err => err) /* 点取消则由catch捕获异常 return err的简写 把err返回 */
      // 此时如果用户确认删除，则返回值为字符串 confirm
      // 如果用户取消了删除，则返回值为字符串 cancel
      // console.log(confirmResult)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      }
      // 确认删除 先发送请求 判断删除是否成功 不用传id参数
      const { data: res } = await this.$http.delete('users/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除用户操作失败！')
      }
      this.$message.success('删除用户操作成功！')
      this.getUserList()
    },
  }
}
</script>

<style lang="less" scoped>
.addForm {
  padding: 0px 20px 0px 0px; //上右下左
}
.editForm {
  padding: 0px 20px 0px 0px; //上右下左
}
.el-pagination{
  padding: 15px 0px 0px 0px;
}
</style>
