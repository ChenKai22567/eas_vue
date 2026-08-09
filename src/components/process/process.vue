<template>
  <div>
    <el-row :gutter="15" class="workspace-row">
      <el-col :span="5" class="action-column">
        <el-card align="middle" class="card_left">
          <el-row><el-col :span="18" class="span">查看与操作区域:</el-col></el-row>
          <el-row>
            <el-col :span="24">
              <el-button type="primary" icon="el-icon-location" plain :disabled="!currentRow" @click="showProgressBox(currentRow)">查看详情</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button type="danger" icon="el-icon-close" plain :disabled="multipleSelection.length === 0" @click="removeSelected">批量删除</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-button icon="el-icon-refresh" type="info" plain @click="getProcesslist">刷新页面</el-button>
            </el-col>
          </el-row>
          <el-row><el-empty description="选择记录后可查看或修改"></el-empty></el-row>
        </el-card>
      </el-col>

      <el-col :span="19" class="data-column">
        <el-card>
          <el-row :gutter="12">
            <el-col :span="14">
              <el-input
                v-model="queryInfo.query"
                placeholder="按执行编号、救助标题、救助者或地址搜索"
                clearable
                @clear="search"
                @keyup.enter.native="search"
              >
                <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
              </el-input>
            </el-col>
            <el-col :span="7">
              <el-select v-model="queryInfo.status" clearable placeholder="筛选执行状态" @change="search">
                <el-option label="待执行" value="待执行"></el-option>
                <el-option label="执行中" value="执行中"></el-option>
                <el-option label="已完成" value="已完成"></el-option>
                <el-option label="已取消" value="已取消"></el-option>
              </el-select>
            </el-col>
          </el-row>

          <el-table
            v-loading="loading"
            element-loading-text="正在向服务器请求数据"
            :data="processlist"
            border
            stripe
            :height="adaptiveTableHeight"
            row-key="order_id"
            highlight-current-row
            :row-style="{ height: '23px' }"
            :cell-style="{ padding: '7px' }"
            @current-change="handleRowChange"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="52" reserve-selection fixed></el-table-column>
            <el-table-column label="#" type="index" width="45" fixed></el-table-column>
            <el-table-column label="救助信息编号" prop="order_number" min-width="155"></el-table-column>
            <el-table-column label="救助者类型" prop="order_fapiao_title" min-width="160"></el-table-column>
            <el-table-column label="关联救助信息" prop="goods_name" min-width="190"></el-table-column>
            <el-table-column label="执行状态" prop="order_status" min-width="100">
              <template v-slot="scope">
                <el-tag :type="statusTag(scope.row.order_status)">{{ scope.row.order_status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="是否抵达" prop="is_send" min-width="85"></el-table-column>
            <el-table-column label="救助开始时间" prop="create_time" min-width="180">
              <template v-slot="scope">{{ scope.row.create_time | dateFormat }}</template>
            </el-table-column>
            <el-table-column label="执行地址" prop="consignee_addr" min-width="230"></el-table-column>
            <el-table-column label="操作" width="194" fixed="right" class-name="process-action-column">
              <template v-slot="scope">
                <div class="process-action-group">
                  <el-button size="mini" type="primary" icon="el-icon-edit" plain @click.stop="showEditBox(scope.row)">编辑</el-button>
                  <el-button size="mini" type="success" icon="el-icon-location" plain @click.stop="showProgressBox(scope.row)">详情</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            :current-page="queryInfo.pagenum"
            :page-sizes="[3, 6, 10]"
            :page-size="queryInfo.pagesize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog title="修改执行记录" :visible.sync="addressVisible" width="480px" @close="addressDialogClosed">
      <el-form ref="addressFormRef" :model="addressForm" :rules="addressFormRules" label-width="105px">
        <el-form-item label="当前地址">
          <el-input v-model="addressForm.currentAddress" disabled></el-input>
        </el-form-item>
        <el-form-item label="选择省市区">
          <el-cascader v-model="addressForm.address1" :options="cityData" clearable></el-cascader>
        </el-form-item>
        <el-form-item label="详细地址" prop="address2">
          <el-input v-model="addressForm.address2" placeholder="可直接填写完整地址"></el-input>
        </el-form-item>
        <el-form-item label="执行状态" prop="order_status">
          <el-select v-model="addressForm.order_status">
            <el-option label="待执行" value="待执行"></el-option>
            <el-option label="执行中" value="执行中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
            <el-option label="已取消" value="已取消"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否抵达">
          <el-switch v-model="addressForm.arrived" active-text="是" inactive-text="否"></el-switch>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addressVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveOrder">保 存</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="progressTitle" :visible.sync="progressVisible" width="560px">
      <el-empty v-if="progressInfo.length === 0" description="尚无执行进度"></el-empty>
      <el-timeline v-else>
        <el-timeline-item
          v-for="(activity, index) in progressInfo"
          :key="index"
          :timestamp="activity.time | dateFormat"
          placement="top"
        >
          <strong>{{ activity.context }}</strong>
          <div class="timeline-location"><i class="el-icon-location-outline"></i>{{ activity.location || '未记录地点' }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script>
import cityData from './citydata.js'
import { createAdaptiveTable } from '../../mixins/adaptiveTable.js'

export default {
  mixins: [createAdaptiveTable(325, 160)],
  data () {
    return {
      queryInfo: { query: '', status: '', pagenum: 1, pagesize: 6 },
      total: 0,
      processlist: [],
      currentRow: null,
      multipleSelection: [],
      addressVisible: false,
      addressForm: {
        order_id: null,
        currentAddress: '',
        address1: [],
        address2: '',
        order_status: '待执行',
        arrived: false
      },
      addressFormRules: {
        address2: [{ required: true, message: '请填写详细地址', trigger: 'blur' }],
        order_status: [{ required: true, message: '请选择执行状态', trigger: 'change' }]
      },
      cityData,
      progressVisible: false,
      progressTitle: '详细救助进度',
      progressInfo: [],
      loading: true
    }
  },
  created () {
    this.getProcesslist()
  },
  methods: {
    async getProcesslist () {
      this.loading = true
      const { data: res } = await this.$http.get('orders', { params: this.queryInfo })
      this.loading = false
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      this.total = res.data.total
      this.processlist = res.data.goods
      this.currentRow = null
    },
    search () {
      this.queryInfo.pagenum = 1
      this.getProcesslist()
    },
    handleSizeChange (newSize) {
      this.queryInfo.pagesize = newSize
      this.queryInfo.pagenum = 1
      this.getProcesslist()
    },
    handleCurrentChange (newPage) {
      this.queryInfo.pagenum = newPage
      this.getProcesslist()
    },
    handleRowChange (row) {
      this.currentRow = row
    },
    handleSelectionChange (rows) {
      this.multipleSelection = rows
    },
    statusTag (status) {
      return { 已完成: 'success', 执行中: 'warning', 已取消: 'info', 待执行: 'danger' }[status] || 'info'
    },
    showEditBox (row) {
      this.addressForm = {
        order_id: row.order_id,
        currentAddress: row.consignee_addr,
        address1: [],
        address2: row.consignee_addr,
        order_status: row.order_status,
        arrived: row.is_send === '是'
      }
      this.addressVisible = true
    },
    addressDialogClosed () {
      if (this.$refs.addressFormRef) this.$refs.addressFormRef.resetFields()
    },
    saveOrder () {
      this.$refs.addressFormRef.validate(async valid => {
        if (!valid) return
        const region = this.addressForm.address1.join('')
        const fullAddress = region ? `${region}${this.addressForm.address2}` : this.addressForm.address2
        const { data: res } = await this.$http.put(`orders/${this.addressForm.order_id}`, {
          consignee_addr: fullAddress,
          order_status: this.addressForm.order_status,
          is_send: this.addressForm.arrived ? '是' : '否'
        })
        if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
        this.addressVisible = false
        this.$message.success('执行记录已更新')
        this.getProcesslist()
      })
    },
    async showProgressBox (row) {
      if (!row) return this.$message.info('请先选择一条执行记录')
      const { data: res } = await this.$http.get(`kuaidi/${row.order_id}`)
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      this.progressInfo = res.data
      this.progressTitle = `${row.order_number} · 详细救助进度`
      this.progressVisible = true
    },
    async removeSelected () {
      if (this.multipleSelection.length === 0) return this.$message.info('请先选择要删除的记录')
      const confirmed = await this.$confirm('将永久删除选中的执行记录及时间线，是否继续？', '批量删除', {
        confirmButtonText: '确 定', cancelButtonText: '取 消', type: 'warning'
      }).catch(error => error)
      if (confirmed !== 'confirm') return
      for (const row of this.multipleSelection) {
        const { data: res } = await this.$http.delete(`orders/${row.order_id}`)
        if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      }
      this.$message.success('选中的执行记录已删除')
      this.getProcesslist()
    }
  }
}
</script>

<style lang="less" scoped>
.el-cascader,
.el-select {
  width: 100%;
}
.card_left {
  height: 465px;
}
.el-row {
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
}
.el-table { box-sizing: border-box; }
.process-action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  white-space: nowrap;

  .el-button {
    flex: 0 0 76px;
    margin: 0;
    padding-right: 10px;
    padding-left: 10px;
  }
}
.el-pagination { padding: 15px 0 0; }
.span { margin-bottom: 15px; }
.el-empty { margin-top: -20px; }
.timeline-location {
  margin-top: 8px;
  color: #909399;
  i { margin-right: 5px; }
}
</style>
