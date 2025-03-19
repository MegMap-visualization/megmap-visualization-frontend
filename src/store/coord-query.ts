import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

import ApiService from '@services/api'

import { IRenderedData } from '@interfaces/megmap-layer'
import { keysToCamelCase } from '@utils/name-adapter'
import { createRenderedData } from '@services/megmap-layer'

export const useCoordQueryStore = defineStore({
  id: 'coord-query',
  state: () => ({
    results: [] as IRenderedData[],
    isVisible: false,
    eles: [] as any,
  }),
  actions: {
    async addCoord(from: string, coord: [number, number], zone_id?: number) {
      const api = ApiService.getInstance()
      const map = {
        utm: 'utm2wgs2gcj',
        wgs84: 'wgs2gcj-utm',
        gcj02: 'gcj2wgs2utm',
      }
      if (from in map === false) {
        return
      }
      let params = { coords: `${coord[0]},${coord[1]}` } as any
      if (from === 'utm') {
        params.utm_zone = zone_id
        params.northern = 'true'
      }
      const rv = await api.get(`ct/${map[from as keyof typeof map]}`, {
        params: params,
      })

      if (rv.status !== 200) {
        ElNotification({
          title: '坐标转换失败',
          message: rv.data.message,
          type: 'error',
        })
        return
      }
      if (rv.data.status !== 'success') {
        ElNotification({
          title: '坐标转换失败',
          message: rv.data.message,
          type: 'error',
        })
        return
      }
      const coordData = keysToCamelCase(rv.data.data)

      let gcj
      if ('gcj02' in coordData) {
        gcj = coordData.gcj02[0]
      } else {
        gcj = coord
      }
      const renderedData = createRenderedData(
        new Date().getTime().toString(),
        {
          utm: coordData.utm ? coordData.utm : { data: coord, zone: zone_id },
          wgs84: coordData.wgs84,
        },
        gcj,
        'red',
        1,
        1,
        1,
        'bold',
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

      this.results.push(renderedData)
    },

    clear() {
      this.isVisible = false
      this.results = []
      this.eles = []
    },
  },
  getters: {},
})
