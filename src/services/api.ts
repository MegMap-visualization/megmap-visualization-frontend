import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { ResponseData } from '@interfaces/common'

interface ApiError extends Error {
  response?: {
    status: number
    data: {
      message: string
    }
  }
}

class ApiService {
  private static instance: ApiService
  private axiosInstance: AxiosInstance

  private constructor(baseUrl: string) {
    console.log('API Service initializing with base URL:', baseUrl);
    
    this.axiosInstance = axios.create({ 
      baseURL: baseUrl,
      // 添加基础配置
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('发送请求:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('收到响应:', {
          status: response.status,
          headers: response.headers,
          data: response.data
        });
        
        // 检查响应类型
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          console.error('收到HTML响应而不是JSON:', response.data);
          return Promise.reject(new Error('Invalid response type: HTML'));
        }
        
        return response;
      },
      (error) => {
        console.error('响应错误:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      console.log('初始化API服务, Base URL:', baseUrl);
      ApiService.instance = new ApiService(baseUrl);
    }
    return ApiService.instance;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      console.log('开始请求:', {
        url: config.url,
        method: config.method,
        data: config.data
      });
      
      const response = await this.axiosInstance.request<T>({
        ...config,
        // 添加时间戳防止缓存
        params: {
          ...config.params,
          _t: Date.now()
        }
      });

      console.log('请求成功:', {
        url: config.url,
        status: response.status,
        data: response.data
      });

      return response;
    } catch (error: any) {
      console.error('请求失败:', {
        url: config.url,
        error: error.message,
        response: error.response
      });

      const axiosError: ApiError = new Error(error.message);
      if (error.response) {
        axiosError.response = {
          status: error.response.status,
          data: error.response.data,
        };
      }
      throw axiosError;
    }
  }

  // GET 请求
  async get(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ResponseData>> {
    console.log('发起GET请求:', url);
    return this.request<ResponseData>({ ...config, method: 'GET', url });
  }

  // POST 请求
  async post(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ResponseData>> {
    console.log('发起POST请求:', url, data);
    return this.request<ResponseData>({ ...config, method: 'POST', url, data });
  }

  async put(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ResponseData>> {
    return this.request<ResponseData>({ ...config, method: 'PUT', url, data })
  }

  async delete(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ResponseData>> {
    return this.request<ResponseData>({ ...config, method: 'DELETE', url })
  }
}

export default ApiService
