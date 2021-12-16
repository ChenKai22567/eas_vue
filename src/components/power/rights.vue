<template>
  <div>
    <!-- 面包屑导航区域 -->

    <!-- 卡片视图 -->
    <el-row :gutter="15">
      <el-col :span="5">
    <el-card align="middle" class="card_left">
      <el-row>
        <el-col :span="16" class="span">
        批量操作区域:
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button type="primary" 
          @click="clearFilter" 
          icon="el-icon-close"
          plain
            >清除过滤器</el-button
          >
          <!-- 点击这个按钮 对话框显示出来 -->
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-button icon="el-icon-refresh"
          @click="getRightsList()" type="info"
          plain>刷新本页面
          </el-button>
          <!-- 点击这个按钮 刷新 -->
        </el-col>
      </el-row>
      <el-row>
        <el-empty description="表头固定与筛选"></el-empty>
      </el-row>
    </el-card>
      </el-col>
        <el-col :span="19">
    <el-card >
      <el-row>
        <el-col>
          数据展示区域：
        </el-col>
      </el-row>
      <el-table 
      v-loading="loading"
      element-loading-text="正在向服务器请求数据"
      :data="rightsList" border stripe :row-style="{height:'20px'}" 
      :cell-style="{padding:'7px'}" ref="levelRef" height="383px"
      highlight-current-row @current-change="handleCurrentChange">
        <el-table-column label="#" type="index" width="60"></el-table-column>  <!--注意列宽的设置方法-->
        <el-table-column label="所有权限名称" sortable prop="authName"></el-table-column>
        <el-table-column label="用户权限路径" sortable prop="path" :formatter="formatter"></el-table-column>
        <el-table-column label="权限等级" prop="level" 
        :filters="[{ text: '一级权限', value: '0' }, { text: '二级权限', value: '1' }, { text: '三级权限', value: '2' }]"
      :filter-method="filterTag"
      filter-placement="bottom-end">  <!--placement显示筛选结果的位置-->
          <template v-slot="right">     <!--v-if和else判断-->
            <el-tag v-if="right.row.level === '0'">一级</el-tag>
            <!-- 这个标签要根据数据自定义 所以要放到作用域插槽里 -->
            <el-tag type="success" v-else-if="right.row.level === '1'"
              >二级</el-tag>
            <el-tag type="warning" v-else>三级</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  data() {
    return {
       //加载动画
      loading: true,
      // 权限列表
      rightsList: []
    }
  },
  created() {
    // 获取所有的权限
    this.getRightsList()
  },
  methods: {
    // 获取权限列表
    async getRightsList() {
      this.loading = true
      const { data: res } = await this.$http.get('rights/list')
      if (res.meta.status !== 200) {
        return this.$message.error('获取权限列表失败！')
      }
      this.rightsList = res.data
      this.$message.success('获取权限列表数据成功！')
        //挂载到自己的对象里
      //console.log(this.rightsList)
      this.loading = false
    },
    //清除过滤器
     clearFilter() {
        this.$refs.levelRef.clearFilter();
    },
    //过滤器的判断（筛选函数）（value为选中值）
    filterTag(value, row) {
        return row.level === value;
      },
    //过滤器的输出
    filterHandler(value, row, column) {
        const property = column['property'];
        return row[property] === value;
      },
    //数据的格式化（修改数据的内容）
     formatter(row, column) {
        return row.path;
      },
      //选中某行的函数
    handleCurrentChange(val) {
        this.currentRow = val;
    }
  }
}
</script>

<style lang="less" scoped>
/deep/.el-table__column-filter-trigger  .el-icon-arrow-down{
  &:before{
    content: "点击筛选∨";
    font-size: 16px;
    margin-left: 10px;
  }
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
  margin-bottom: 20px;
}
.el-empty{
  margin-top: -20px;
}
</style>
