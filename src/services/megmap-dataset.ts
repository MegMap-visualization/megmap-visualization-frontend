import '@amap/amap-jsapi-types'

import { IMegMapInfo, MegMapLayerType } from '@interfaces/megmap-layer'

import {
  LaneGroupPolygonLayer,
  LaneBoundaryLayer,
  LaneLayer,
  StopLineLayer,
  CrosswalkLayer,
  TrafficLightLayer,
  BaselinePathLayer,
  IntersectionLayer,
  LaneConnectorLayer,
  ReferenceLineLayer,
} from './megmap-layer'
import ApiService from './api'

import type { MegMapLayer } from './megmap-layer'

export class MegMapDataset {
  layers: { [key in MegMapLayerType]: MegMapLayer }
  megMapInfo: IMegMapInfo
  megmap: AMap.Map
  mapBounds: Array<AMap.Vector2> | null = null
  apiService: ApiService = ApiService.getInstance()
  layerMap = {
    [MegMapLayerType.LANE_GROUP_POLYGON]: LaneGroupPolygonLayer,
    [MegMapLayerType.LANE_BOUNDARY]: LaneBoundaryLayer,
    [MegMapLayerType.LANE]: LaneLayer,
    [MegMapLayerType.BASELINE_PATH]: BaselinePathLayer,
    [MegMapLayerType.STOP_LINE]: StopLineLayer,
    [MegMapLayerType.CROSSWALK]: CrosswalkLayer,
    [MegMapLayerType.TRAFFIC_LIGHT]: TrafficLightLayer,
    [MegMapLayerType.INTERSECTION]: IntersectionLayer,
    [MegMapLayerType.LANE_CONNECTOR]: LaneConnectorLayer,
    [MegMapLayerType.REFERENCE_LINE]: ReferenceLineLayer,
  }

  constructor(map: AMap.Map, megMapInfo: IMegMapInfo) {
    this.megMapInfo = megMapInfo
    this.megmap = map

    this.layers = {} as { [key in MegMapLayerType]: MegMapLayer }
    Object.keys(MegMapLayerType).forEach((layerType) => {
      if (this.megMapInfo.availableLayers.includes(layerType.toLowerCase())) {
        this.layers[
          MegMapLayerType[layerType as keyof typeof MegMapLayerType]
        ] = new this.layerMap[
          MegMapLayerType[layerType as keyof typeof MegMapLayerType]
        ](map, megMapInfo, this.apiService)
      }
    })
  }

  async getMapBounds(): Promise<Array<AMap.Vector2> | undefined> {
    try {
      const res = await this.apiService.get(
        `/megmap-dataset/map-bounds/${this.megMapInfo.mapRemark}/${this.megMapInfo.mapMd5}`,
      )
      if (res.status === 200) {
        this.mapBounds = res.data.data
        return res.data.data
      } else {
        ElMessage({
          message: 'getMapBounds,网络请求出错',
          type: 'error',
        })
      }
    } catch (e: any) {
      ElMessage({
        message: 'getMapBounds,网络请求出错',
        type: 'error',
      })
    }
  }
}
