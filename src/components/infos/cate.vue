<template>
  <div>
    <!-- 面包屑导航区域-->
    <!-- 卡片视图 -->
    <el-row :gutter="15" class="workspace-row">
      <el-col :span="5" class="action-column">
    <el-card align="middle" class="card_left">
      <el-row>
        <el-col :span="16" class="span">
        批量操作区域:
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button type="primary"
          @click="showAddCateDialog()"
          icon="el-icon-plus"
          plain
            >添加分类</el-button
          >
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button type="danger"
          @click="removeCateAll()"
          icon="el-icon-close"
          plain>批量删除</el-button>
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button icon="el-icon-refresh"
          @click="getCateList()" type="info"
          plain>刷新页面
          </el-button>
          <!-- 点击这个按钮 刷新 -->
        </el-col>
      </el-row>
      <el-row>
        <el-empty description="此处为可视化"></el-empty>
      </el-row>
    </el-card>
      </el-col>
        <el-col :span="19" class="data-column">
    <el-card>

<el-row>
        <el-col>
          数据展示区域：
        </el-col>
      </el-row>
      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        element-loading-text="正在向服务器请求数据"
        class="treeTable"
        :data="catelist"
        row-key="cat_id"
        @selection-change="handleSelectionChange"
        default-expand-all
        lazy
        border
        stripe
        :row-style="{ height: '20px' }"
        :cell-style="{ padding: '7px' }"
        :height="adaptiveTableHeight"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column
          type="selection"
          width="55"
          :reserve-selection="true"
          fixed
        ></el-table-column>
        <el-table-column type="index" label="#" width="60"></el-table-column>
        <!-- column索引列 只要加上type="index" -->
        <el-table-column label="分类名称" prop="cat_name" min-width="180"></el-table-column>
        <el-table-column label="是否有效" prop="cat_deleted" min-width="100">
          <template v-slot="state">
            <i
              class="el-icon-success"
              v-if="state.row.cat_deleted === false"
              style="color: rgb(133,206,97);"
            ></i>
            <i class="el-icon-error" v-else style="color: red;"></i>
          </template>
        </el-table-column>
        <el-table-column label="标签等级" prop="cat_level" min-width="120">
          <template v-slot="level">
            <el-tag type="warning" size="mini" v-if="level.row.cat_level === 0"
              >一级分类</el-tag
            >
            <el-tag
              type="success"
              size="mini"
              v-else-if="level.row.cat_level === 1"
              >二级分类</el-tag
            >
            <el-tag type="primary" size="mini" v-else>三级分类</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="250">
          <template v-slot="edit">
            <!-- 作用域插槽 -->
            <!-- 修改按钮 -->
            <el-button
              type="primary"
              icon="el-icon-edit"
              size="mini"
              @click="showEditDialog(edit.row.cat_id)"
              plain
              >修改分类</el-button
            >
            <!-- 把对应的id传过去发起相应的数据请求 -->
            <!-- 删除按钮 -->
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="mini"
              @click="removeCateById(edit.row.cat_id)"
              plain
              >删除分类</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <!--分页区域-->
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

    <!-- 添加分类对话框 -->
    <el-dialog
      title="添加救助信息分类"
      :visible.sync="addCateDialogVisible"
      width="35%"
      @close="addCateDialogClosed"
    >
      <!-- 表单（带验证规则的表单） -->
      <el-form
        :model="addCateForm"
        :rules="addCateFormRules"
        ref="addCateFormRef"
        label-width="100px"
      >
        <el-form-item label="分类名称：" prop="cat_name">
          <el-input v-model="addCateForm.cat_name"
          placeholder="无所属则默认顶级分类"></el-input>
        </el-form-item>
        <el-form-item label="所属分类：">
          <!-- 级联选择器 options用来指定数据源，props用来指定配置对象 -->
          <!-- 新版element的expand-trigger和change-on-select改为expandTrigger和checkStrictly且expandTrigger要写到下面  -->
          <el-cascader
            :options="parentCateList"
            :props="cascaderProps"
            v-model="selectedKeys"
            @change="parentCateChanged"
            placeholder="可搜索也可下拉选择"
            clearable
            filterable
          >
          <!--显示子节点数量-->
            <template v-slot="{ node, data }">
              <span>{{ data.cat_name }}</span>
              <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
            </template>
            <!-- @change选中项发生改变就会触发 即移动鼠标就会触发 -->
          </el-cascader>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="addCateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addCate">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改用户的对话框 -->
    <el-dialog
      title="修改分类名称"
      :visible.sync="editDialogVisible"
      width="35%"
      @close="editDialogClosed"
    >
      <el-form
        :model="editForm"
        :rules="editFormRules"
        ref="editFormRef"
        label-width="100px"
        class="editForm"
      >
        <el-form-item label="分类I D：">
          <el-input v-model="editForm.cat_id" disabled></el-input>
          <!--对话框禁用的属性-->
        </el-form-item>
        <el-form-item label="新分类名：" prop="cat_name">
          <el-input v-model="editForm.cat_name"></el-input>
        </el-form-item>
        <el-form-item label="分类序列：" prop="cat_level">
          <el-input
            v-model="editForm.cat_level"
            disabled
          ></el-input>
        </el-form-item>
        <!--根据接口内容绑定-->
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editCateInfo">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { createAdaptiveTable } from '../../mixins/adaptiveTable.js'

export default {
  mixins: [createAdaptiveTable(325, 160)],
  data () {
    return {
      // 加载动画
      loading: true,
      // 查询条件
      queryInfo: {
        type: 3,
        pagenum: 1,
        pagesize: 6
      },
      // 商品分类的数据列表，默认为空
      catelist: [],
      // 总数据条数
      total: 0,
      // 控制添加用户对话框的显示与隐藏
      addCateDialogVisible: false,
      // 添加请求使用的表单数据对象
      addCateForm: {
        // 将要添加的分类的名称，绑定输入框的内容
        cat_name: '',
        // 父级分类的Id，监听parentCateChanged事件
        cat_pid: 0,
        // 分类的等级，默认添加1级分类，监听parentCateChanged事件
        cat_level: 0
      },
      // 验证规则对象
      addCateFormRules: {
        cat_name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      },
      // 父级分类的列表
      parentCateList: [],
      // 指定级联选择器的配置对象
      cascaderProps: {
        expandTrigger: 'hover', // 新版element要写在这里
        value: 'cat_id', // 选中的属性
        label: 'cat_name', // 显示的属性
        children: 'children', // 嵌套属性的识别
        checkStrictly: 'true'
      },
      // 选中的父级分类的Id数组 要选两个 所以是数组
      selectedKeys: [],
      // 多选数量
      multipleSelection: [],
      // 控制修改用户对话框的显示与隐藏
      editDialogVisible: false,
      // 查询到的用户信息对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        cat_name: [
          { required: true, message: '请输入新分类名', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    this.getCateList()
  },
  methods: {
    // 获取救助信息分类数据
    async getCateList () {
      this.loading = true
      const { data: res } = await this.$http.get('categories', {
        params: this.queryInfo
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取救助信息分类失败！')
      }
      this.$message.success('获取救助信息分类成功！')
      // 存储数据列表
      this.catelist = res.data.result
      // 存储总数据条数
      this.total = res.data.total
      this.loading = false
    },
    // 监听 下拉页码 改变的事件
    handleSizeChange (newSize) {
      // console.log(newSize)
      this.queryInfo.pagesize = newSize
      this.getCateList()
    },
    // 监听 页码值 改变的事件
    handleCurrentChange (newPage) {
      // console.log(newPage)
      this.queryInfo.pagenum = newPage
      this.getCateList()
    },
    // 监听添加用户对话框的关闭事件 表单重置 状态保存 这样每次打开都是上次关闭的状态
    addCateDialogClosed () {
      this.$refs.addCateFormRef.resetFields() /* resetFields是element中表单的方法,用此方法需要ref引用表单【常用】 */
    },
    // 点击按钮，展示添加分类的对话框
    showAddCateDialog () {
      // 先获取父级分类的数据列表
      this.getParentCateList()
      // 再展示出对话框
      this.addCateDialogVisible = true
    },
    // 获取父级分类的数据列表
    async getParentCateList () {
      const { data: res } = await this.$http.get('categories', {
        params: { type: 2 }
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取所属父级分类数据失败！')
      }
      // console.log(res.data)
      this.parentCateList = res.data
    },
    // 父级分类选中项发生改变
    parentCateChanged () {
      // 判断是否选中父级分类，length>0即选中
      if (this.selectedKeys.length > 0) {
        // 取用数组最后一项
        this.addCateForm.cat_pid = this.selectedKeys[
          this.selectedKeys.length - 1
        ]
        // 赋值当前分类的等级（三级分类值为2，二级分类值为1，一级分类值为0）
        this.addCateForm.cat_level = this.selectedKeys.length
      } else {
        // 反之说明没有选中，重置为0（因为可能储存着上一次的结果）
        this.addCateForm.cat_pid = 0
        this.addCateForm.cat_level = 0
      }
    },
    // 点击确定，添加新用户 进行预校验
    addCate () {
      this.$refs.addCateFormRef.validate(async valid => {
        /* elementui校验通过 valid为true,否则为false */
        if (!valid) return
        // 校验通过 发起添加用户的网络请求
        const { data: res } = await this.$http.post(
          'categories',
          this.addCateForm
        )
        // 请求的返回结果
        if (res.meta.status !== 201) {
          return this.$message.error('添加分类失败！')
        }
        this.$message.success('添加分类成功！')
        // 隐藏添加用户的对话框
        this.addCateDialogVisible = false
        // 重新获取用户列表数据（因为有绑定,所以自动渲染）
        this.getCateList()
      })
    },
    // 根据Id删除对应的分类信息
    async removeCateById (id) {
      const confirmResult = await this.$confirm(
        '  此操作将永久删除该分类，请选择是否确认？',
        '删除用户数据',
        {
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          // center: true  //文字居中
        }
      ).catch(err => err)
      // console.log(confirmResult)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除该用户数据')
      }
      // 确认删除 先发送请求 判断删除是否成功 不用传id参数
      const { data: res } = await this.$http.delete('categories/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除分类操作失败！')
      }
      this.$message.success('删除分类操作成功！')
      this.getCateList()
    },
    // 操作多选
    handleSelectionChange (val) {
      this.multipleSelection = val
    },
    async removeCateAll (id) {
      // 弹框询问用户是否删除数据（参见element）
      const confirmResult = await this.$confirm(
        '  此操作将永久删除所有选中分类数据，请选择是否确认？',
        '批量删除操作',
        {
          confirmButtonText: '确 定',
          cancelButtonText: '取 消',
          type: 'warning'
          // center: true  //文字居中
        }
      ).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消批量删除操作')
      }
      const length = this.multipleSelection.length
      for (let i = 0; i < length; i++) {
        const { data: res } = await this.$http.delete(
          'categories/' + this.multipleSelection[i].cat_id
        )
        if (res.meta.status !== 200) {
          return this.$message.error('批量删除分类操作失败！')
        }
      }
      this.$message.success('批量删除分类操作成功！')
      this.getCateList()
    },
    // 展示编辑用户的对话框
    async showEditDialog (id) {
      const { data: res } = await this.$http.get('categories/' + id)
      // 解构赋值语法勿忘
      if (res.meta.status !== 200) {
        return this.$message.error('查询原有分类信息失败！')
      }
      // 储存数据
      this.editForm = res.data
      // 显示对话框
      this.editDialogVisible = true
    },
    // 监听修改用户对话框,关闭时重置【注意勿忘引用】
    editDialogClosed () {
      this.$refs.editFormRef.resetFields()
      // 清空级联选择器存储的数据
      this.selectedKeys = []
      this.addCateForm.cat_level = 0
      this.addCateForm.cat_pid = 0
    },
    // 点击确定进行预验证 并提交数据
    editCateInfo () {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return
        // 发起修改用户信息的数据请求
        const { data: res } = await this.$http.put(
          'categories/' + this.editForm.cat_id,
          {
            cat_name: this.editForm.cat_name
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改分类信息失败！')
        }
        // 关闭对话框
        this.editDialogVisible = false
        // 刷新数据列表
        this.getCateList()
        // 提示修改成功
        this.$message.success('修改分类信息成功！')
      })
    }
  }
}
</script>

<style lang="less" scoped>
.el-pagination {
  padding: 15px 0px 0px 0px;
}
.el-cascader {
  width: 100%;
}
.editForm {
  padding: 0px 30px 0px 0px; //上右下左
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
.span{
  margin-bottom: 15px;
}
.el-empty{
  margin-top: -20px;
}
</style>
