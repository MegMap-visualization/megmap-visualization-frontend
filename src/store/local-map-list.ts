import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

import ApiService from '@services/api'
import { keysToCamelCase } from '@utils/name-adapter'

import type {
  ILocalMapInfoData,
  ILocalMapInfo,
  ILocalMapExtractionTaskLog,
} from '@interfaces/local-map-list'

export const useLocalMapListStore = defineStore({
  id: 'local-map-list',
  persist: true,
  state: () => ({
    localMapInfoDataRecord: {} as Record<string, ILocalMapInfoData>,
  }),
  actions: {
    /**
     * 查询地图是否已经存在，如果存在返回地图的元信息
     * @param mapMd5
     * @returns
     */
    async getLocalMapInfo(mapMd5: string): Promise<ILocalMapInfo | undefined> {
      const apiService = ApiService.getInstance()
      try {
        const res = await apiService.get(
          `/megmap-layer-builder/local-map-info/${mapMd5}`,
        )
        if (res.status === 200 && res.data.status === 'success') {
          return keysToCamelCase(res.data.data) as ILocalMapInfo
        }
      } catch (error) {
        console.error(error)
      }
      ElNotification({
        message: '查询MegMap信息异常',
        type: 'error',
      })
    },
    /**
     * 使用文件对象从状态中匹配文件的md5值
     * @param file
     * @returns
     */
    getMd5FromFileObj(file: File): string | null {
      const fileName = file.name
      const fileLastModified = file.lastModified
      const fileSize = file.size
      const fileType = file.type

      for (const [key, value] of Object.entries(this.localMapInfoDataRecord)) {
        if (
          value.fileName === fileName &&
          value.fileLastModified === fileLastModified &&
          value.filesize === fileSize &&
          value.fileType === fileType
        ) {
          return key
        }
      }

      return null
    },
    /**
     * 地图文件上传后，查询地图提取任务的状态
     * @param taskId
     */
    async getLocalMapExtractionTaskLog(fileMd5: string): Promise<undefined> {
      const apiService = ApiService.getInstance()
      const localMapInfoData = this.localMapInfoDataRecord[fileMd5]
      if (
        !localMapInfoData ||
        localMapInfoData.taskId === '' ||
        localMapInfoData.isSuccess
      ) {
        return
      }
      const taskId = localMapInfoData.taskId
      try {
        const res = await apiService.get(
          `/megmap-layer-builder/builder-task/${taskId}`,
        )
        if (res.status === 200 && res.data.status === 'success') {
          const taskRv = keysToCamelCase(
            res.data.data,
          ) as ILocalMapExtractionTaskLog
          let logType: 'info' | 'danger' | 'warning' | 'success' = 'info'
          switch (taskRv.status) {
            case 'running':
              localMapInfoData.isSuccess = false
              localMapInfoData.message = '数据提取中'
              localMapInfoData.messageType = 'warning'
              logType = 'info'
              break
            case 'success':
              localMapInfoData.isSuccess = true
              localMapInfoData.message = '提取成功'
              localMapInfoData.messageType = 'success'
              logType = 'success'
              break
            case 'error':
              localMapInfoData.isSuccess = false
              localMapInfoData.message = '提取失败'
              localMapInfoData.messageType = 'danger'
              logType = 'danger'
              break
            default:
              break
          }
          localMapInfoData.taskLogs = taskRv.messages.map((message) => {
            let messageType = message[2] as
              | 'info'
              | 'warning'
              | 'error'
              | 'danger'
            if (messageType === 'error') {
              messageType = 'danger'
            }
            if (!messageType) {
              messageType = 'info'
            }
            return {
              timestamp: message[0],
              message: message[1],
              type: messageType,
            }
          })
          localMapInfoData.taskLogs[localMapInfoData.taskLogs.length - 1].type =
            logType
          return
        }
      } catch (error) {
        console.error(error)
      }
      ElNotification({
        message: '获取地图提取任务日志失败',
        type: 'error',
      })
      localMapInfoData.message = '进度查询失败'
      localMapInfoData.messageType = 'warning'
    },
    /**
     * 本地删除缓存
     */
    deleteLocalMapInfoData(fileMd5: string): void {
      delete this.localMapInfoDataRecord[fileMd5]
    },
  },
  getters: {
    allLocalMapInfoData(): ILocalMapInfoData[] {
      return Object.values(this.localMapInfoDataRecord)
    },
  },
})
