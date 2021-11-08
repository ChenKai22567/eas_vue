<template>
    <div class="login_container">
    <div class="login_box">
      <!-- 头像区域 -->
      <div class="avatar_box">
       
      </div>
    </div>
    </div>
</template>

<script> // 行为区
export default {}
</script>

<style lang="less" scoped>
.login_container {
  background:url('../assets/2.png') no-repeat center;
  height: 100%;
  background-size:100% 100%;
  background-position: center 0;
}
.login_box {
  width: 450px;
  height: 300px;
  background-color: #fff;
  border-radius: 7px;
  position: absolute; //使其可以进行在页面上的位移
  left: 65%;
  top: 50%;
  transform: translate(-50%, -50%);
}
/*样式区——css与js注释同，此为多行注释
  scope控制样式只影响当前组件，否则全局生效
*/
</style>
