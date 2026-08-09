import axios from 'axios'
import NProgress from 'nprogress'

const api = axios.create({
  baseURL: '/api/private/v1/',
  timeout: 15000
})

api.interceptors.request.use(config => {
  NProgress.start()
  const token = window.sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, error => {
  NProgress.done()
  return Promise.reject(error)
})

api.interceptors.response.use(response => {
  NProgress.done()
  return response
}, error => {
  NProgress.done()
  if (error.response && error.response.status === 401) {
    window.sessionStorage.clear()
    if (window.location.hash !== '#/login') window.location.hash = '#/login'
    return Promise.reject(error)
  }
  // 旧页面按响应包络中的 meta.status 展示业务错误，保留这一契约。
  if (error.response) return error.response
  return Promise.reject(error)
})

export default api
