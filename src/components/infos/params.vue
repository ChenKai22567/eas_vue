<template>
  <div>
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
              <el-button
                type="primary"
                @click="addDialogVisible = true"
                icon="el-icon-plus"
                plain
                >添加参数</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                icon="el-icon-refresh"
                @click="getCateList()"
                type="info"
                plain
                >刷新页面
              </el-button>
              <!-- 点击这个按钮 刷新 -->
            </el-col>
          </el-row>
          <el-row>
            <el-empty description="我引以为傲的操作逻辑"></el-empty>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="19" class="data-column">
        <el-card>
          <!-- 警告 -->
          <el-alert
            show-icon
            title="注意：仅末级分类可设置参数！"
            type="warning"
            :closable="false"
            effect="light"
            center
          ></el-alert>

          <!-- 选择救助信息分类区域 -->
          <el-row class="cat_opt">
            <el-col>
              <span>选择救助信息分类：</span>
              <!-- 选择救助信息分类的级联选择框 -->
              <el-cascader
                :options="catelist"
                :props="cateProps"
                v-model="selectedCateKeys"
                @change="handleChange"
                clearable
              >
              </el-cascader>
            </el-col>
          </el-row>

          <div v-if="selectedCategoryLabels.length" class="category-tag-tree" aria-label="当前分类层级">
            <template v-for="(label, index) in selectedCategoryLabels">
              <el-tag :key="'tag-' + index" :type="index === selectedCategoryLabels.length - 1 ? 'success' : ''">
                {{ label }}
              </el-tag>
              <i v-if="index < selectedCategoryLabels.length - 1" :key="'arrow-' + index" class="el-icon-arrow-right"></i>
            </template>
          </div>

          <el-tabs
            v-model="activeName"
            @tab-click="handleTabClick"
            tabPosition="right"
          >
            <!-- 添加可选参数的面板 --><!--name根据接口参数设定-->
            <el-tab-pane label="可选参数" name="many">
              <!-- many 和only是方便传递请求的参数 请求时直接取activeName就可以决定请求动态还是静态数据 -->
              <!-- 添加参数的按钮 -->
              <el-button
                type="primary"
                size="medium"
                :disabled="isBtnDisabled"
                @click="addDialogVisible = true"
                plain
                >添加可选参数</el-button
              >
              <!-- 动态参数表格 -->
              <el-table
                v-loading="loading"
                element-loading-text="正在向服务器请求数据"
                :data="manyTableData"
                border
                stripe
                :height="adaptiveTableHeight"
                :row-style="{ height: '23px' }"
                :cell-style="{ padding: '7px' }"
                row-key="attr_id"
                :default-expand-all="true"
              >
                <!-- 展开行 -->
                <el-table-column type="expand" width="60" label="展开">
                  <template v-slot="many">
                    <!-- 循环渲染Tag标签 -->
                    <el-tag
                      v-for="(item, i) in many.row.attr_vals"
                      :key="i"
                      closable
                      @close="handleClose(i, many.row)"
                      >{{ item }}</el-tag
                    >

                    <!--@keyup.enter.native点击回车-->
                    <!-- 输入的文本框，通过v-if实现与下按钮的失焦切换效果 -->
                    <el-input
                      class="input-new-tag"
                      v-if="many.row.inputVisible"
                      v-model="many.row.inputValue"
                      ref="saveTagInput"
                      size="small"
                      @keyup.enter.native="handleInputConfirm(many.row)"
                      @blur="handleInputConfirm(many.row)"
                    >
                    </el-input>
                    <!-- 添加按钮 点击会让上面的显示 为防止每一项文本框的inputVisible和inputValue共用 需要将获取的数据里添加一个属性 根据这个属性单独决定是否显示和输入的值 -->
                    <el-button
                      v-else
                      class="button-new-tag"
                      size="small"
                      @click="showInput(many.row)"
                      >+ 添加新内容</el-button
                    >
                  </template>
                </el-table-column>
                <!-- 索引列 -->
                <el-table-column type="index" label="#"></el-table-column>

                <el-table-column
                  label="参数名称"
                  prop="attr_name"
                ></el-table-column>
                <el-table-column label="操作">
                  <template v-slot="many">
                    <el-button
                      size="mini"
                      type="primary"
                      plain
                      icon="el-icon-edit"
                      @click="showEditDialog(many.row.attr_id)"
                      >编辑</el-button
                    >
                    <el-button
                      size="mini"
                      type="danger"
                      plain
                      icon="el-icon-delete"
                      @click="removeParams(many.row.attr_id)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="静态参数" name="only">
              <!-- 添加属性的按钮 -->
              <el-button
                type="primary"
                size="medium"
                :disabled="isBtnDisabled"
                @click="addDialogVisible = true"
                plain
                >添加静态参数</el-button
              >
              <!-- 静态属性表格 -->
              <el-table
                v-loading="loading"
                element-loading-text="正在向服务器请求数据"
                :data="onlyTableData"
                border
                stripe
                :height="adaptiveTableHeight"
                :row-style="{ height: '23px' }"
                :cell-style="{ padding: '7px' }"
                row-key="attr_id"
                :default-expand-all="true"
              >
                <!-- 展开行 -->
                <el-table-column type="expand" width="60" label="展开">
                  <template v-slot="only">
                    <!-- 循环渲染Tag标签 -->
                    <el-tag
                      v-for="(item, i) in only.row.attr_vals"
                      :key="i"
                      closable
                      @close="handleClose(i, only.row)"
                      >{{ item }}</el-tag
                    >
                    <!-- 输入的文本框 -->
                    <el-input
                      class="input-new-tag"
                      v-if="only.row.inputVisible"
                      v-model="only.row.inputValue"
                      ref="saveTagInput"
                      size="small"
                      @keyup.enter.native="handleInputConfirm(only.row)"
                      @blur="handleInputConfirm(only.row)"
                    >
                    </el-input>
                    <!-- 添加按钮 -->
                    <el-button
                      v-else
                      class="button-new-tag"
                      size="small"
                      @click="showInput(only.row)"
                      >+ 添加新内容</el-button
                    >
                  </template>
                </el-table-column>
                <!-- 索引列 -->
                <el-table-column type="index" label="#"></el-table-column>
                <el-table-column
                  label="属性名称"
                  prop="attr_name"
                ></el-table-column>
                <el-table-column label="操作">
                  <template v-slot="only">
                    <el-button
                      size="mini"
                      type="primary"
                      plain
                      icon="el-icon-edit"
                      @click="showEditDialog(only.row.attr_id)"
                      >编辑</el-button
                    >
                    <el-button
                      size="mini"
                      type="danger"
                      plain
                      icon="el-icon-delete"
                      @click="removeParams(only.row.attr_id)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
    <!-- 添加参数的对话框 两个面板共用的 所以文本要写成计算属性 用动态绑定 title和label -->
    <el-dialog
      :title="'添加' + titleText"
      :visible.sync="addDialogVisible"
      width="35%"
      @close="addDialogClosed"
    >
      <!-- 添加参数的对话框 addForm存储着要发送的数据 通过v-model将输入的内容与其绑定 -->
      <el-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        label-width="100px"
      >
        <el-form-item :label="titleText" prop="attr_name">
          <el-input
            v-model="addForm.attr_name"
            placeholder="请输入救助信息参数的名称"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addParams">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改参数的对话框 -->
    <el-dialog
      :title="'修改' + titleText"
      :visible.sync="editDialogVisible"
      width="35%"
      @close="editDialogClosed"
    >
      <!-- 修改参数的对话框 -->
      <el-form
        :model="editForm"
        :rules="editFormRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item :label="titleText" prop="attr_name">
          <el-input v-model="editForm.attr_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editParams">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { createAdaptiveTable } from '../../mixins/adaptiveTable.js'

export default {
  mixins: [createAdaptiveTable(450, 140)],
  data () {
    return {
      // 救助信息分类列表
      catelist: [],
      // 级联选择框的配置对象
      cateProps: {
        expandTrigger: 'hover',
        value: 'cat_id',
        label: 'cat_name',
        children: 'children'
      },
      // 级联选择框双向绑定到的数组
      selectedCateKeys: [],
      // 被激活的页签的名称
      activeName: 'many',
      // 动态参数的数据
      manyTableData: [],
      // 静态属性的数据
      onlyTableData: [],
      // 控制添加对话框的显示与隐藏
      addDialogVisible: false,
      // 添加参数的表单数据对象 供请求数据使用
      addForm: {
        attr_name: ''
      },
      // 添加表单的验证规则对象
      addFormRules: {
        attr_name: [
          {
            required: true,
            message: '请输入救助信息参数的名称',
            trigger: 'blur'
          }
        ]
      },
      // 控制修改对话框的显示与隐藏
      editDialogVisible: false,
      // 修改的表单数据对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        attr_name: [
          {
            required: true,
            message: '请输入救助信息参数的名称',
            trigger: 'blur'
          }
        ]
      },
      // 控制标签添加按钮与文本的切换
      // inputVisible: false,
      // 标签添加的内容
      // inputValue: '',
      // 加载动画
      loading: true
    }
  },
  created () {
    this.getCateList()
  },
  methods: {
    // 获取所有的救助信息分类列表
    async getCateList () {
      this.loading = true
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        this.loading = false
        return this.$message.error('获取商品分类失败！')
      }
      this.catelist = res.data
      if (this.selectedCateKeys.length === 0) this.selectedCateKeys = [1, 11, 111]
      await this.getParamsData()
      this.loading = false
    },
    // 级联选择框选中项变化，会触发这个函数
    handleChange () {
      this.getParamsData()
    },
    // tab 页签点击事件的处理函数
    handleTabClick () {
      this.getParamsData()
    },
    // 获取参数的列表数据 级联选择器的选中项和分页面板的选中项改变了都要调用这个函数发送请求
    async getParamsData () {
      // 证明选中的不是三级分类 清空选中 使得不让选中 只可以选中三级分类 同时下方的数据（上次遗留的数据）也清空 要不然上次打开的数据还能用
      if (this.selectedCateKeys.length !== 3) {
        this.selectedCateKeys = []
        this.manyTableData = []
        this.onlyTableData = []
        return
      }
      this.loading = true
      // 选中的是三级分类
      // console.log(this.selectedCateKeys)
      // 根据所选分类的Id，和当前所处的面板（many或only)
      // cateId为计算属性
      const { data: res } = await this.$http.get(
        'categories/' + this.cateId + '/attributes',
        {
          params: { sel: this.activeName }
        }
      )
      this.loading = false
      if (res.meta.status !== 200) {
        return this.$message.error('获取参数列表失败！')
      }
      // 将其中每一项循环，对拿到的item项进行操作
      res.data.forEach(item => {
        // 将data里面的attr_vals项改为数组，如果为空则改为空数组
        item.attr_vals = item.attr_vals ? item.attr_vals.split(' ') : []
        // 为防止每一项文本框的inputVisible和inputValue共用
        // 控制文本框的显示与隐藏
        item.inputVisible = false
        // 文本框中输入的值
        item.inputValue = ''
      })
      // 返回的数据要分开存储 分页面板根据情况进行渲染对应的数据 根据点击的面板决定返回的数据存储到哪里
      if (this.activeName === 'many') {
        this.manyTableData = res.data
      } else {
        this.onlyTableData = res.data
      }
      this.loading = false
    },
    // 监听添加对话框的关闭事件
    addDialogClosed () {
      this.$refs.addFormRef.resetFields()
    },
    // 点击确定，请求添加参数
    addParams () {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post(
          'categories/' + this.cateId + '/attributes',
          {
            attr_name: this.addForm.attr_name,
            attr_sel: this.activeName // 标明是可选还是静态
          }
        )
        if (res.meta.status !== 201) {
          return this.$message.error('添加参数失败！')
        }
        this.$message.success('添加救助信息参数成功！')
        this.addDialogVisible = false
        this.getParamsData()
      })
    },
    // 点击确定，展示修改对话框
    async showEditDialog (attrId) {
      // 查询当前参数的信息
      const { data: res } = await this.$http.get(
        'categories/' + this.cateId + '/attributes/' + attrId,
        {
          params: { attr_sel: this.activeName }
        }
      )
      if (res.meta.status !== 200) {
        return this.$message.error('获取参数信息失败！')
      }
      this.editForm = res.data
      this.editDialogVisible = true
    },
    // 关闭时重置修改的表单
    editDialogClosed () {
      this.$refs.editFormRef.resetFields()
    },
    // 点击确定，请求修改参数信息
    editParams () {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.put(
          'categories/' + this.cateId + '/attributes/' + this.editForm.attr_id,
          {
            attr_name: this.editForm.attr_name,
            attr_sel: this.activeName
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改参数失败！')
        }
        this.$message.success('修改救助信息参数成功！')
        this.getParamsData()
        this.editDialogVisible = false
      })
    },
    // 根据Id删除对应的参数项
    async removeParams (attrId) {
      const confirmResult = await this.$confirm(
        '此操作将永久删除该参数, 是否继续?',
        '删除操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(err => err)
      // 用户取消了删除的操作
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除分类操作！')
      }
      // 用户确认删除
      const { data: res } = await this.$http.delete(
        'categories/' + this.cateId + '/attributes/' + attrId
      )
      if (res.meta.status !== 200) {
        return this.$message.error('删除救助信息参数失败！')
      }
      this.$message.success('删除救助信息参数成功！')
      this.getParamsData()
    },
    // 文本框失去焦点，或摁下了Enter 展示按钮
    async handleInputConfirm (row) {
      // 切换走之前先看看输入的合不合法 不合法就清空再走 下次再打开来就不会显示这个了 trim是去除字符串两端的空格
      if (row.inputValue.trim().length === 0) {
        row.inputValue = ''
        row.inputVisible = false
        return
      }
      // 如果没有return，则证明输入的内容合法，将输入的值push到tag数组中，渲染为新标签 即多了一个标签 为了刷新页面还能存在还要请求添加到数据库里 而当前文本框里面的内容就无意义了可以清空了 因为下次再点开来要输入新的值了
      row.attr_vals.push(row.inputValue.trim())
      row.inputValue = ''
      row.inputVisible = false
      // 请求保存tag数组 attr_vals
      this.saveAttrVals(row)
    },
    // 请求保存tag数组 attr_vals
    async saveAttrVals (row) {
      const { data: res } = await this.$http.put(
        'categories/' + this.cateId + '/attributes/' + row.attr_id,
        {
          attr_name: row.attr_name,
          attr_sel: row.attr_sel,
          attr_vals: row.attr_vals.join(' ') // 本地是数组，请求需要字符串
        }
      )
      if (res.meta.status !== 200) {
        return this.$message.error('修改救助信息参数内容失败！')
      }
      this.$message.success('修改救助信息参数内容成功！')
    },
    // 点击按钮，展示标签文本输入框
    showInput (row) {
      // 显示输入框
      row.inputVisible = true
      // 让文本框自动获得焦点
      // $nextTick方法的作用，就是等文本输入框渲染出来之后，才会调用函数里的代码
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    // 删除对应的参数可选项 即将tag数组里的第i项删除 同时请求保存数组
    handleClose (i, row) {
      row.attr_vals.splice(i, 1)
      this.saveAttrVals(row)
    }
  },
  // 计算属性
  computed: {
    selectedCategoryLabels () {
      let options = this.catelist
      return this.selectedCateKeys.map(id => {
        const node = options.find(item => Number(item.cat_id) === Number(id))
        if (!node) return ''
        options = node.children || []
        return node.cat_name
      }).filter(Boolean)
    },
    // 如果按钮需要被禁用，则返回true，否则返回false
    isBtnDisabled () {
      if (this.selectedCateKeys.length !== 3) {
        return true
      }
      return false
    },
    // 当前选中的三级分类的Id
    cateId () {
      if (this.selectedCateKeys.length === 3) {
        return this.selectedCateKeys[2]
      }
      return null
    },
    // 动态计算对话框标题的文本
    titleText () {
      if (this.activeName === 'many') {
        return '可选参数'
      }
      return '静态参数'
    }
  }
}
</script>

<style lang="less" scoped>
.cat_opt {
  margin: 15px 0;
}

.el-tag {
  margin: 10px;
}

.input-new-tag {
  width: 120px;
}
.category-tag-tree {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: -4px 0 14px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f8fafc;
}
.category-tag-tree i {
  color: #909399;
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
.el-cascader {
  width: 40%;
}
.span{
  margin-bottom: 25px;
}
.el-empty{
  margin-top: -20px;
}
</style>
