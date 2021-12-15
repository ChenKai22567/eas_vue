<template>
    <div>
<el-row :gutter="15">
      <el-col :span="5">
    <el-card align="middle" class="card_left">
      <el-row>
        <el-col :span="16">
        批量操作区域:
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button type="primary" 
           @click="addDialogVisible = true" 
          icon="el-icon-plus"
          plain
            >添加新用户</el-button
          >
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button icon="el-icon-refresh"
          @click="getRolesList()" type="info"
          plain>刷新本页面
          </el-button>
          <!-- 点击这个按钮 刷新 -->
        </el-col>
      </el-row>
      <el-row>
        <el-empty description="此处为可视化"></el-empty>
      </el-row>
    </el-card>
      </el-col>
        <el-col :span="19">

    <!-- 卡片视图 -->
    <el-card>
      <!-- 汉字 -->
      <el-row>
        <el-col>
          数据展示区域：
        </el-col>
      </el-row>

      <!-- 角色列表区域 -->
      <el-table 
      v-loading="loading"
      element-loading-text="正在向服务器请求数据"
      :data="rolelist" border stripe 
      height="383px"
        :row-style="{ height: '23px' }"
        :cell-style="{ padding: '7px' }"
        row-key="id">

        <!-- 展开列 -->
        <el-table-column type="expand" label="展开" width="50px">
          <template v-slot="tree">
            <!-- layout 栅格 渲染一级权限 5+19总共24列 -->
            <!--v-for循环需要绑定key值-->
            <el-row :class="['bdbottom', index1 === 0 ? 'bdtop' : '', 'verticalCenter']" v-for="(item1, index1) in tree.row.children" :key="item1.id"> <!-- 按需选择类名 给每一行加上下边框 -->
              <el-col :span="5">
                <el-tag closable @close="removeRightById(tree.row, item1.id)">{{item1.authName}}</el-tag>
                <i class="el-icon-caret-right"></i>   <!--closable是关闭符号，右侧小箭头起美观作用-->
              </el-col>
              <el-col :span="19">

                <!-- 渲染二级权限 6+18总共24列 -->
                <el-row :class="[index2 === 0 ? '' : 'bdtop', 'verticalCenter']" v-for="(item2, index2) in item1.children" :key="item2.id">
                  <el-col :span="6">
                    <el-tag type="success" closable @close="removeRightById(tree.row, item2.id)">{{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">

                    <!-- 渲染三级权限 -->      <!--此处index3定义不用会报错-->
                    <el-tag type="warning" v-for="(item3) in item2.children" :key="item3.id"   
                    closable @close="removeRightById(tree.row, item3.id)">{{item3.authName}}</el-tag> 
                    <!-- 这里的tree.row依然是整个数据 -->
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>

        <!-- 索引列 -->
        <el-table-column type="index" label="No."></el-table-column>
        <el-table-column label="角色名称" prop="roleName" plain></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作" width="300px">
          <template v-slot="edit">
            <el-button size="mini" type="primary" 
            icon="el-icon-edit" plain  @click="showEditDialog(edit.row.id)">编辑</el-button>
            <el-button size="mini" type="danger" 
            icon="el-icon-delete" plain @click="removeRolesById(edit.row.id)">删除</el-button>
            <el-button size="mini" type="warning" icon="el-icon-setting" 
            @click="showSetRightsDialog(edit.row)" plain>分配权限</el-button>
        </template>
        </el-table-column>
      </el-table>
    </el-card>
        </el-col>
    </el-row>

    <!-- 分配权限的对话框 -->
    <el-dialog title="为当前角色分配权限" :visible.sync="setRightsDialogVisible" 
    width="40%" @close="setRightsDialogClosed" center>

      <!-- 树形组件 -->
      <el-tree :data="rightslist" :props="treeProps" show-checkbox node-key="id" default-expand-all 
      :default-checked-keys="defKeys" ref="treeAllotRef"></el-tree> 
        <!--show-checkbox展示复选框，node-key绑定选定的值-->
        <!--一般需要取用用户输入的数据时，均需要用ref-->
      <span slot="footer" class="dialog-footer">
        <el-button @click="setRightsDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="allotRights">确 定</el-button>
      </span>
    </el-dialog>

                <!-- 添加角色的对话框-->
    <el-dialog
      title="创建新角色"
      :visible.sync="addDialogVisible"
      width="30%"
      @close="addDialogClosed"
    >
      <!-- 内容主体区域 -->
      <el-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        label-width="100px"
        class="addForm"
      >
        <!--注意绑定命名要留ref-->
        <el-form-item label="角色名称：" prop="roleName">
          <el-input v-model="addForm.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色描述：" prop="roleDesc">
          <el-input v-model="addForm.roleDesc"
          type="textarea" :autosize="{ minRows: 2, maxRows: 4}"
          placeholder="请在此处输入角色描述"
          ></el-input>
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addUser">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改角色的对话框 -->
    <el-dialog
      title="修改角色信息"
      :visible.sync="editDialogVisible"
      width="40%"
      @close="editDialogClosed"
    >
      <el-form
        :model="editForm"
        :rules="editFormRules"
        ref="editFormRef"
        label-width="100px"
        class="editForm"
      >
        <el-form-item label="后台编号：">
          <el-input v-model="editForm.roleId" disabled></el-input>
          <!--对话框禁用的属性-->
        </el-form-item>
        <el-form-item label="角色名称：" prop="roleName">
          <el-input v-model="editForm.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色描述：" prop="roleDesc">
          <el-input  type="textarea" :autosize="{ minRows: 1, maxRows: 4}"
          v-model="editForm.roleDesc" placeholder="请在此处输入角色描述"></el-input>
        </el-form-item>
        <!--根据接口内容绑定-->
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
    return {
       //加载动画
      loading: true,
      // 所有角色列表数据
      rolelist: [],
      // 控制分配权限对话框的显示与隐藏
      setRightsDialogVisible: false,
      // 所有权限列表的数据
      rightslist: [],
      // 树形控件的属性绑定对象
      treeProps: {
        label: 'authName',   //展示的属性
        children: 'children'  //子节点的来源（父子嵌套）
      },
      // 默认选中的节点Id值数组
      defKeys: [],
      // 当前即将分配权限的角色id
      roleId: '',
      //控制添加角色对话框
      addDialogVisible: false,
      // 添加角色信息对象
      addForm: {
        roleName: '',
        roleDesc: ''
      },
      //添加角色规则
      addFormRules: {
        roleName: [
          {required: true, message: '请输入角色名', trigger: 'blur'}
        ],
        roleDesc: [
          { required: true, message: '请输入角色描述', trigger: 'blur'}
        ]
      },// 控制修改用户对话框的显示与隐藏
      editDialogVisible: false,
      // 查询到的用户信息对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        roleName: [
          { required: true, message: '请输入修改后的角色名称', trigger: 'blur' }],
        roleDesc: [
          { required: true, message: '请输入修改后的角色描述', trigger: 'blur' }]
      },
    }
  },
  created() {
    this.getRolesList()
  },
  methods: {
    // 获取所有角色的列表
    async getRolesList() {
      this.loading = true
      const { data: res } = await this.$http.get('roles')

      if (res.meta.status !== 200) {
        return this.$message.error('获取角色列表失败！')
      }
      this.rolelist = res.data
      this.$message.success('获取角色列表成功！')
      console.log(this.rolelist)
      this.loading = false
    },    
    // 根据Id删除对应的权限，详情参见users中的注释
    async removeRightById(role, rightId) {
      // 弹框提示用户是否要删除
      const confirmResult = await this.$confirm(
        '此操作将删除该角色的此权限, 是否继续?','删除权限',
        {
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
        }).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('删除角色权限操作已取消！')
      }
      const { data: res } = await this.$http.delete(
        'roles/'+role.id+'/rights/'+rightId
      )
      if (res.meta.status !== 200) {
        return this.$message.error('删除角色权限失败！')
      }
      this.$message.success('删除角色权限成功！')
      role.children = res.data    //使用服务器返回的data，而不是getrolelist防止重新渲染收起展开栏
    },
    // 展示分配权限的对话框
    async showSetRightsDialog(role) {
      // 保存对应的id 供后面的allotRights方法使用
      this.roleId = role.id
      // 展示前先获取所有权限的数据
      const { data: res } = await this.$http.get('rights/tree')
      if (res.meta.status !== 200) {
        return this.$message.error('获取权限数据列表失败！')
      }
      // 把获取到的权限数据放入对象
      this.rightslist = res.data
      //console.log(this.rightslist)
      // 获得勾选数据并传到data定义的数组中 
      this.getLeafKeys(role, this.defKeys)
      //关闭还要把数组清空 要不然下次打开会累加
      this.setRightsDialogVisible = true
    },
    // 通过递归的形式，获取角色所有权限的id，并保存到arr数组中，打开分配列表就会勾选
    getLeafKeys(node, arr) {
      // 如果当前node节点不包含children属性，则是最低级节点
      if (!node.children) {
        return arr.push(node.id)
      }
      //forEach递归调用，重要用法
      node.children.forEach(item => this.getLeafKeys(item, arr))
    },
    // 关闭分配权限的对话框
    setRightsDialogClosed() {
      this.defKeys = []
    },
    // 为角色分配权限
    async allotRights() {
      // 把所有全选和半选的id保存到数组中
      const keys = [
           ...this.$refs.treeAllotRef.getCheckedKeys(), 
           ...this.$refs.treeAllotRef.getHalfCheckedKeys()
           // getCheckedKeys均为tree组件自带的方法：获得选中node的key
           //...展开运算符 console.log(keys)
        ]   
      const idStr = keys.join(',')  //将keys转换为以逗号拼接的字符串 
      const { data: res } = await this.$http.post( 
        'roles/'+this.roleId+'/rights', { rids: idStr } )
      if (res.meta.status !== 200) {
        return this.$message.error('分配角色权限操作失败！')
      }
      this.$message.success('分配角色权限操作成功！')
      this.getRolesList() 
      this.setRightsDialogVisible = false
     },
     // 根据Id删除对应的角色信息
    async removeRolesById(id) {
      // 弹框询问用户是否删除数据（参见element）
      const confirmResult = await this.$confirm(
        '  此操作将永久删除该角色及其数据，请选择是否确认？','删除用户数据',
        {
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          //center: true  //文字居中
        }
      ).catch(err => err) 
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除该用户数据')
      }
      // 确认删除 先发送请求 判断删除是否成功 不用传id参数
      const { data: res } = await this.$http.delete('roles/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除角色操作失败！')
      }
      this.$message.success('删除角色操作成功！')
      this.getRolesList()
    },
    //关闭时清空表单
    addDialogClosed() {
      this.$refs.addFormRef.resetFields() /* resetFields是element中表单的方法,用此方法需要ref引用表单【常用】 */
    },
    // 点击确定，添加新角色 进行预校验
    addUser() {
      this.$refs.addFormRef.validate(async valid => {
        /* elementui校验通过 valid为true,否则为false */
        if (!valid) return
        // 校验通过 发起添加用户的网络请求
        const { data: res } = await this.$http.post('roles', this.addForm)
        // 请求的返回结果
        if (res.meta.status !== 201) {
          return this.$message.error('创建新角色失败！')
        }
        this.$message.success('创建新角色成功！')
        // 隐藏添加用户的对话框
        this.addDialogVisible = false
        // 重新获取用户列表数据（因为有绑定,所以自动渲染）
        this.getRolesList()
      })
    },
    // 展示编辑用户的对话框
    async showEditDialog(id) {
      const { data: res } = await this.$http.get('roles/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('查询角色信息失败！')
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
          'roles/' + this.editForm.roleId,
          {
            roleName: this.editForm.roleName,
            roleDesc: this.editForm.roleDesc
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改角色信息失败！')
        }
        // 关闭对话框
        this.editDialogVisible = false
        // 刷新数据列表
        this.getRolesList()
        // 提示修改成功
        this.$message.success('修改角色信息成功！')
      })
    }  
    }
  }
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-bottom: 1px solid #eee;
}
.verticalCenter { 
  display: flex;
  align-items: center;
}
.addForm {
  padding: 0px 20px 0px 10px; //上右下左
}
.editForm {
  padding: 0px 20px 0px 0px; //上右下左
}
.el-row {
    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
  }
.card_left{
  height: 465px;
}
</style>