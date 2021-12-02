<template>
  <div class="login_container">
    <div class="login_box">
      <!-- 头像区域 -->
      <div class="avatar_box">
        <img src="../assets/1.jpg" alt="头像" />
      </div>
      <div>
         <p id="hi_text">LOGIN</p>  <!--CSS对其格式调整就得用p-->
        </div>
      <!--登陆表单区域-->
      <!--:hide-required-asterisk="true"来隐藏elementui默认的必选星号-->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginFormRules"
        class="login_form"
        :hide-required-asterisk="true"
      >
        <!--先用：model绑定数据对象到form上-->
        
      <el-form-item prop="username" label="账 号：" label-width="60px">
          <!-- rules在表单中存放规则（直接在data新建一个对象即可），item中用prop调用rules存放的对应规则 -->
          <el-input
            v-model="loginForm.username"
            prefix-icon="el-icon-user-solid"
          ></el-input>
          <!--再用v-model绑定到数据对象具体属性中-->
        </el-form-item>
        <el-form-item prop="password" label="密 码：" label-width="60px">
          <el-input
            v-model="loginForm.password"
            prefix-icon="el-icon-lock"
            type="password"
          ></el-input>
        </el-form-item>
        <!--按钮区域-->
        <el-form-item class="btns">
          <el-button type="primary" plain @click="login">登录</el-button>
          <el-button type="info" plain @click="resetLoginForm">重置</el-button>
        </el-form-item>
        <p id="bt_text">欢迎您登录紧急救助信息后台管理系统！</p>
      </el-form>
    </div>
  </div>
</template>

<script>
// 行为区
export default {
  data() {
    return {
      // 这是登录表单的数据绑定对象 存储着要绑定的数据 用于数据验证 发送请求等
      loginForm: {
        username: 'admin' /* 后面登录就不用再输 */,
        password: '123456'
      },
      // 这是表单的验证规则对象
      loginFormRules: {
        // 验证用户名是否合法，注意此处用【】，都是element ui里面的规则
        username: [
          { required: true, message: '请输入登录名称', trigger: 'blur' }, // 鼠标失焦触发验证
          { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
        ],
        // 验证密码是否合法
        password: [
          { required: true, message: '请输入登录密码', trigger: 'blur' },
          { min: 6, max: 15, message: '长度在 6 到 15 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    // 点击重置按钮，重置登录表单
    resetLoginForm() {
      // console.log(this); 可以查看本组件实例对象 里面有$refs属性
      this.$refs.loginFormRef.resetFields() /* 调用element ui中的form methods中的方法*/
    },
    login() {
      /* 点击登录进行预验证 即是否符合规则 符合valid为true 否则为false */
      this.$refs.loginFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post(
          'login',
          this.loginForm
        ) /* 加await返回的是数据 不加返回promise 而返回的数据里面只有data才是api返回的数据 其他的都是axios的 解构并重命名即data重命名为res */
        if (res.meta.status !== 200)
          return this.$message.error('登录失败！') /* 参见element中消息提示 */
        this.$message.success({
          message: '登录成功！',
          center: true
        })
        // 登录成功后:
        // 1. 将登录成功之后的 token，保存到客户端的 sessionStorage 中 之后的网络请求中要拿这个token放入请求头中
        //   1.1 项目中除了登录之外的其他API接口，必须在登录之后才能访问 token就是登录令牌
        //   1.2 token 只应在当前网站打开期间生效，所以将 token 保存在 sessionStorage 中（不是localstorage）
        window.sessionStorage.setItem('token', res.data.token)
        // 2. 通过编程式导航对象【$router】跳转到后台主页，路由地址是 /home 但是如果没有拿到token而直接输入地址也不应该跳转 此时要用导航守卫 如果要跳转的是登录页面则直接放行 如果跳转的是其他页面则要判断是否携带token 导航守卫写在router.js里面
        this.$router.push('/home')
      })
    }
  }
}
</script>

<style lang="less" scoped>
.login_container {
  background:url('../assets/蓝色.png') no-repeat center;
  height: 100%;
  background-size: 100% 100%;
  background-position: center 0;
  text-align: center;
}
.login_box {
  width: 370px;
  height: 340px;
  background-color: #fff;
  border-radius: 10px;
  position: absolute; //使其可以进行在页面上的位移
  left: 50%;
  top: 50%;
  transform: translate(-50%, -46%);
   box-shadow: -10px 10px 10px rgba(0,0,0,.1);
}
.avatar_box {
  height: 100px;
  width: 100px;
  border: 1px solid #eee; //边框
  border-radius: 50%; //圆角
  padding: 7px;
  box-shadow: 0 0 10px #ddd; //边框线向外扩散十像素2
  position: absolute;
  left: 50%;
  transform: translate(-50%, -60%);
  background-color: #fff;
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #eee;
  }
}
.login_form {
  position: absolute;
  bottom: 1%;
  width: 100%;
  padding: 0px 30px 12px 20px;  //上右下左
  box-sizing: border-box; //这样组件就不会超出form框
}
.btns {
  display: flex;
  justify-content: center;
  transform: translate(3%);
  padding: 5px 0px 0px 0px;  //上右下左
  font-weight: bold;
  
}
.el-form{
   font-weight: bold;
}
#hi_text{
  padding: 28px 0px 25px 0px;  //上右下左
  //text-align: center;  在container中
  font-size: 30px;
  font-weight: bold;
  color: #939393;
}
#bt_text{
  margin:0px 0px 0px 0px;  //上右下左
  padding: 0px 0px 0px 0px;  //上右下左
  font-size: 10px;
  font-weight: bold;
  color: #939393;
  transform: translate(4%, 0%);
}
.el-button{
  font-weight: bold;
}
/*样式区——css与js注释同，此为多行注释
  scope控制样式只影响当前组件，否则全局生效
*/
</style>
