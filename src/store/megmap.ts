import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

import { MegMapLayerType } from '@interfaces/megmap-layer'
import { MegMapDataset } from '@services/megmap-dataset'

import type { IMegMapInfo, IRenderedData } from '@interfaces/megmap-layer'

export const useMegMapStore = defineStore({
  id: 'megmap',
  state: () => ({
    megmapDataset: null as MegMapDataset | null,
    layerRenderedData: {
      [MegMapLayerType.LANE]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.INTERSECTION]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.STOP_LINE]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.CROSSWALK]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.TRAFFIC_LIGHT]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.LANE_CONNECTOR]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.BASELINE_PATH]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.LANE_BOUNDARY]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.LANE_GROUP_POLYGON]: {} as Record<string, IRenderedData>,
      [MegMapLayerType.REFERENCE_LINE]: {} as Record<string, IRenderedData>,
    },
    layerElements: {
      [MegMapLayerType.LANE]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.INTERSECTION]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.STOP_LINE]: {} as Record<string, AMap.Polyline>,
      [MegMapLayerType.CROSSWALK]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.TRAFFIC_LIGHT]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.LANE_CONNECTOR]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.BASELINE_PATH]: {} as Record<string, AMap.Polyline>,
      [MegMapLayerType.LANE_BOUNDARY]: {} as Record<string, AMap.Polyline>,
      [MegMapLayerType.LANE_GROUP_POLYGON]: {} as Record<string, AMap.Polygon>,
      [MegMapLayerType.REFERENCE_LINE]: {} as Record<string, AMap.Polyline>,
    },
    isLocalLoading: {
      [MegMapLayerType.LANE_BOUNDARY]: true,
      [MegMapLayerType.BASELINE_PATH]: true,
      [MegMapLayerType.LANE_GROUP_POLYGON]: false,
      [MegMapLayerType.REFERENCE_LINE]: false,
      [MegMapLayerType.LANE]: true,
      [MegMapLayerType.INTERSECTION]: false,
      [MegMapLayerType.STOP_LINE]: false,
      [MegMapLayerType.CROSSWALK]: false,
      [MegMapLayerType.TRAFFIC_LIGHT]: false,
      [MegMapLayerType.LANE_CONNECTOR]: false,
    },
    layersVisible: [MegMapLayerType.LANE_GROUP_POLYGON] as MegMapLayerType[],
  }),
  actions: {
    async drawAllLayerData() {
      if (!this.megmapDataset) {
        return
      }

      // draw layer
      for (const layerType of this.layersVisible) {
        await this.drawLayerData(layerType)
      }
    },
    async drawLayerData(layerType: MegMapLayerType, customData: any = null) {
      if (!this.megmapDataset) {
        return
      }
      const layerDataset =
        this.megmapDataset.layers[layerType as MegMapLayerType]

      if (
        layerDataset.isAlldataLoaded() &&
        !this.isLocalLoading[layerType as MegMapLayerType]
      ) {
        return
      }

      const renderedData = await layerDataset.getRenderedData(customData)
      if (!renderedData || Object.keys(renderedData).length === 0) {
        return
      }

      const currentLayerData =
        this.layerRenderedData[layerType as MegMapLayerType]

      // 添加renderedData中的新元素到layerData[layerType]
      for (const id in renderedData) {
        if (!currentLayerData.hasOwnProperty(id)) {
          currentLayerData[id] = renderedData[id]
        }
      }

      // 删除layerData[layerType]中不在renderedData中的元素
      if (customData === null) {
        for (const id in currentLayerData) {
          if (!renderedData.hasOwnProperty(id)) {
            delete currentLayerData[id]
          }
        }
      }
    },
  },
  getters: {
    megmapType(): string {
      return this.megmapDataset?.megMapInfo?.mapType ?? ''
    },
  },
})
