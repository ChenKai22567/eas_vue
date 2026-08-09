<template>
  <div class="welcome-page">
    <el-empty :image-size="210" description="Welcome！欢迎使用救助信息后台管理系统！">
      <p>仓库地址：https://gitee.com/xuezihao/easvue_web</p>
    </el-empty>
  </div>
</template>

<style lang="less" scoped>
.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100dvh - 184px);
  min-height: 0;
  text-align: center;
}

.el-empty {
  width: min(100%, 720px);
  margin: 0;
}
</style>
