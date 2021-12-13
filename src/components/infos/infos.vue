<template>
    <div>
<!-- 卡片视图区域 -->
    <el-row :gutter="15">
      <el-col :span="5">
    <el-card align="middle" class="card_left">
      
    </el-card>
      </el-col>
        <el-col :span="19">
    <el-card>
        <!-- 警告 -->
      <el-alert show-icon title="注意：只允许为第三级分类设置相关参数！" 
      type="warning" :closable="false"></el-alert>
      <!-- layout栅格组件 row行 col列 span是宽度（共24） gutter是间隙（合适即可） -->
      <el-row :gutter="130">
        <el-col :span="15">
 
        </el-col>
        
      </el-row>
     
     
    </el-card>
        </el-col>
    </div>
</template>

<script>
export default {
    data(){
        return {
      // 商品分类列表
      catelist: [],
        }
    },
}
</script>

<style lang="less" scoped>

</style>