import axios from 'axios'
import env from '../config/env'

export const http = axios.create({
  baseURL: env.API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    'x-client': env.APP_NAME,
    'x-build-time': env.BUILD_TIME,
  }
  return config
})

// Retry exponencial simples para falhas de rede/5xx
http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config: any = error.config ?? {}
    const retriable =
      !error.response || (error.response.status >= 500 && error.response.status < 600)
    config.__retryCount = config.__retryCount || 0
    if (retriable && config.__retryCount < 2) {
      config.__retryCount++
      const delay = 500 * Math.pow(2, config.__retryCount) // 500ms, 1s, 2s...
      await new Promise((res) => setTimeout(res, delay))
      return http(config)
    }
    return Promise.reject(error)
  }
)