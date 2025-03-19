import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

import ApiService from '@services/api'

import { useToolSideStore } from './tool-side'
import { MouseToolType } from '@interfaces/common'
import { GCJ2WGS842UTMData } from '@interfaces/coord-converter'

import type { ElAmapMouseTool } from '@vuemap/vue-amap'

export const useDrawToolStore = defineStore({
  id: 'draw-tool',
  state: () => ({
    mouseToolObj: null as typeof ElAmapMouseTool | null,
    mouseToolOpened: false,
    mouseToolType: 'polygon' as MouseToolType,
    result: null as any,
  }),
  actions: {
    async convertPoints(
      points: [number, number][],
    ): Promise<GCJ2WGS842UTMData | undefined> {
      const apiService = ApiService.getInstance()
      let reqPoints = ''
      points.forEach((p) => {
        reqPoints += `${p[0]},${p[1]},`
      })
      reqPoints = reqPoints.slice(0, -1)
      const res = await apiService.get('/ct/gcj2wgs2utm', {
        params: { coords: reqPoints },
      })
      if (res.status !== 200 || res.data.status !== 'success') {
        ElNotification({
          title: '错误',
          message: '坐标转换失败',
          type: 'error',
        })
        return
      }
      return res.data.data
    },
    async mouseDraw(e: any, target: any) {
      switch (this.mouseToolType) {
        case 'polygon':
        case 'rectangle':
        case 'polyline': {
          const rv = await this.convertPoints(e)
          if (!rv) {
            this.result = {
              gcj02_points: e,
              wgs84_points: 'fail to convert',
              utm_points: 'fail to convert',
            }
          } else {
            this.result = {
              gcj02_points: e,
              wgs84_points: rv.wgs84,
              utm_points: rv.utm,
            }
          }
          break
        }
        case 'measureArea':
          if (target._opts.path) {
            const points = target._opts.path
            const rv = await this.convertPoints(points)
            if (!rv) {
              this.result = {
                gcj02_points: points,
                wgs84_points: 'fail to convert',
                utm_points: 'fail to convert',
                area: e,
                unit: 'm^2',
              }
            } else {
              this.result = {
                gcj02_points: points,
                wgs84_points: rv.wgs84,
                utm_points: rv.utm,
                area: e,
                unit: 'm^2',
              }
            }
            break
          }
          this.result = {
            area: e,
            unit: 'm^2',
          }
          break
        case 'rule':
          if (target._opts.path) {
            const points = target._opts.path
            const rv = await this.convertPoints(points)
            if (!rv) {
              this.result = {
                gcj02_points: points,
                wgs84_points: 'fail to convert',
                utm_points: 'fail to convert',
                distance: e,
                unit: 'm',
              }
            } else {
              this.result = {
                gcj02_points: points,
                wgs84_points: rv.wgs84,
                utm_points: rv.utm,
                distance: e,
                unit: 'm',
              }
            }
            break
          }
          this.result = {
            distance: e,
            unit: 'm',
          }
          break
        case 'marker':
          {
            const points = [e]
            const rv = await this.convertPoints(points)
            if (!rv) {
              this.result = {
                gcj02_points: points,
                wgs84_points: 'fail to convert',
                utm_points: 'fail to convert',
              }
            } else {
              this.result = {
                gcj02_points: points,
                wgs84_points: rv.wgs84,
                utm_points: rv.utm,
              }
            }
          }
          break
        default:
          break
      }
      this.mouseToolObj?.$$close(false)
      const toolSideStore = useToolSideStore()
      toolSideStore.isDrawAndPickCoordinateVisible = true
    },
  },
  getters: {},
})
