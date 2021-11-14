<template>
    <div>
        <el-button type="info" @click="logout">退出</el-button>

    </div>
</template>
<script>
export default {
   methods: {
    logout() {
      window.sessionStorage.clear() /* 清空token */
      this.$router.push('/login')}, /* 重定向到登录页 要用replace push还是能点返回回到这个home页 */
    }
}
</script>

<style lang="less" scoped>

</style>