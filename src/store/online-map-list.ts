import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'
import { IMegMapInfo } from '@interfaces/megmap-layer'
import { AxiosError } from 'axios'

import ApiService from '@services/api'
import { keysToCamelCase, keysToSnakeCase } from '@utils/name-adapter'

export const useOnlineMapListStore = defineStore({
  id: 'online-map-list',
  state: () => ({
    onlineMapListRecord: {} as Record<string, IMegMapInfo>,
    aviailableLayerNames: [] as string[],
    onlineMapListLoading: false,
    onlineMapListError: null as AxiosError | null,
  }),
  actions: {
    async fetchOnlineMapList() {
      const apiService = ApiService.getInstance()
      this.onlineMapListLoading = true
      try {
        const response = await apiService.get('/megmap-dataset')
        if (response.status !== 200) {
          ElNotification({
            type: 'error',
            message: '请求在线地图信息时，出现网络请求！',
          })
        }
        if (response.data.status !== 'success') {
          ElNotification({
            type: 'error',
            message: '请求在线地图信息时，服务器返回错误信息！',
          })
        }
        const data: IMegMapInfo[] = keysToCamelCase(response.data.data)
        for (const key of Object.keys(this.onlineMapListRecord)) {
          const hasD = data.some((d: IMegMapInfo) => d.mapMd5 === key)
          if (hasD) {
            continue
          }
          delete this.onlineMapListRecord[key]
        }
        for (const d of data) {
          if (d.mapMd5 in this.onlineMapListRecord) {
            continue
          }
          this.onlineMapListRecord[d.mapMd5] = d
        }
      } catch (error: any) {
        this.onlineMapListError = error
      } finally {
        this.onlineMapListLoading = false
      }
    },
  },
  getters: {
    onlineMapList: (state) => {
      return Object.values(state.onlineMapListRecord)
    },
  },
})
