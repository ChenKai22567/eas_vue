<template>
  <div>
    <el-card>
      <el-row :gutter="40">
        <el-col :span="19">
          <el-alert
            title="您正在添加救助信息"
            type="warning"
            show-icon
            close-text="知道了，退下吧"
            description="请务必按照提示按步骤进行操作"
          >
          </el-alert>
          <el-steps
            :space="200"
            :active="activeIndex - 0"
            finish-status="success"
            align-center
          >
            <!-- 减0是为了将下方的字符串转为数值 共用同一个数据项 -->
            <el-step title="基本信息"></el-step>
            <el-step title="可选标签"></el-step>
            <el-step title="静态分类"></el-step>
            <el-step title="描述图片"></el-step>
            <el-step title="详细内容"></el-step>
            <el-step title="发布完成"></el-step>
          </el-steps>
        </el-col>
        <el-col :span="5">
          <el-progress
            type="circle"
            :percentage="(activeIndex - 0) * 20"
            :color="colors"
          ></el-progress>
        </el-col>
      </el-row>
      <!-- tab栏区域 tabs里面不能放form 但form里面可以放tabs 所以要把form放外面 在每个tab-pane里面添加表单项 -->
      <el-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        label-width="130px"
        label-position="left"
      >
        <el-tabs
          v-model="activeIndex"
          :tab-position="'right'"
          :before-leave="beforeTabLeave"
          @tab-click="tabClicked"
        >
          <!-- v-model存储着当前选中的name值 将其存放到activeindex上 但是step里面接收的是数值 所以减0就能把字符串改为数值 即共用同一个数据项 就能和上面的步骤条实现联动了 before-leave是标签页切换时会触发函数 函数会自动传入两个参数 -->

          <el-tab-pane label="基本信息" name="0">
            <el-form-item label="救助信息标题：" prop="goods_name">
              <el-input v-model="addForm.goods_name"></el-input>
            </el-form-item>
            <el-form-item label="目前关注人数：" prop="goods_price">
              <el-input v-model="addForm.goods_price" type="number"></el-input>
            </el-form-item>
            <el-form-item label="救助重要程度：" prop="goods_number" class="narrow">
              <el-rate v-model="addForm.goods_number" 
          class="level" :texts="texts" show-text> 
                </el-rate>
            </el-form-item>
            <el-form-item label="救助完成情况:" prop="goods_state" class="narrow">
              <el-radio-group v-model="addForm.goods_state">
                <el-radio :label="0">完成救助</el-radio>
                <el-radio :label="1">正在救助</el-radio>
                <el-radio :label="2">等待救助</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="救助信息分类：" prop="goods_cat">
              <el-cascader
                expand-trigger="hover"
                :options="catelist"
                :props="cateProps"
                v-model="addForm.goods_cat"
                @change="handleChange"
              >
                <!-- goods_cat会以数组的形式存储 但是最后要以字符串的形式发送 存在格式不匹配的问题 -->
              </el-cascader>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="可选标签" name="1">
            <!-- 循环渲染 -->
            <el-form-item
              :label="item.attr_name"
              v-for="item in manyTableData"
              :key="item.attr_id"
              class="manyPage"
            >
              <!-- 复选框组 -->
              <el-checkbox-group v-model="item.attr_vals">
                <!-- v-model使得去掉勾选 原数据attr_name也会改变 即 ↓ -->
                <el-checkbox
                  :label="content"
                  v-for="(content, i) in item.attr_vals"
                  :key="i"
                  border
                ></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="静态分类" name="2">
            <el-form-item
              :label="item.attr_name"
              v-for="item in onlyTableData"
              :key="item.attr_id"
            >
              <el-input v-model="item.attr_vals"></el-input>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="描述图片" name="3">
            <el-row>
            <el-col :span="3">
                可上传图片：
            </el-col>
            <!-- action 表示图片要上传到的后台API地址 光网页上看到把图片上传了没有用 打开network 看到返回的提示显示无效token 说明没有用到axios请求（axios添加了heads
            请求头）组件内部封装的请求没有添加 所以参见element ui添加headers属性手动设置好请求头 上传成功后还要把请求参数里的pics文件路径保存好 以供后面请求添加商品 路径在network返回的信息里面data里temp_path里 在属性on-success对应的事件里设置 事件会自动传入三个参数 -->
           <el-col :span="15">
            <el-upload
              :action="uploadURL"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              list-type="picture"
              :headers="headerObj"
              :on-success="handleSuccess"
            >
              <el-button size="medium" type="primary" plain>点击上传救助信息描述图片</el-button>
            </el-upload>
           </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="详细内容" name="4">
            <!-- 富文本编辑器组件 ql-editor这个类名要在浏览器中富文本编辑器相应的位置中找到 html没有写 -->
            <quill-editor v-model="addForm.goods_introduce"></quill-editor>
            <!-- 添加商品的按钮 -->
            <el-button type="primary" class="btnAdd" @click="add"
              >完成添加当前救助信息</el-button
            >
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </el-card>

    <!-- 图片预览 -->
    <el-dialog title="图片预览" :visible.sync="previewVisible" width="50%">
      <img :src="previewPath" alt="" class="previewImg" />
      <!-- previewPath存储着图片的url -->
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash' /* 导入lodash再调用cloneDeep方法 推荐用_接收 类似jquery用$接收 */

export default {
  data() {
    return {
      texts:['完全不紧急','一般紧急','较为紧急','非常紧急','极度紧急'],
      colors: [
        { color: '#f56c6c', percentage: 20 },
        { color: '#e6a23c', percentage: 40 },
        { color: '#5cb87a', percentage: 60 },
        { color: '#1989fa', percentage: 80 },
        { color: '#6f7ad3', percentage: 100 }
      ],
      activeIndex: '0',
      // 添加救助信息表单数据对象
      addForm: {
        goods_name: '调试默认1',
        goods_price: 0,
        goods_weight: 0,
        goods_state: 2,
        goods_number: 1,
        // 救助信息所属的分类数组，要将数组转为以逗号分隔的字符串
        goods_cat: [],
        // 图片的数组
        pics: [],
        // 救助信息的详情描述
        goods_introduce: '',
        attrs: []
      },
      addFormRules: {
        goods_name: [
          { required: true, message: '请输入救助信息标题', trigger: 'blur' }
        ],
        goods_price: [
          { required: true, message: '预期关注人数', trigger: 'blur' }
        ],
        goods_number: [
          { required: true, message: '请选择救助紧急程度', trigger: 'blur' }
        ],
        goods_state: [
          { required: true, message: '请选择救助完成情况', trigger: 'blur' }
        ],
        goods_cat: [
          { required: true, message: '请选择救助信息分类', trigger: 'blur' }
        ]
      },
      // 救助信息分类列表
      catelist: [],
      cateProps: {
        /* 级联选择器的配置项 */
        label: 'cat_name',
        value: 'cat_id',
        children: 'children'
      },
      // 可选参数列表数据
      manyTableData: [],
      // 静态参数列表数据
      onlyTableData: [],
      // 上传图片的URL地址
      uploadURL: 'http://101.43.37.78:8888/api/private/v1/upload',
      // 图片上传组件的headers请求头对象
      headerObj: {
        Authorization: window.sessionStorage.getItem('token')
      },
      previewPath: '',
      previewVisible: false
    }
  },
  created() {
    this.getCateList()
  },
  methods: {
    // 获取所有商品分类数据
    async getCateList() {
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        return this.$message.error('获取救助信息分类数据失败！')
      }
      this.catelist = res.data
      console.log(this.catelist)
    },
    // 级联选择器选中项变化
    //因为通过v-model将选中项以数组的形式和goods_cat绑定了 但是最后上传给服务器的时候要字符串形式 但是又不能将其直接改为字符串（正向渲染不出来）所以先深拷贝一份总参数对象 装lodash包 里面有cloneDeep方法（参考对应官网）装好依赖后先在本组件里导入（推荐用_接收 类似jquery用$接收）然后调用cloneDeep方法拷贝一份
    handleChange() {
      //console.log(this.addForm.goods_cat)
      if (this.addForm.goods_cat.length !== 3) {
        /* 没有选中三级项 清空 */
        this.addForm.goods_cat = []
      }
    },
    // before-leave是标签页切换时会触发函数 函数会自动传入两个参数
    beforeTabLeave(activeName, oldActiveName) {
      // console.log('即将离开的标签页名字是：' + oldActiveName)
      // console.log('即将进入的标签页名字是：' + activeName)
      // return false 则不能切换 接下来要根据条件进行阻止
      if (oldActiveName === '0' && this.addForm.goods_cat.length !== 3) {
        this.$message.error('请先选择救助信息分类再进行下一步！')
        return false
      }
    },
    // 切换标签时执行
    async tabClicked() {
      // console.log(this.activeIndex)
      if (this.activeIndex === '1') {
        /* 证明访问的是可选参数面板 获取数据存储到manyTableData */
        const { data: res } = await this.$http.get(
          'categories/'+this.cateId+'/attributes',
          {
            params: { sel: 'many' }
          })
        if (res.meta.status !== 200) {
          return this.$message.error('获取动态参数列表失败！')
        }
        //console.log(res.data)
        // 存储前先将attr_vals变为数组 供复选框组check-box-group渲染使用（这个是存储在了数据里面 而不是参数对象里面 参数对象里面还要另外加一个attrs存放这个 把数组转为字符串存到里面再发送出去）最后传给服务器时还要改回字符串
        res.data.forEach(item => {
          item.attr_vals = item.attr_vals.length === 0 ? [] : item.attr_vals.split(' ')
        })
        this.manyTableData = res.data
      } else if (this.activeIndex === '2') {
        const { data: res } = await this.$http.get(
          'categories/'+this.cateId+'/attributes',
          {
            params: { sel: 'only' }
          })
        if (res.meta.status !== 200) {
          return this.$message.error('获取静态参数失败！')
        }
        //console.log(res.data)
        this.onlyTableData = res.data
      }
    },
    // 处理图片预览效果 on-preview是点击图片的名称触发这个事件
    handlePreview(file) {
      console.log(
        file
      ) /* 当前图片的信息 有response-> data-> temp_path url url是图片路径可在网站上查看 所以可以在展示的对话框里将url与图片的src绑定 展示出来 */
      this.previewPath = file.response.data.url
      this.previewVisible = true
    },
    // 处理移除图片的操作 on-remove点击叉号触发
    handleRemove(file) {
      // console.log(file) 移除的图片的信息 依然有response-> data-> temp_path
      // 1. 获取将要删除的图片的临时路径
      const filePath = file.response.data.tmp_path
      // 2. 从 pics 数组中，找到这个图片对应的索引值 x是数组pics里的每一项 匹配上了findIndex就把索引值返回
      const i = this.addForm.pics.findIndex(x => x.pic === filePath)
      // 3. 调用数组的 splice 方法，把图片信息对象，从 pics 数组中移除
      this.addForm.pics.splice(i, 1)
      console.log(this.addForm) /* addForm即要发送请求的参数列表 */
    },
    // 监听图片上传成功 保存文件路径
    handleSuccess(response) {
      console.log(response) /* 就是network里显示的信息 */
      // 1. 拼接得到一个图片信息对象
      const picInfo = { pic: response.data.tmp_path }
      // 2. 将图片信息对象存储到pics数组中
      this.addForm.pics.push(picInfo)
      console.log(this.addForm) /* addForm即要发送请求的参数列表 */
    },
    // 添加商品 发送请求
    add() {
      // 先进行预验证
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) {
          return this.$message.error('请填写必要的表单项！')
        }
        // 发送前先处理格式问题：
        // 1.处理级联选择器的goods_cat
        // 级联选择器的选中项通过v-model以数组的形式和传递的参数对象里面的goods_cat绑定了 但是最后上传给服务器的时候要字符串形式 但是又不能将其直接改为字符串（正向渲染不出来 会报错）所以可以先深拷贝一份总参数对象 装lodash包 里面有cloneDeep方法（参考对应官网）装好依赖后先在本组件里导入（推荐用_接收 类似jquery用$接收）然后调用cloneDeep方法拷贝一份新的对象 在这份新的里面转换好格式请求给服务器
        // 导入lodash包（先安装依赖） cloneDeep(obj)
        const form = _.cloneDeep(this.addForm)
        form.goods_cat = form.goods_cat.join(',')

        // 2.处理动态参数 即先把存放在数据里的相应数据（attr_vals）改为数组再存放到参数对象里
        this.manyTableData.forEach(item => {
          const newInfo = {
            attr_id: item.attr_id,
            attr_value: item.attr_vals.join(' ')
          }
          this.addForm.attrs.push(newInfo)
        })
        // 处理静态属性 这个attr_vals不用处理 因为静态属性的attr_vals本来就是字符串
        this.onlyTableData.forEach(item => {
          const newInfo = { attr_id: item.attr_id, attr_value: item.attr_vals }
          this.addForm.attrs.push(newInfo)
        })
        // 把addForm里推进去的attrs复制给新拷贝出来的form 再发送请求
        form.attrs = this.addForm.attrs
        console.log(form)

        // 发起请求添加商品
        // 商品的名称，必须是唯一的
        const { data: res } = await this.$http.post('goods', form)

        if (res.meta.status !== 201) {
          return this.$message.error('添加救助信息失败！')
        }

        this.$message.success('添加救助信息成功！')
        this.$router.push('/goods')
      })
    }
  },
  computed: {
    // 计算属性选中的三级商品分类的id
    cateId() {
      if (this.addForm.goods_cat.length === 3) {
        return this.addForm.goods_cat[2]
      }
      return null
    }
  }
}
</script>

<style lang="less" scoped>
.el-checkbox {
  margin: 0 15px 0 0 !important; //上右下左 
}

.previewImg {
  width: 100%;
}

.btnAdd {
  margin-top: 15px;
}
.el-alert {
  width: 70%;
  margin-left: 100px;
}
.el-steps {
  width: 100%;
  margin-top: 30px;
  margin-bottom: 30px;
}
.el-form {
  margin-left: 25px;
  margin-bottom: -20px;
}
.el-form-item {
  margin-right: 30px;
}
.el-card {
  min-height: 470px;
}
.el-cascader {
  width: 60%;
}
.level{
  transform: translate(0%,50%);
}
.narrow{
    margin-bottom: 10px;
    margin-top: -10px;
}
.manyPage{
    margin-top: 30px;
}

</style>
