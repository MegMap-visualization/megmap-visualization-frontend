<script lang="ts" setup>
import { Operation, LocationInformation } from '@element-plus/icons-vue'
import '@amap/amap-jsapi-types'

import { useMegMapStore } from '@store/megmap'
import { useDrawToolStore } from '@store/draw-tool'
import { useWlxVisStore } from '@store/wlx-vis'
import { MegMapLayerType, IRenderedData } from '@interfaces/megmap-layer'
import { isDark } from '~/composables'

import copyTextToClipboard from '@utils/clipboard'
import {
  setRenderedDataStyle,
  resetRenderedDataStyle,
} from '@services/megmap-layer'
import { useCoordQueryStore } from '@store/coord-query'

const megmapStore = useMegMapStore()
const drawToolStore = useDrawToolStore()
const wlxVisStore = useWlxVisStore()
const coordQueryStore = useCoordQueryStore()

// data
// mapref
const megmapRef = ref()
const mapBoundPolyLine = ref()
const mouseToolObj = ref()

// layer visible config
const isSatelliteVisible = ref(true)
const isRoadNetVisible = ref(false)
const isTrafficVisible = ref(false)
const mapFeatures = ref(['road', 'building', 'point', 'bg'])
const mapStyle = ref('amap://styles/fresh')

const isOpenLayerConfig = ref(false)
const isDisabledLyaerConfig = ref(true)
const checkAllForMegMapLayerType = ref(false)
const indeterminateForMegMapLayerType = ref(false)
const megmapLayerDescMap = {
  [MegMapLayerType.LANE_GROUP_POLYGON]: '路网轮廓',
  [MegMapLayerType.LANE_BOUNDARY]: '车道边界线',
  [MegMapLayerType.LANE]: '车道信息',
  [MegMapLayerType.BASELINE_PATH]: '车道中心线',
  [MegMapLayerType.REFERENCE_LINE]: '参考线',
  [MegMapLayerType.INTERSECTION]: '路口',
  [MegMapLayerType.STOP_LINE]: '停止线',
  [MegMapLayerType.CROSSWALK]: '人行横道',
  [MegMapLayerType.TRAFFIC_LIGHT]: '红绿灯',
  [MegMapLayerType.LANE_CONNECTOR]: '车道连接处',
}
const megmapLayerDesc: Ref<Array<{ name: string; value: MegMapLayerType }>> =
  ref([])

const mapBounds: Ref<[number, number][] | null> = ref(null)

// info diaglog
const isOpenedInfoDialog = ref(false)
const infoDialogTitle = ref('')
const currDispalyedInfo = ref<Record<string, any>>({})

// define emits
const emit = defineEmits(['after-init'])

// init amap
const megviiPoint = [116.305225, 39.982383] as AMap.Vector2
const initZoom = 18

// methods
const handleInit = (e: AMap.Map) => {
  emit('after-init', megmapRef.value?.$$getInstance() as AMap.Map)
}

const updateCheckAllState = () => {
  if (megmapStore.layersVisible.length === 0) {
    checkAllForMegMapLayerType.value = false
    indeterminateForMegMapLayerType.value = false
  } else if (
    megmapStore.layersVisible.length === megmapLayerDesc.value.length
  ) {
    checkAllForMegMapLayerType.value = true
    indeterminateForMegMapLayerType.value = false
  } else {
    indeterminateForMegMapLayerType.value = true
  }
}

const handleMegMapLayerChange = (val: any) => {
  const checkedCount = val.length
  checkAllForMegMapLayerType.value =
    checkedCount === megmapLayerDesc.value.length
  indeterminateForMegMapLayerType.value =
    checkedCount > 0 && checkedCount < megmapLayerDesc.value.length
}

const handleMegMapLayerCheckAll = (val: any) => {
  megmapStore.layersVisible = val
    ? megmapLayerDesc.value.map((v) => v.value)
    : []
  indeterminateForMegMapLayerType.value = false
}

const dispalyObjectInfo = (title: string, renderedData: IRenderedData) => {
  isOpenedInfoDialog.value = true
  currDispalyedInfo.value = renderedData.dispalyedData
  infoDialogTitle.value = title
}

const handleMapDragging = async () => {
  if (!megmapRef.value) {
    return
  }
  await megmapStore.drawAllLayerData()
}

const handleLaneGroupPolygonMouseMove = (
  renderedData: IRenderedData,
  layerType: MegMapLayerType,
  mode: 'moveover' | 'moveout',
) => {
  const layerRenderedData = megmapStore.layerRenderedData[layerType]

  renderedData?.pres?.forEach((preId: string) => {
    if (!layerRenderedData[preId]) {
      return
    }
    if (mode === 'moveover') {
      setRenderedDataStyle(
        layerRenderedData[preId],
        '#F0FFFF',
        null,
        null,
        null,
        null,
        0.5,
        null,
      )
    } else {
      resetRenderedDataStyle(layerRenderedData[preId])
    }
  })
  renderedData?.sucs?.forEach((sucId: string) => {
    if (!layerRenderedData[sucId]) {
      return
    }
    if (mode === 'moveover') {
      setRenderedDataStyle(
        layerRenderedData[sucId],
        '#00FF0F',
        null,
        null,
        null,
        null,
        0.5,
        null,
      )
    } else {
      resetRenderedDataStyle(layerRenderedData[sucId])
    }
  })
}

const handleLanePolygonMouseMove = (
  renderedData: IRenderedData,
  mode: 'moveover' | 'moveout',
) => {
  const laneRefColorMap = {
    pres: '#F0FFFF',
    sucs: '#00FF0F',
    rightSameNeighbors: '#FFC107',
    leftSameNeighbors: '#9C27B0',
    rightOppositeNeighbors: '#E91E63',
    leftOppositeNeighbors: '#FF5722',
  } as Record<string, string>

  const layerRenderedData = megmapStore.layerRenderedData[MegMapLayerType.LANE]
  const laneConnectorRenderedData =
    megmapStore.layerRenderedData[MegMapLayerType.LANE_CONNECTOR]

  Object.keys(laneRefColorMap).forEach((key: string) => {
    if (!renderedData[key as keyof IRenderedData]) {
      return
    }
    ;(renderedData[key as keyof IRenderedData] as string[]).forEach(
      (laneUid: string) => {
        if (
          !layerRenderedData[laneUid] &&
          !laneConnectorRenderedData[laneUid]
        ) {
          return
        }
        if (mode === 'moveover') {
          if (layerRenderedData[laneUid]) {
            setRenderedDataStyle(
              layerRenderedData[laneUid],
              laneRefColorMap[key],
              null,
              null,
              null,
              null,
              0.5,
              null,
            )
          } else {
            setRenderedDataStyle(
              laneConnectorRenderedData[laneUid],
              laneRefColorMap[key],
              null,
              null,
              null,
              null,
              0.5,
              null,
            )
          }
        } else {
          if (layerRenderedData[laneUid]) {
            resetRenderedDataStyle(layerRenderedData[laneUid])
          } else {
            resetRenderedDataStyle(laneConnectorRenderedData[laneUid])
          }
        }
      },
    )
  })

  const objSigJucColorMap = {
    objectReferences: '#60FF8B',
    signalReferences: '#F44336',
    junctionReferences: '#9E9E9E',
  } as Record<string, string>
  const objSigJucRenderedDataMap = {
    objectReferences: [
      megmapStore.layerRenderedData[MegMapLayerType.STOP_LINE],
      megmapStore.layerRenderedData[MegMapLayerType.CROSSWALK],
    ],
    signalReferences: [
      megmapStore.layerRenderedData[MegMapLayerType.TRAFFIC_LIGHT],
    ],
    junctionReferences: [
      megmapStore.layerRenderedData[MegMapLayerType.INTERSECTION],
    ],
  } as Record<string, Array<Record<string, IRenderedData>>>

  Object.keys(objSigJucColorMap).forEach((key: string) => {
    if (!renderedData[key as keyof IRenderedData]) {
      return
    }
    ;(renderedData[key as keyof IRenderedData] as string[]).forEach(
      (ref: string) => {
        objSigJucRenderedDataMap[key].forEach((renderedDataRecord) => {
          if (!renderedDataRecord[ref]) {
            return
          }
          if (mode === 'moveover') {
            setRenderedDataStyle(
              renderedDataRecord[ref],
              objSigJucColorMap[key],
              null,
              null,
              null,
              null,
              0.5,
              null,
            )
          } else {
            resetRenderedDataStyle(renderedDataRecord[ref])
          }
        })
      },
    )
  })
}

const handleLayerObjMouseOver = (
  renderedData: IRenderedData,
  layerType: MegMapLayerType | null = null,
) => {
  setRenderedDataStyle(
    renderedData,
    '#00FFFF',
    null,
    null,
    null,
    null,
    0.5,
    null,
  )

  if (layerType === null) {
    return
  }

  switch (layerType) {
    case MegMapLayerType.REFERENCE_LINE:
    case MegMapLayerType.LANE_GROUP_POLYGON:
      handleLaneGroupPolygonMouseMove(renderedData, layerType, 'moveover')
      break
    case MegMapLayerType.LANE_CONNECTOR:
    case MegMapLayerType.LANE:
      handleLanePolygonMouseMove(renderedData, 'moveover')
      break
  }
}

const handleLayerObjMouseOut = (
  renderedData: IRenderedData,
  layerType: MegMapLayerType | null = null,
) => {
  resetRenderedDataStyle(renderedData)

  if (layerType === null) {
    return
  }

  switch (layerType) {
    case MegMapLayerType.LANE_GROUP_POLYGON:
    case MegMapLayerType.REFERENCE_LINE:
      handleLaneGroupPolygonMouseMove(renderedData, layerType, 'moveout')
      break
    case MegMapLayerType.LANE_CONNECTOR:
    case MegMapLayerType.LANE:
      handleLanePolygonMouseMove(renderedData, 'moveout')
      break
  }
}

const handleLayerEleInit = (
  key: string | number,
  val: AMap.Polygon | AMap.Polyline,
  layerType: MegMapLayerType,
) => {
  megmapStore.layerElements[layerType][key] = val
}

const copyInfo = (val: string) => {
  copyTextToClipboard(val)
  ElNotification({
    message: '已复制到剪切板',
    type: 'success',
    duration: 1000,
  })
}

const focusMegMap = () => {
  if (megmapStore.megmapDataset?.mapBounds) {
    mapBounds.value = [
      ...megmapStore.megmapDataset.mapBounds,
      megmapStore.megmapDataset.mapBounds[0],
    ]
    nextTick(() => {
      ;(megmapRef.value?.$$getInstance() as AMap.Map).setFitView(
        [mapBoundPolyLine.value.$$getInstance() as AMap.Polyline],
        true,
      )
    })
  } else {
    nextTick(() => {
      ;(megmapRef.value?.$$getInstance() as AMap.Map).setFitView()
    })
  }
}

// watchers
watch(
  () => megmapStore.layersVisible,
  () => {
    if (!megmapRef.value) {
      return
    }
    updateCheckAllState()
    const loading = ElLoading.service({
      text: '加载地图数据中',
      background: 'rgba(0, 0, 0, 0.5)',
    })
    megmapStore.drawAllLayerData().then(() => {
      loading.close()
    })
  },
)

watch(
  () => megmapStore.megmapDataset,
  (val) => {
    if (!val) {
      isDisabledLyaerConfig.value = true
      return
    }
    isDisabledLyaerConfig.value = false

    if (val.mapBounds) {
      mapBounds.value = [...val.mapBounds, val.mapBounds[0]]
      nextTick(() => {
        ;(megmapRef.value?.$$getInstance() as AMap.Map).setFitView(
          [mapBoundPolyLine.value.$$getInstance() as AMap.Polyline],
          true,
        )
      })
    }

    megmapLayerDesc.value = Object.keys(val.layers).map((key) => ({
      name: megmapLayerDescMap[key as MegMapLayerType],
      value: key as MegMapLayerType,
    }))

    if (val.megMapInfo.mapType === 'memo') {
      handleMegMapLayerCheckAll(true)
    }

    isOpenLayerConfig.value = true
    ElNotification.warning({
      message: '请选择需要显示的数据层',
      duration: 2000,
    })

    const loading = ElLoading.service({
      text: '加载地图数据中',
      background: 'rgba(0, 0, 0, 0.5)',
    })
    megmapStore.drawAllLayerData().then(() => {
      loading.close()
    })
  },
  { immediate: true },
)

watch(mouseToolObj, (val) => {
  if (!val) {
    return
  }
  drawToolStore.mouseToolObj = val
})

watch(isDark, (val) => {
  if (val) {
    mapStyle.value = 'amap://styles/dark'
  } else {
    mapStyle.value = 'amap://styles/fresh'
  }
})
</script>

<template>
  <div class="map-page-container" h="full" w="full">
    <el-amap
      ref="megmapRef"
      :center="megviiPoint"
      :zoom="initZoom"
      :zooms="[0, 100]"
      :mapStyle="mapStyle"
      :features="mapFeatures"
      @init="handleInit"
      @dragend="handleMapDragging"
    >
      <el-amap-layer-satellite :visible="isSatelliteVisible" />
      <el-amap-layer-road-net :visible="isRoadNetVisible" />
      <el-amap-layer-traffic :visible="isTrafficVisible" />

      <el-amap-mouse-tool
        ref="mouseToolObj"
        v-if="drawToolStore.mouseToolOpened"
        :type="drawToolStore.mouseToolType"
        :auto-clear="false"
        @draw="drawToolStore.mouseDraw"
      />

      <!-- wlx -->
      <el-amap-polyline
        v-if="wlxVisStore.isVisible"
        v-for="v in wlxVisStore.heatmapRenderDataList"
        :key="`wlx_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-opacity="v.strokeOpacity"
        :stroke-style="v.strokeStyle"
        :extra-options="{ cursor: 'pointer' }"
        @click="dispalyObjectInfo('万里行轨迹', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!--coord query-->
      <el-amap-marker
        v-if="coordQueryStore.isVisible"
        v-for="r in coordQueryStore.results"
        :key="r.id"
        :position="r.path"
        :draggable="false"
        @click="dispalyObjectInfo('坐标查询', r)"
        @init="
          (marker: AMap.Marker) => {
            megmapRef.$$getInstance().setFitView([marker], true)
          }
        "
      ></el-amap-marker>

      <!-- bounds -->
      <el-amap-polyline
        ref="mapBoundPolyLine"
        v-if="mapBounds !== null"
        :visible="mapBounds !== null"
        :path="mapBounds"
        stroke-color="#00eeff"
        :stroke-weight="3"
      />

      <!-- lane group polygon layer -->
      <el-amap-polygon
        v-if="
          megmapStore.layersVisible.includes(MegMapLayerType.LANE_GROUP_POLYGON)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.LANE_GROUP_POLYGON],
        )"
        :key="`lane_group_polygon_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :fill-opacity="v.fillOpacity"
        :fill-color="v.color"
        :stroke-weight="v.strokeWeight"
        :extra-options="{ cursor: 'pointer' }"
        @click="dispalyObjectInfo('车道分组', v)"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(
              v.id,
              polygon,
              MegMapLayerType.LANE_GROUP_POLYGON,
            )
          }
        "
        @mouseover="
          handleLayerObjMouseOver(v, MegMapLayerType.LANE_GROUP_POLYGON)
        "
        @mouseout="
          handleLayerObjMouseOut(v, MegMapLayerType.LANE_GROUP_POLYGON)
        "
      />

      <!-- reference line layer -->
      <el-amap-polyline
        v-if="
          megmapStore.layersVisible.includes(MegMapLayerType.REFERENCE_LINE)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.REFERENCE_LINE],
        )"
        :key="`reference_line_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-opacity="v.strokeOpacity"
        :stroke-style="v.strokeStyle"
        :show-dir="v.showDir || false"
        :extra-options="{ cursor: 'pointer', dirColor: v.dirColor }"
        @init="
          (polyline: AMap.Polyline) => {
            handleLayerEleInit(v.id, polyline, MegMapLayerType.REFERENCE_LINE)
          }
        "
        @click="dispalyObjectInfo('参考线', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- lane boundary layer -->
      <el-amap-polyline
        :visible="
          megmapStore.layersVisible.includes(MegMapLayerType.LANE_BOUNDARY)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.LANE_BOUNDARY],
        )"
        :key="`lane_boundary_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight || 1"
        :stroke-style="v.strokeStyle || 'solid'"
        :stroke-opacity="v.strokeOpacity"
        :strokeDasharray="[20, 15]"
        :show-dir="v.showDir || false"
        :extra-options="{ cursor: 'pointer', dirColor: v.dirColor }"
        @init="
          (polyline: AMap.Polyline) => {
            handleLayerEleInit(v.id, polyline, MegMapLayerType.LANE_BOUNDARY)
          }
        "
        @click="dispalyObjectInfo('车道边界', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- lane layer -->
      <el-amap-polygon
        :visible="megmapStore.layersVisible.includes(MegMapLayerType.LANE)"
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.LANE],
        )"
        :key="`lane_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :fill-opacity="v.fillOpacity"
        :fill-color="v.color"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(v.id, polygon, MegMapLayerType.LANE)
          }
        "
        @click="dispalyObjectInfo('车道', v)"
        @mouseover="handleLayerObjMouseOver(v, MegMapLayerType.LANE)"
        @mouseout="handleLayerObjMouseOut(v, MegMapLayerType.LANE)"
      />

      <!-- baseline layer -->
      <el-amap-polyline
        :visible="
          megmapStore.layersVisible.includes(MegMapLayerType.BASELINE_PATH)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.BASELINE_PATH],
        )"
        :key="`baseline_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-style="v.strokeStyle"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polyline: AMap.Polyline) => {
            handleLayerEleInit(v.id, polyline, MegMapLayerType.BASELINE_PATH)
          }
        "
        @click="dispalyObjectInfo('车道中心线', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- intersection layer -->
      <el-amap-polygon
        :visible="
          megmapStore.layersVisible.includes(MegMapLayerType.INTERSECTION)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.INTERSECTION],
        )"
        :key="`intersection_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-style="v.strokeStyle"
        :stroke-opacity="v.strokeOpacity"
        :fill-color="v.color"
        :fill-opacity="v.fillOpacity"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(v.id, polygon, MegMapLayerType.INTERSECTION)
          }
        "
        @click="dispalyObjectInfo('路口', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- stopline layer -->
      <el-amap-polyline
        :visible="megmapStore.layersVisible.includes(MegMapLayerType.STOP_LINE)"
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.STOP_LINE],
        )"
        :key="`stopline_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-style="v.strokeStyle"
        :stroke-opacity="v.strokeOpacity"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polyline: AMap.Polyline) => {
            handleLayerEleInit(v.id, polyline, MegMapLayerType.STOP_LINE)
          }
        "
        @click="dispalyObjectInfo('停止线', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- crosswalk layer -->
      <el-amap-polygon
        :visible="megmapStore.layersVisible.includes(MegMapLayerType.CROSSWALK)"
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.CROSSWALK],
        )"
        :key="`crosswalk_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :stroke-weight="v.strokeWeight"
        :stroke-style="v.strokeStyle"
        :stroke-opacity="v.strokeOpacity"
        :fill-color="v.color"
        :fill-opacity="v.fillOpacity"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(v.id, polygon, MegMapLayerType.CROSSWALK)
          }
        "
        @click="dispalyObjectInfo('人行横道', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />

      <!-- lane connector layer -->
      <el-amap-polygon
        :visible="
          megmapStore.layersVisible.includes(MegMapLayerType.LANE_CONNECTOR)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.LANE_CONNECTOR],
        )"
        :key="`lane_connector_polygon_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :fill-opacity="v.fillOpacity"
        :fill-color="v.color"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(v.id, polygon, MegMapLayerType.LANE_CONNECTOR)
          }
        "
        @click="dispalyObjectInfo('车道连接处', v)"
        @mouseover="handleLayerObjMouseOver(v, MegMapLayerType.LANE_CONNECTOR)"
        @mouseout="handleLayerObjMouseOut(v, MegMapLayerType.LANE_CONNECTOR)"
      />

      <!-- traffic light layer -->
      <el-amap-polygon
        :visible="
          megmapStore.layersVisible.includes(MegMapLayerType.TRAFFIC_LIGHT)
        "
        v-for="v in Object.values(
          megmapStore.layerRenderedData[MegMapLayerType.TRAFFIC_LIGHT],
        )"
        :key="`lane_connector_polygon_${v.id}`"
        :draggable="false"
        :editable="false"
        :path="v.path"
        :stroke-color="v.color"
        :fill-opacity="v.fillOpacity"
        :fill-color="v.color"
        :extra-options="{ cursor: 'pointer' }"
        @init="
          (polygon: AMap.Polygon) => {
            handleLayerEleInit(v.id, polygon, MegMapLayerType.TRAFFIC_LIGHT)
          }
        "
        @click="dispalyObjectInfo('红绿灯', v)"
        @mouseover="handleLayerObjMouseOver(v)"
        @mouseout="handleLayerObjMouseOut(v)"
      />
    </el-amap>
  </div>

  <div class="config-affix-container">
    <div class="map-config-drawer">
      <el-button
        size="large"
        type="info"
        :icon="Operation"
        circle
        plain
        @click="isOpenLayerConfig = true"
      />
      <el-drawer
        @closed="isOpenLayerConfig = false"
        :model-value="isOpenLayerConfig"
        :close-on-click-modal="false"
        :modal="false"
        modal-class="layer-config-drawer"
        size="25%"
        title="可视化配置"
        style="pointer-events: auto"
      >
        <el-row class="mb-5 flex items-center">
          <el-col :span="4">图层设置</el-col>
          <el-col :span="20">
            <div class="flex justify-left" ml="20px">
              <el-checkbox
                v-model="isSatelliteVisible"
                label="🛰️卫星"
                size="large"
              />
              <el-checkbox
                v-model="isRoadNetVisible"
                label="🗺️路网"
                size="large"
              />
              <el-checkbox
                v-model="isTrafficVisible"
                label="🚥交通流量"
                size="large"
              />
            </div>
          </el-col>
        </el-row>
        <el-row class="mb-5 flex items-center">
          <el-col :span="4">基础图层要素</el-col>
          <el-col :span="20">
            <el-checkbox-group
              v-model="mapFeatures"
              class="flex justify-left"
              ml="20px"
            >
              <el-checkbox key="road" label="road">🔴道路</el-checkbox>
              <el-checkbox key="point" label="point">🟡兴趣点</el-checkbox>
              <el-checkbox key="building" label="building">
                🔵建筑物
              </el-checkbox>
              <el-checkbox key="bg" label="bg">🟤区域面</el-checkbox>
            </el-checkbox-group>
          </el-col>
        </el-row>
        <el-row class="flex items-center" v-if="!isDisabledLyaerConfig">
          <el-col :span="4">MegMap数据层选择</el-col>
          <el-col :span="20">
            <div ml="20px">
              <div class="flex justify-left">
                <el-checkbox
                  v-model="checkAllForMegMapLayerType"
                  :indeterminate="indeterminateForMegMapLayerType"
                  @change="handleMegMapLayerCheckAll"
                >
                  选择全部
                </el-checkbox>
              </div>

              <el-checkbox-group
                v-model="megmapStore.layersVisible"
                @change="handleMegMapLayerChange"
                class="flex justify-left flex-wrap"
              >
                <el-checkbox
                  v-for="item in megmapLayerDesc"
                  :key="item.name"
                  :label="item.value"
                >
                  {{ item.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-col>
        </el-row>
      </el-drawer>
    </div>

    <div class="localization-button">
      <el-button
        size="large"
        type="info"
        :icon="LocationInformation"
        circle
        plain
        @click="focusMegMap"
      />
    </div>
  </div>

  <div class="info-dialog">
    <el-dialog
      :title="`${infoDialogTitle}信息查看`"
      v-model="isOpenedInfoDialog"
      :modal="false"
      :close-on-click-modal="false"
      :lock-scroll="false"
      width="25%"
      modal-class="info-dialog-modal"
      style="pointer-events: auto"
      align-center
      draggable
      center
    >
      <el-scrollbar height="400px">
        <el-row v-for="v in Object.entries(currDispalyedInfo)" mb="10px">
          <el-col
            :span="10"
            cursor="pointer"
            font="bold"
            @click="copyInfo(v[0])"
          >
            {{ v[0] }}
          </el-col>
          <el-col
            :span="14"
            cursor="pointer"
            @click="
              copyInfo(v[1] === null || v[1] === undefined ? 'Null' : v[1])
            "
          >
            {{ v[1] === null || v[1] === undefined ? 'Null' : v[1] }}
          </el-col>
        </el-row>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.map-config-drawer {
  position: fixed;
  right: 40px;
  top: 100px;
  z-index: 1000;
}
.layer-config-drawer {
  pointer-events: none;
}
.custom-header {
  .el-checkbox {
    display: flex;
    height: unset;
  }
}
.info-dialog-modal {
  pointer-events: none;
}
.localization-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  z-index: 1000;
}
</style>
