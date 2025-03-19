import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

import ApiService from '@services/api'
import { IRenderedData } from '@interfaces/megmap-layer'
import { createRenderedData } from '@services/megmap-layer'
import { keysToCamelCase } from '@utils/name-adapter'
import internal from 'stream'

function hslToHex(h: number, s: number, l: number) {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function generateDistinctColors(n: number) {
  // 定义五种不同的颜色
  const predefinedColors = [
    '#00FF00', // 亮绿色
    '#8A2BE2', // 蓝紫色
    '#FFFF00', // 黄色
    '#FF4500', // 暗橙色
    '#FF0000', // 红色
  ]

  const colors = []
  for (let i = 0; i < n; i++) {
    if (i < 5) {
      // 使用预定义的颜色
      colors.push(predefinedColors[i])
    } else {
      // 超过五种颜色时，都使用红色
      colors.push('#FF0000')
    }
  }
  return colors
}

function timestamp2Date(timestamp: number) {
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

interface IHeatmapData {
  bagNames: string[]
  roadId: string
  count: number
  points: [number, number][]
  timestamp: number[] | string[]
  localization: [number, number][]
  utmZoneId: number
}

interface IHeatmapDataResult {
  data: Record<string, IHeatmapData>
  allCount: number
  minCount: number
  maxCount: number
  maxCountRoadId: string
  minCountRoadId: string
}

export const useWlxVisStore = defineStore({
  id: 'wlx-vis',
  state: () => ({
    heatmapRenderDataList: [] as IRenderedData[],
    colorMap: {} as Record<number, string>,
    countArray: [] as number[],
    heatmapDataLoading: false,
    isVisible: false,
  }),
  actions: {
    async fetchHeatmapData(queryStr?: string) {
      const apiService = ApiService.getInstance()
      this.heatmapDataLoading = true
      try {
        let response
        if (!queryStr) {
          response = await apiService.get('/wlx/vis-data')
        } else {
          response = await apiService.get('/wlx/vis-data', {
            params: { filter: queryStr },
          })
        }

        if (response.status !== 200) {
          ElNotification({
            type: 'error',
            message: '请求热力图数据时，出现网络请求！',
          })
        }
        if (response.data.status !== 'success') {
          ElNotification({
            type: 'error',
            message: '请求热力图数据时，服务器返回错误信息！',
          })
        }
        const heatmapData = keysToCamelCase(
          response.data.data,
        ) as IHeatmapDataResult

        if (Object.keys(heatmapData).length == 0 || !heatmapData['data']) {
          return []
        }

        let countSet: Set<number> = new Set()
        Object.values(heatmapData['data']).forEach((d) => {
          countSet.add(d['count'])
        })
        let colors = generateDistinctColors(countSet.size)
        this.countArray = Array.from(countSet)
        this.countArray.sort((a, b) => a - b)
        this.colorMap = Object.fromEntries(
          this.countArray.map((key, index) => [key, colors[index]]),
        )

        const dataList: IRenderedData[] = []
        for (const [key, value] of Object.entries(heatmapData['data'])) {
          let dispalyedData = {} as any
          dispalyedData['Bag Names'] = value['bagNames']
          dispalyedData['Road Id'] = value['roadId']
          dispalyedData['count'] = value['count']
          dispalyedData['Dates'] = value['timestamp'].map((v) => {
            return timestamp2Date(v as number)
          })

          let d = createRenderedData(
            key,
            dispalyedData,
            value['points'],
            this.colorMap[value['count']],
            3,
            1,
            1,
            'solid',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          )
          dataList.push(d)
        }
        this.heatmapRenderDataList = dataList
      } catch (error: any) {
        this.heatmapRenderDataList = [] as IRenderedData[]
      } finally {
        this.heatmapDataLoading = false
      }
      this.heatmapDataLoading = false
    },
    clear() {
      this.$reset()
    },
  },
})
