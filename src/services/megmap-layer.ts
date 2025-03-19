import '@amap/amap-jsapi-types'

import { ElMessage } from 'element-plus'

import ApiService from './api'
import { keysToCamelCase, keysToSnakeCase } from '@utils/name-adapter'

import {
  MegMapLayerType,
  IBaseLayerData,
  IMegMapInfo,
  IRenderedData,
} from '@interfaces/megmap-layer'

export interface MegMapLayer {
  aMap: AMap.Map
  layerType: MegMapLayerType
  megMapInfo: IMegMapInfo
  data: Record<string, IBaseLayerData>
  allIds: string[]

  getDataFromBbox(bounds: string, ids?: string[]): void
  getDataFromIds(ids: string[]): void
  getIdsFromBbox(bounds: string): void
  getLocalData(
    customIds?: string[] | number[] | null,
  ): Promise<Record<string, IBaseLayerData>>
  getAllData(): void
  getAllIds(): void
  getBbox(): string
  getRenderedData(
    customData?: Record<string, IBaseLayerData> | null,
  ): Promise<Record<string, IRenderedData>>
  isAlldataLoaded(): boolean
}

class BaseLayer {
  aMap: AMap.Map
  layerType: MegMapLayerType
  megMapInfo: IMegMapInfo

  data: Record<string, IBaseLayerData> = {}
  renderedData: Record<string, IRenderedData> = {}
  allIds: string[] = []

  roadTypeColorMap: Record<string, string> = {
    unkonwn: '#FFF8DC',
    highway: '#4B0082',
    cityroad: '#000FFF',
    park: '#19679F',
    ramp: '#FF4500',
    tunnel: '#8B4513',
    toll: '#FFD700',
  }

  protected apiService: ApiService

  private layerIdUrl: string
  private layerDatumUrl: string

  constructor(
    aMap: AMap.Map,
    megMapInfo: IMegMapInfo,
    layerType: MegMapLayerType,
    apiService: ApiService,
  ) {
    this.aMap = aMap
    this.megMapInfo = megMapInfo
    this.layerType = layerType
    this.apiService = apiService

    this.layerIdUrl = this.getLayerIdUrl()
    this.layerDatumUrl = this.getLayerDatumUrl()
  }

  private getLayerIdUrl(): string {
    return `/megmap-dataset/layer-ids/${this.megMapInfo.mapRemark}/${this.megMapInfo.mapMd5}/${this.layerType}`
  }

  private getLayerDatumUrl(): string {
    return `/megmap-dataset/layer-datum/${this.megMapInfo.mapRemark}/${this.megMapInfo.mapMd5}/${this.layerType}`
  }

  async getAllIds(): Promise<void> {
    try {
      const rv = await this.apiService.get(this.layerIdUrl)
      if (rv.status === 200) {
        if (rv.data.status === 'success') {
          this.allIds = rv.data.data
        } else {
          console.error(rv.data.message)
          ElMessage.error('获取图层数据ID失败')
        }
      } else {
        console.error(rv.headers)
        ElMessage.error('获取图层数据失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('获取图层数据ID失败')
    }
  }

  async getDataFromIds(ids: string[]): Promise<void> {
    if (
      this.allIds.length !== 0 &&
      this.allIds.length === Object.keys(this.data).length
    ) {
      return
    }
    const filteredIds = ids.filter((id) => !this.data.hasOwnProperty(id))
    if (filteredIds.length === 0) {
      return
    }
    const idsReqData = filteredIds.join(',')
    const rv = await this.apiService.get(this.layerDatumUrl, {
      params: { ids: idsReqData },
    })
    try {
      if (rv.status === 200) {
        if (rv.data.status === 'success') {
          const data = rv.data.data
          for (const key in data) {
            if (!this.data.hasOwnProperty(key)) {
              this.data[key] = keysToCamelCase(data[key]) as T
            }
          }
        } else {
          console.error(rv.data)
          ElMessage.error('获取图层数据失败')
        }
      } else {
        console.error(rv.headers)
        ElMessage.error('获取图层数据失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('获取图层数据失败')
    }
  }

  async getDataFromBbox(bounds: string, ids?: string[]): Promise<string[]> {
    if (this.aMap.getZoom() < 15 || this.aMap.getZoom() > 25) {
      ElNotification({
        message: '请将地图缩放到15-25级，加载局部地图数据',
        type: 'warning',
        duration: 1000,
      })
      return []
    }
    if (
      this.allIds.length !== 0 &&
      this.allIds.length === Object.keys(this.data).length
    ) {
      console.log(this.allIds.length, Object.keys(this.data).length)
      return this.getIdsFromBbox(bounds)
    }
    let rv
    if (ids === undefined) {
      rv = await this.apiService.get(this.layerDatumUrl, {
        params: keysToSnakeCase({ mapBounds: bounds }),
      })
    } else {
      rv = await this.apiService.get(this.layerDatumUrl, {
        params: keysToSnakeCase({ mapBounds: bounds, ids: ids.join(',') }),
      })
    }

    try {
      if (rv.status === 200) {
        if (rv.data.status === 'success') {
          const data = rv.data.data
          for (const key in data) {
            if (!this.data.hasOwnProperty(key)) {
              this.data[key] = keysToCamelCase(data[key])
            }
          }
          return Object.keys(data)
        } else {
          console.error(rv.data.message)
          ElMessage.error('获取图层数据失败')
        }
      } else {
        console.error(rv.headers)
        ElMessage.error('获取图层数据失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('获取图层数据失败')
    }
    return []
  }

  async getIdsFromBbox(bounds: string): Promise<string[]> {
    const rv = await this.apiService.get(this.layerIdUrl, {
      params: keysToSnakeCase({ mapBounds: bounds }),
    })
    try {
      if (rv.status === 200) {
        if (rv.data.status === 'success') {
          return rv.data.data
        } else {
          console.error(rv.data.message)
          ElMessage.error('获取图层数据失败')
        }
      } else {
        console.error(rv.headers)
        ElMessage.error('获取图层数据失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('获取图层数据失败')
    }
    return []
  }

  async getLocalData(
    customIds: string[] | number[] | null = null,
  ): Promise<Record<string, any>> {
    let ids
    if (customIds === null) {
      const bound_str = this.getBbox()
      ids = await this.getDataFromBbox(bound_str)
    } else {
      await this.getDataFromIds(customIds)
      ids = customIds
    }
    const data: Record<string, any> = {}
    for (const id of ids) {
      data[id] = this.data[id]
    }
    return data
  }

  async getAllData(): Promise<void> {
    if (this.allIds.length === 0) {
      await this.getAllIds()
    }

    if (this.isAlldataLoaded()) {
      return
    }

    const allIdLength = this.allIds.length
    for (let i = 0; i < allIdLength; i += 100) {
      const ids = this.allIds.slice(i, i + 100)
      await this.getDataFromIds(ids)
    }
  }

  public getBbox(): string {
    const bounds = this.aMap.getBounds()
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const polygon = [
      [ne.lng, ne.lat],
      [ne.lng, sw.lat],
      [sw.lng, sw.lat],
      [sw.lng, ne.lat],
    ]
    let bound_str = ''
    polygon.forEach((point) => {
      bound_str += `${point[0]},${point[1]};`
    })
    return bound_str.slice(0, -1)
  }

  public isAlldataLoaded(): boolean {
    return (
      this.allIds.length !== 0 &&
      this.allIds.length === Object.keys(this.data).length
    )
  }
}

export class LaneGroupPolygonLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.LANE_GROUP_POLYGON, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      let color
      if (val.roadType) {
        color = this.roadTypeColorMap[val.roadType.toLowerCase()] || 'yellow'
      } else {
        color = 'yellow'
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        color,
        2,
        0.2,
        1,
        'solid',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        val.preRoadSectionIds || val.pres,
        val.sucRoadSectionIds || val.sucs,
      )
    }
    return this.renderedData
  }
}

export class LaneBoundaryLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.LANE_BOUNDARY, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      data = await this.getLocalData()
    } else {
      data = customData
    }
    let renderedData: Record<string, IRenderedData> = {}
    for (const [key, val] of Object.entries(data)) {
      if (renderedData.hasOwnProperty(key)) {
        continue
      }

      let strokeStyle = 'solid'
      if (val.borderType === 'broken' || val.borderType === 'dotted') {
        strokeStyle = 'dashed'
      } else {
        strokeStyle = 'solid'
      }

      let color = 'white'
      if (val.color) {
        color = val.color
        // apollo地图：如果是虚拟边界线，颜色为灰色
        if (val.borderType === 'virtual') {
          strokeStyle = 'dashed'
          color = 'grey'
        }
      } else if (val.borderColor) {
        color = val.borderColor
        if (val.borderColor === 'unknown' && val.borderType === 'unknown') {
          color = 'red'
        } else if (val.borderColor === 'ins' && val.borderType === 'virtual') {
          color = 'grey'
          strokeStyle = 'dashed'
        }
      }

      renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        color,
        3,
        0,
        1,
        strokeStyle,
      )
    }
    return renderedData
  }
}

export class LaneLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.LANE, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      data = await this.getLocalData()
    } else {
      data = customData
    }
    let renderedData: Record<string, IRenderedData> = {}
    for (const [key, val] of Object.entries(data)) {
      renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'yellow',
        0,
        0,
        1,
        'solid',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        val.predecessorLaneUids || val.pres,
        val.successorLaneUids || val.sucs,
        val.rightSameNeighbors || val.rsns,
        val.leftSameNeighbors || val.lsns,
        val.rightOppositeNeighbors || val.rons,
        val.leftOppositeNeighbors || val.lons,
        val.objectReferences || val.ors,
        val.signalReferences || val.srs,
        val.junctionReferences || val.jrs,
      )
    }
    return renderedData
  }
}

export class BaselinePathLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.BASELINE_PATH, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      data = await this.getLocalData()
    } else {
      data = customData
    }
    let renderedData: Record<string, IRenderedData> = {}
    for (const [key, val] of Object.entries(data)) {
      if (renderedData.hasOwnProperty(key)) {
        continue
      }
      renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'green',
        3,
        0,
        1,
        'solid',
      )
    }
    return renderedData
  }
}

export class StopLineLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.STOP_LINE, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'white',
        8,
        0,
        1,
        'solid',
      )
    }
    return this.renderedData
  }
}

export class CrosswalkLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.CROSSWALK, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'white',
        5,
        0,
        1,
        'solid',
      )
    }
    return this.renderedData
  }
}

export class TrafficLightLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.TRAFFIC_LIGHT, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'white',
        5,
        0,
        1,
        'solid',
      )
    }
    return this.renderedData
  }
}

export class IntersectionLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.INTERSECTION, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        'pink',
        5,
        0,
        1,
        'solid',
      )
    }
    return this.renderedData
  }
}

export class LaneConnectorLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.LANE_CONNECTOR, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }

      let strokeStyle: string
      if (val.borderType === 'broken') {
        strokeStyle = 'dashed'
      } else {
        strokeStyle = 'solid'
      }

      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        val.color || 'white',
        10,
        0,
        1,
        strokeStyle,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        val.predecessorLaneUids || val.pres,
        val.successorLaneUids || val.sucs,
        val.rightSameNeighbors || val.rsns,
        val.leftSameNeighbors || val.lsns,
        val.rightOppositeNeighbors || val.rons,
        val.leftOppositeNeighbors || val.lons,
        val.objectReferences || val.ors,
        val.signalReferences || val.srs,
        val.junctionReferences || val.jrs,
      )
    }
    return this.renderedData
  }
}

export class ReferenceLineLayer extends BaseLayer implements MegMapLayer {
  constructor(aMap: AMap.Map, megMapInfo: IMegMapInfo, apiService: ApiService) {
    super(aMap, megMapInfo, MegMapLayerType.REFERENCE_LINE, apiService)
  }

  async getRenderedData(
    customData: Record<string, IBaseLayerData> | null = null,
  ): Promise<Record<string, IRenderedData>> {
    let data
    if (customData === null) {
      await this.getAllData()
      data = this.data
    } else {
      data = customData
    }
    for (const [key, val] of Object.entries(data)) {
      if (this.renderedData.hasOwnProperty(key)) {
        continue
      }
      let color
      if (val.roadType) {
        color = this.roadTypeColorMap[val.roadType.toLowerCase()] || 'yellow'
      } else {
        color = '#663300'
      }
      this.renderedData[key] = createRenderedData(
        key,
        val,
        val.points,
        color,
        8,
        0,
        1,
        'solid',
        null,
        null,
        null,
        null,
        null,
        true,
        'white',
        val.preRoadSectionIds || val.pres,
        val.sucRoadSectionIds || val.sucs,
      )
    }
    return this.renderedData
  }
}

export const createRenderedData = (
  id: number | string,
  dispalyedData: Record<string, any>,
  path: [number, number][],
  color: string,
  strokeWeight: number,
  fillOpacity: number,
  strokeOpacity: number,
  strokeStyle: string,
  storkeColor: string | null = null,
  fillColor: string | null = null,
  isOutline: boolean | null = null,
  outlineColor: string | null = null,
  lineJoin: string | null = null,
  showDir: boolean | null = null,
  dirColor: string | null = null,
  pres: string[] | null = null,
  sucs: string[] | null = null,
  rightSameNeighbors: string[] | null = null,
  leftSameNeighbors: string[] | null = null,
  rightOppositeNeighbors: string[] | null = null,
  leftOppositeNeighbors: string[] | null = null,
  objectReferences: string[] | null = null,
  signalReferences: string[] | null = null,
  junctionReferences: string[] | null = null,
) => {
  let renderedData: IRenderedData = {} as IRenderedData
  if (storkeColor === null) {
    storkeColor = color
  }
  if (fillColor === null) {
    fillColor = color
  }
  if (outlineColor === null) {
    outlineColor = color
  }
  renderedData.id = id
  renderedData.dispalyedData = dispalyedData
  renderedData.path = path
  renderedData.color = color
  renderedData.defaultColor = color
  renderedData.strokeWeight = strokeWeight
  renderedData.defaultStrokeWeight = strokeWeight
  renderedData.storkeColor = storkeColor
  renderedData.defaultStrokeColor = storkeColor
  renderedData.strokeStyle = strokeStyle
  renderedData.defaultStrokeStyle = strokeStyle
  renderedData.fillColor = fillColor
  renderedData.defaultFillColor = fillColor
  renderedData.fillOpacity = fillOpacity
  renderedData.defaultFillOpacity = fillOpacity
  renderedData.strokeOpacity = strokeOpacity
  renderedData.defaultStrokeOpacity = strokeOpacity
  renderedData.isOutline = isOutline
  renderedData.outlineColor = outlineColor
  renderedData.defaultOutlineColor = outlineColor
  renderedData.lineJoin = lineJoin
  renderedData.showDir = showDir
  renderedData.dirColor = dirColor
  renderedData.defaultDirColor = dirColor
  renderedData.pres = pres
  renderedData.sucs = sucs
  renderedData.rightSameNeighbors = rightSameNeighbors
  renderedData.leftSameNeighbors = leftSameNeighbors
  renderedData.rightOppositeNeighbors = rightOppositeNeighbors
  renderedData.leftOppositeNeighbors = leftOppositeNeighbors
  renderedData.objectReferences = objectReferences
  renderedData.signalReferences = signalReferences
  renderedData.junctionReferences = junctionReferences
  return renderedData
}

export const setRenderedDataStyle = (
  renderedData: IRenderedData,
  color: string | null = null,
  strokeWeight: number | null = null,
  strokeColor: string | null = null,
  strokeStyle: string | null = null,
  fillColor: string | null = null,
  fillOpacity: number | null = null,
  strokeOpacity: number | null = null,
  outlineColor: string | null = null,
  dirColor: string | null = null,
) => {
  if (strokeColor === null) {
    strokeColor = color
  }
  if (fillColor === null) {
    fillColor = color
  }
  if (outlineColor === null) {
    outlineColor = color
  }
  renderedData.color = color || renderedData.color
  renderedData.strokeWeight = strokeWeight || renderedData.strokeWeight
  renderedData.storkeColor = strokeColor || renderedData.storkeColor
  renderedData.strokeStyle = strokeStyle || renderedData.strokeStyle
  renderedData.fillColor = fillColor || renderedData.fillColor
  renderedData.fillOpacity = fillOpacity || renderedData.fillOpacity
  renderedData.strokeOpacity = strokeOpacity || renderedData.strokeOpacity
  renderedData.outlineColor = outlineColor || renderedData.outlineColor
  renderedData.dirColor = dirColor || renderedData.dirColor
}

export const resetRenderedDataStyle = (renderedData: IRenderedData) => {
  renderedData.color = renderedData.defaultColor
  renderedData.strokeWeight = renderedData.defaultStrokeWeight
  renderedData.storkeColor = renderedData.defaultStrokeColor
  renderedData.strokeStyle = renderedData.defaultStrokeStyle
  renderedData.fillColor = renderedData.defaultFillColor
  renderedData.fillOpacity = renderedData.defaultFillOpacity
  renderedData.strokeOpacity = renderedData.defaultStrokeOpacity
  renderedData.outlineColor = renderedData.defaultOutlineColor
  renderedData.dirColor = renderedData.defaultDirColor
}
