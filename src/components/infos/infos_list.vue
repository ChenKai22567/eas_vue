<template>
  <div>
    <!-- 卡片视图区域 -->
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
              <el-button
                type="primary"
                @click="goAddpage"
                icon="el-icon-plus"
                plain
                >添加救助信息</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                type="danger"
                @click="removeInfoAll()"
                icon="el-icon-close"
                plain
                >批量删除信息</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                type="warning"
                @click="clearFilter"
                icon="el-icon-finished"
                plain
                >清除所有过滤</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                icon="el-icon-refresh"
                @click="getInfoList()"
                type="info"
                plain
                >刷新当前页面
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
        <el-card>
          <!-- layout栅格组件 row行 col列 span是宽度（共24） gutter是间隙（合适即可） -->
          <el-row :gutter="130">
            <el-col :span="12">
              <!-- 搜索与添加区域 -->
              <el-input
                placeholder="可以按救助信息标题搜索"
                v-model="queryInfo.query"
                clearable
                @clear="getInfoList"
              >
                <el-button
                  slot="append"
                  icon="el-icon-search"
                  @click="getInfoList"
                ></el-button>
              </el-input>
            </el-col>
          </el-row>
          <!-- 用户列表区域 -->
          <el-table
            v-loading="loading"
            element-loading-text="正在向服务器请求数据"
            :data="infolist"
            border
            stripe
            :row-style="{ height: '20px' }"
            :cell-style="{ padding: '7px' }"
            row-key="good_id"
            @selection-change="handleSelectionChange"
            ref="stateRef"
            height="320px"
          >
            <!-- 跟menu一样 把要展示的数据存储到table自带的属性data里面 下面再用prop取对应的数据 和v-model双向绑定 -->
            <el-table-column
              type="selection"
              width="55"
              :reserve-selection="true"
              fixed
            >
            </el-table-column>
            <el-table-column
              label="#"
              type="index"
              width="50"
            ></el-table-column>
            <!-- column索引列 只要加上type="index" -->
            <el-table-column
              label="标题信息"
              prop="goods_name"
              width="200"
            ></el-table-column>
            <el-table-column label="优先等级" prop="goods_number"
              sortable width="160">
              <template v-slot="line">
              <el-rate v-model="line.row.goods_number" 
              disabled :colors="colors" > 
                </el-rate>
                </template>
                </el-table-column>
            <el-table-column
              label="关注人数"
              prop="goods_price"
              sortable
              width="120"
            ></el-table-column>
            <el-table-column
              label="救助状态"
              prop="goods_state"
              width="135"
              :filters="[
                { text: '救助完成', value: '0' },
                { text: '正在救助', value: '1' },
                { text: '等待救助', value: '2' }
              ]"
              :filter-method="filterTag"
              filter-placement="bottom-end"
            >
              <template v-slot="state">
                <!--v-if和else判断-->
                <el-tag type="success" v-if="state.row.goods_state === 0"
                  >救助完成</el-tag
                >
                <!-- 这个标签要根据数据自定义 所以要放到作用域插槽里 -->
                <el-tag type="warning" v-else-if="state.row.goods_state === 1"
                  >正在救助</el-tag
                >
                <el-tag type="danger" v-else>等待救助</el-tag>
              </template></el-table-column
            >
            <el-table-column sortable label="发布时间" prop="add_time" width="180">
              <template v-slot="time">
                {{ time.row.add_time | dateFormat }}
                <!-- 全局时间过滤器 将时间以年月日的形式展示（原为毫秒）-->
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template v-slot="info">
                <el-button
                  type="primary"
                  icon="el-icon-edit"
                  size="mini"
                  plain
                  @click="showEditDialog(info.row.goods_id)"
                  >编辑</el-button
                >
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  size="mini"
                  plain
                  @click="removeInfoById(info.row.goods_id)"
                  >删除</el-button
                >
            <!--
            <el-tooltip
              effect="dark"
              content="修改分类"
              placement="top"
              :enterable="false"
            >
             
              <el-button
                type="warning"
                icon="el-icon-setting"
                size="mini"
                @click="setCate(line.row)"
                plain
              ></el-button>
            </el-tooltip>  -->
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页区域 -->
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="queryInfo.pagenum"
            :page-sizes="[1, 4, 6, 10]"
            :page-size="queryInfo.pagesize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            background
          >
          </el-pagination>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改用户的对话框 -->
    <el-dialog
      title="修改用户信息"
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
        <el-form-item label="信息编号：">
          <el-input v-model="editForm.goods_id" disabled></el-input>
          <!--对话框禁用的属性-->
        </el-form-item>
        <el-form-item label="救助标题：" prop="email">
          <el-input v-model="editForm.goods_name"></el-input>
        </el-form-item>
        <el-form-item label="优先等级：" prop="email">
          <el-rate v-model="editForm.goods_number" 
          class="level" :colors="colors"> 
                </el-rate>
        </el-form-item>
        <el-form-item label="救助状态：" prop="email">
          <el-radio-group v-model="editForm.goods_state">
            <el-radio :label="0">已完成</el-radio>
            <el-radio :label="1">进行中</el-radio>
            <el-radio :label="2">未完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关注人数：" prop="email">
          <el-input v-model="editForm.goods_price" disabled></el-input>
        </el-form-item>
        <el-form-item label="信息内容：" prop="mobile">
          <el-input
            v-model="editForm.goods_introduce"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请在此处输入信息详情"
          ></el-input>
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
      colors: ['#99A9BF', '#F7BA2A', '#FF9900'], // 等同于 { 2: '#99A9BF', 4: { value: '#F7BA2A', excluded: true }, 5: '#FF9900' }
      //多选数量
      multipleSelection: [],
      // 查询参数对象
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 6
      },
      infolist: [] /* 返回的数据存储到这里 */,
      total: 0 /*总数据条数*/,
      // 控制编辑救助信息对话框的显示
      editDialogVisible: false,
      // 查询到的救助信息对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        title: [
          { required: true, message: '请输入救助信息标题', trigger: 'blur' }
        ],
        state: [{ required: true, message: '请选择救助状态', trigger: 'blur' }]
      },
       // 控制分配角色对话框的显示与隐藏
      setCateDialogVisible: false,
      // 需要被分配角色的用户信息
      infoInfo: {},
      // 所有角色的数据列表
      rolesList: [],
      // 已选中的角色Id值
      selectedRoleId: '',
      //加载动画
      loading: true
    }
  },
  created() {
    this.getInfoList()
  },
  methods: {
    // 根据分页获取对应的商品列表
    async getInfoList() {
      //控制加载动画
      this.loading = true
      const { data: res } = await this.$http.get('goods', {
        params: this.queryInfo
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取救助信息列表失败！')
      }
      this.$message.success('获取救助信息列表成功！')
      console.log(res.data)
      this.infolist = res.data.goods
      this.total = res.data.total
      this.loading = false
    },
    // 监听 下拉页码 改变的事件 newsize为选择的条数 选择了几条就把这个作为参数传给数据请求中重新请求
    handleSizeChange(newSize) {
      // console.log(newSize)
      this.queryInfo.pagesize = newSize
      this.getInfoList()
    },
    // 监听 页码值 改变的事件 newPage为选择的页码值 选择了第几页就把这个页码作为参数传给数据请求中重新请求
    handleCurrentChange(newPage) {
      console.log(newPage)
      this.queryInfo.pagenum = newPage
      this.getInfoList()
    },
    // 点击添加,跳转到新页面
    goAddpage() {
      this.$router.push('/infos/add')
    },
    // 展示编辑用户的对话框
    async showEditDialog(id) {
      const { data: res } = await this.$http.get('goods/' + id)
      //解构赋值语法勿忘
      if (res.meta.status !== 200) {
        return this.$message.error('查询救助信息条目失败！')
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
        console.log(this.editForm)
        // 发起修改用户信息的数据请求
        const { data: res } = await this.$http.put('goods/' + this.editForm.goods_id,
          {
            goods_name: this.editForm.goods_name,
            goods_price: this.editForm.goods_price,
            goods_number: this.editForm.goods_number,
            goods_weight: this.editForm.goods_weight,
            goods_introduce: this.editForm.goods_introduce,
            goods_cat: this.editForm.goods_cat,
            goods_state: this.editForm.goods_state,
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改救助信息失败！')
        }
        // 关闭对话框
        this.editDialogVisible = false
        // 刷新数据列表
        this.getInfoList()
        // 提示修改成功
        this.$message.success('修改救助信息成功！')
      })
    },
    // 根据Id删除对应的救助信息
    async removeInfoById(id) {
      // 弹框询问用户是否删除数据（参见element）
      const confirmResult = await this.$confirm(
        /* 先给vue挂载了$confirm函数 里面的参数代表弹框显示的内容样式 函数的返回值是promise 所以可以用asyc和await来优化 这样返回的值即confirmResult就是一个字符串了（之前的是一个数据）如果确定就是confirm 取消就是cancle 由catch捕获 */
        '  将永久删除该救助信息，请选择是否确认？',
        '删除救助信息条目',
        {
          //因为$confirm返回promise所有可以使用await优化
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          //center: true  //文字居中
        }
      ).catch(
        err => err
      ) /* 点取消则由catch捕获异常 return err的简写 把err返回 */
      // 此时如果用户确认删除，则返回值为字符串 confirm
      // 如果用户取消了删除，则返回值为字符串 cancel
      // console.log(confirmResult)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除该救助信息数据')
      }
      // 确认删除 先发送请求 判断删除是否成功 不用传id参数
      const { data: res } = await this.$http.delete('goods/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除救助信息操作失败！')
      }
      this.$message.success('删除救助信息操作成功！')
      this.getInfoList()
    },
    //操作多选
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    async removeInfoAll(id) {
      // 弹框询问用户是否删除数据（参见element）
      const confirmResult = await this.$confirm(
        /* 先给vue挂载了$confirm函数 里面的参数代表弹框显示的内容样式 函数的返回值是promise 所以可以用asyc和await来优化 这样返回的值即confirmResult就是一个字符串了（之前的是一个数据）如果确定就是confirm 取消就是cancle 由catch捕获 */
        '  此操作将永久删除所有选中救助信息，是否确认？',
        '批量删除操作',
        {
          //因为$confirm返回promise所有可以使用await优化
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          //center: true  //文字居中
        }
      ).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消批量删除操作')
      }
      const length = this.multipleSelection.length
      for (let i = 0; i < length; i++) {
        const { data: res } = await this.$http.delete(
          'goods/' + this.multipleSelection[i].goods_id
        )
        if (res.meta.status !== 200) {
          return this.$message.error('批量删除救助信息操作失败！')
        }
      }
      this.$message.success('批量删除救助信息操作成功！')
      this.getInfoList()
    },

    //清除过滤器
    clearFilter() {
      this.$refs.stateRef.clearFilter()
    },
    //过滤器的判断（筛选函数）（value为选中值）
    filterTag(value, row) {
      return row.goods_state == value
    },
    //过滤器的输出
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    // 展示分配角色的对话框
    async setRole(userInfo) {
      this.userInfo = userInfo

      // 在展示对话框之前，先获取所有的角色列表并存储起来
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        return this.$message.error('获取分类列表失败！')
      }
      this.catesList = res.data
      this.setCateDialogVisible = true
    },    
      // 点击确定，分配角色
    async saveCateInfo() {
      // 如果还没选择新的角色
      if (!this.selectedRoleId) {
        return this.$message.error('请选择要分配的角色！')
      }
      const { data: res } = await this.$http.put(
        'users/'+this.userInfo.id+'/role',
        {rid: this.selectedRoleId}
      )
      if (res.meta.status !== 200) {
        return this.$message.error('分配用户角色失败！')
      }
      this.$message.success('分配用户角色成功！')
      this.getInfoList()
      this.setCateDialogVisible = false
    },
    // 监听关闭分配角色的对话框，清空选项
    setRoleDialogClosed() {
      this.selectedRoleId = ''
      this.infoInfo = {}
    }
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
.el-pagination {
  padding: 15px 0px 0px 0px;
}
.el-table {
  box-sizing: border-box;
}
.el-table > .el-table__fixed-right {
  height: 100% !important; //设置高优先，以覆盖内联样式
}
body {
  margin: 0;
}
.el-row {
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
}
.card_left {
  height: 465px;
}
/deep/.el-table__column-filter-trigger .el-icon-arrow-down {
  &:before {
    content: '筛选∨';
    font-size: 16px;
    margin-left: 10px;
  }
}
.level{
  transform: translate(0%,50%);
}
.el-form-item{
    margin-bottom: 7px;
}
</style>
