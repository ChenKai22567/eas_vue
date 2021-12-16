<template>
  <div>
    <el-row :gutter="15">
      <el-col :span="5">
        <el-card align="middle" class="card_left">
          <el-row>
            <el-col :span="18" class="span">
              查看与操作区域:
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                type="primary"
                @click="showProgressBox"
                icon="el-icon-plus"
                plain
                >查看详情</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                type="danger"
                icon="el-icon-close"
                plain
                disabled
                >批量删除</el-button
              >
              <!-- 点击这个按钮 对话框显示出来 -->
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button
                icon="el-icon-refresh"
                @click="getProcesslist()"
                type="info"
                plain
                >刷新页面
              </el-button>
              <!-- 点击这个按钮 刷新 -->
            </el-col>
          </el-row>
          <el-row>
            <el-empty description="美化"></el-empty>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="19">
        <!-- 卡片视图区域 -->
        <el-card>
          <el-row>
            <el-col :span="12">
              <el-input placeholder="没有明确查询项，暂时不能搜索"
              v-model="queryInfo.query"
                clearable
                @clear="getProcesslist">
                <el-button slot="append" 
                @click="getProcesslist" icon="el-icon-search"></el-button>
              </el-input>
            </el-col>
          </el-row>

          <!-- 订单列表数据 -->
          <el-table :data="processlist" 
          v-loading="loading"
          element-loading-text="正在向服务器请求数据"
          border stripe
          height="323px"
          :row-style="{ height: '23px' }"
          :cell-style="{ padding: '7px' }"
          highlight-current-row
           >
            <el-table-column
              label="#"
              type="index"
              width="50"
              fixed
            ></el-table-column>
            <el-table-column
              label="救助信息编号"
              prop="order_number"
              width="120"
            ></el-table-column>
            <el-table-column
              label="救助者类型"
              prop="order_fapiao_title"
              width="100"
            ></el-table-column>
            <el-table-column label="救助进度" prop="pay_status" width="120">
              <template v-slot="status">
                <el-tag type="success" v-if="status.row.pay_status === '1'"
                  >救助已完成</el-tag
                >
                <el-tag type="warning" v-else>救助进行中</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="是否抵达" prop="is_send" width="80">
              <template slot-scope="scope">
                <template>
                  {{ scope.row.is_send }}
                </template>
              </template>
            </el-table-column>
            <el-table-column label="救助开始时间" prop="create_time" width="180">
              <template v-slot="time">
                {{ time.row.create_time | dateFormat }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template>
                <el-button
                  size="mini"
                  type="primary"
                  icon="el-icon-edit"
                  @click="showBox"
                  plain
                >编辑</el-button>
                <el-button
                  size="mini"
                  type="success"
                  icon="el-icon-location"
                  @click="showProgressBox"
                  plain
                >详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页区域 -->
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="queryInfo.pagenum"
            :page-sizes="[3, 6, 10]"
            :page-size="queryInfo.pagesize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            background
          >
          </el-pagination>
        </el-card>
      </el-col>
    </el-row>
    <!-- 修改地址的对话框 -->
    <el-dialog
      title="修改地址"
      :visible.sync="addressVisible"
      width="35%"
      @close="addressDialogClosed"
    >
      <el-form
        :model="addressForm"
        :rules="addressFormRules"
        ref="addressFormRef"
        label-width="140px"
      >
        <el-form-item label="选择省市区/县：" prop="address1">
          <el-cascader
            :options="cityData"
            v-model="addressForm.address1"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="填写详细地址：" prop="address2">
          <el-input v-model="addressForm.address2"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addressVisible = false">取 消</el-button>
        <el-button type="primary" @click="addressVisible = false"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <!-- 展示物流进度的对话框 -->
    <el-dialog title="详细救助进度" :visible.sync="progressVisible" width="50%">
      <!-- 时间线 -->
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in progressInfo"
          :key="index"
          :timestamp="activity.time"
        >
          暂时还没有数据
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script>
import cityData from './citydata.js'

export default {
  data() {
    return {
      queryInfo: {
        query: '',
        pagenum: 1,
        pagesize: 6
      },
      total: 0,
      processlist: [],

      addressVisible: false,
      addressForm: {
        address1: [],
        address2: ''
      },
      addressFormRules: {
        address1: [
          { required: true, message: '请选择省市区县', trigger: 'blur' }
        ],
        address2: [
          { required: true, message: '请填写详细地址', trigger: 'blur' }
        ]
      },
      cityData,
      progressVisible: false,
      progressInfo: [],
       //加载动画
      loading: true
    }
  },
  created() {
    this.getProcesslist()
  },
  methods: {
    //获取救助信息列表
    async getProcesslist() {
        this.loading = true
      const { data: res } = await this.$http.get('orders', {
        params: this.queryInfo
      })
      if (res.meta.status !== 200) {
        this.loading = false
        return this.$message.error('获取执行救助情况列表失败！')
      }
      console.log(res)
      this.total = res.data.total
      this.processlist = res.data.goods
      this.$message.success('获取执行救助情况列表成功！')
      this.loading = false
    },
    //监听页面容量变化
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getProcesslist()
    },
    //监听页码变化
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getProcesslist()
    },
    // 展示修改地址的对话框
    showBox() {
      this.addressVisible = true
    },
    // 点击取消按钮关闭修改地址的对话框后 清空表单数据（确定按钮发送请求等的功能省略了）
    addressDialogClosed() {
      this.$refs.addressFormRef.resetFields()
    },
    // 展示救助信息的对话框，用时间线展示出来
    async showProgressBox() {
      const { data: res } = await this.$http.get('/kuaidi/1106975712662')

      if (res.meta.status !== 200) {
        return this.$message.error('获取详细救助信息失败！')
      }
      this.progressInfo = res.data /* 存储 再用时间线展示出来 */
      this.progressVisible = true
      console.log(this.progressInfo)
    }
  }
}
</script>

<style lang="less" scoped>
.el-cascader {
  width: 100%;
}
.card_left {
  height: 465px;
}
.el-row {
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
}
.el-table{
  box-sizing: border-box;
}
.el-table >.el-table__fixed-right {
    height: 100% !important; //设置高优先，以覆盖内联样式
  }
body {
    margin: 0;
  }
.el-pagination {
  padding: 15px 0px 0px 0px;
}
.span{
  margin-bottom: 15px;
}
.el-empty{
  margin-top: -20px;
}
</style>
