<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useMegMapStore } from '@store/megmap'
import { MegMapLayerType } from '@interfaces/megmap-layer'
import { setRenderedDataStyle } from '@services/megmap-layer'
import { tmpdir } from 'os'

// store
const megmapStore = useMegMapStore()

// props
defineProps({
  isOpened: Boolean,
})

// methods
const handleOpen = () => {}
const handleClosed = () => {}

// states
const queryToolRef = ref()
const ruleFormRef = ref()
interface RoadIdItem {
  key: number
  roadId: string
  sectionId: string | null
  laneId: string | null
}
interface ObjSigIdItem {
  key: number
  value: string
}
interface QueryIds {
  roadIds: RoadIdItem[]
  objSigIds: ObjSigIdItem[]
}
const queryIds = reactive<QueryIds>({
  roadIds: [{ key: 1, roadId: '', sectionId: '', laneId: '' }] as RoadIdItem[],
  objSigIds: [{ key: 1, value: '' }] as ObjSigIdItem[],
})
const validateRoadId = (rule: any, value: RoadIdItem, callback: any) => {
  if (!value.roadId) {
    for (const objSigId of queryIds.objSigIds) {
      if (objSigId.value && queryIds.roadIds.length === 1) {
        callback()
      }
    }
    callback(new Error('请输入Road Id'))
  }
  if (value.sectionId) {
    if (!/^(\d+)$/.test(value.sectionId)) {
      callback(new Error('Section Id必须为0或正整数'))
    }
  }
  if (value.laneId) {
    if (!/^[+-]?(\d+)$/.test(value.laneId)) {
      callback(new Error('Lane Id必须为整数'))
    }
  }
  callback()
}
const roadIdRules = [
  {
    validator: validateRoadId,
    trigger: ['blur', 'change'],
  },
]
const validateObjSigId = (rule: any, value: ObjSigIdItem, callback: any) => {
  if (!value.value) {
    for (const roadId of queryIds.roadIds) {
      if (roadId.roadId && queryIds.objSigIds.length === 1) {
        callback()
      }
    }
    callback(new Error('请输入Object / Signal Id'))
  }
  callback()
}
const objSigIdRules = [
  {
    validator: validateObjSigId,
    trigger: ['blur', 'change'],
  },
]

// methods
const addRoadIds = () => {
  queryIds.roadIds.push({
    key: Date.now(),
    roadId: '',
    sectionId: '',
    laneId: '',
  })
}
const deleteRoadIds = (idx: number) => {
  if (queryIds.roadIds.length === 1) {
    ElNotification({
      message: '至少保留一个车道查询',
      type: 'warning',
      duration: 1000,
    })
    return
  }
  queryIds.roadIds.splice(idx, 1)
}
const addObjSigIds = () => {
  queryIds.objSigIds.push({ key: Date.now(), value: '' })
}
const deleteObjSigIds = (idx: number) => {
  if (queryIds.objSigIds.length === 1) {
    ElNotification({
      message: '至少保留一个Object / Signal查询',
      type: 'warning',
      duration: 1000,
    })
    return
  }
  queryIds.objSigIds.splice(idx, 1)
}
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  queryIds.roadIds.splice(1, queryIds.roadIds.length - 1)
  queryIds.objSigIds.splice(1, queryIds.objSigIds.length - 1)
}
const queryRoadSection = (rslId: RoadIdItem) => {
  if (!megmapStore.layersVisible.includes(MegMapLayerType.LANE_GROUP_POLYGON))
    return []
  const roadSectionLayerRenderedData =
    megmapStore.layerRenderedData[MegMapLayerType.LANE_GROUP_POLYGON]
  const roadSectionLayerEles =
    megmapStore.layerElements[MegMapLayerType.LANE_GROUP_POLYGON]
  let mapEle = []
  for (const roadSectionId of Object.keys(roadSectionLayerRenderedData)) {
    const roadId = roadSectionId.split('_')[0]
    if (
      roadId === rslId.roadId ||
      roadSectionId === `${rslId.roadId}_${rslId.sectionId}`
    ) {
      mapEle.push(roadSectionLayerEles[roadSectionId]) // 后续用于setFitView
      roadSectionLayerRenderedData[roadSectionId].color = 'red'
      roadSectionLayerRenderedData[roadSectionId].fillOpacity = 0.5
      roadSectionLayerRenderedData[roadSectionId].strokeWeight = 8
    }
  }
  return mapEle
}
const queryReferenceLine = (rslId: RoadIdItem) => {
  if (!megmapStore.layersVisible.includes(MegMapLayerType.REFERENCE_LINE))
    return []
  const roadSectionLayerRenderedData =
    megmapStore.layerRenderedData[MegMapLayerType.REFERENCE_LINE]
  const roadSectionLayerEles =
    megmapStore.layerElements[MegMapLayerType.REFERENCE_LINE]
  let mapEle = []
  for (const roadSectionId of Object.keys(roadSectionLayerRenderedData)) {
    const roadId = roadSectionId.split('_')[0]
    if (
      roadId === rslId.roadId ||
      roadSectionId === `${rslId.roadId}_${rslId.sectionId}`
    ) {
      mapEle.push(roadSectionLayerEles[roadSectionId]) // 后续用于setFitView
      roadSectionLayerRenderedData[roadSectionId].color = 'red'
      roadSectionLayerRenderedData[roadSectionId].fillOpacity = 0.5
      roadSectionLayerRenderedData[roadSectionId].strokeWeight = 8
    }
  }
  return mapEle
}
const queryLane = async (rslId: RoadIdItem) => {
  if (
    !megmapStore.layersVisible.includes(MegMapLayerType.LANE) &&
    !megmapStore.layersVisible.includes(MegMapLayerType.LANE_BOUNDARY) &&
    !megmapStore.layersVisible.includes(MegMapLayerType.BASELINE_PATH)
  )
    return []

  const loading = ElLoading.service({
    text: '正在查询车道数据...',
  })
  let mapEle: Array<any> = []

  const queryLaneBoundary = async (queriedGids: number[]) => {
    if (megmapStore.layersVisible.includes(MegMapLayerType.LANE_BOUNDARY)) {
      const laneBoundaryDataset =
        megmapStore.megmapDataset?.layers[MegMapLayerType.LANE_BOUNDARY]
      const data = await laneBoundaryDataset?.getLocalData(queriedGids)
      megmapStore
        .drawLayerData(MegMapLayerType.LANE_BOUNDARY, data)
        .then(() => {
          const laneBoundaryLayerRenderedData =
            megmapStore.layerRenderedData[MegMapLayerType.LANE_BOUNDARY]
          const laneBoundaryLayerEles =
            megmapStore.layerElements[MegMapLayerType.LANE_BOUNDARY]
          for (const gid of queriedGids) {
            mapEle.push(laneBoundaryLayerEles[gid]) // 后续用于setFitView
            laneBoundaryLayerRenderedData[gid].color = 'red'
          }
        })
    }
  }

  const queriedLaneBoundaryGids = new Set<number>()

  if (megmapStore.layersVisible.includes(MegMapLayerType.LANE)) {
    const laneDataset = megmapStore.megmapDataset?.layers[MegMapLayerType.LANE]
    let queriedLaneUids: string[] = []
    for (const laneUid of laneDataset?.allIds || []) {
      if (
        laneUid.startsWith(rslId.roadId) ||
        laneUid.startsWith(`${rslId.roadId}_${rslId.sectionId}`) ||
        laneUid.startsWith(`${rslId.roadId}_${rslId.sectionId}_${rslId.laneId}`)
      ) {
        queriedLaneUids.push(laneUid)
      }
    }
    if (queriedLaneUids.length > 0) {
      const data = await laneDataset?.getLocalData(queriedLaneUids)
      for (const laneData of Object.values(data || {})) {
        queriedLaneBoundaryGids.add(laneData.leftBoundaryGid)
        queriedLaneBoundaryGids.add(laneData.rightBoundaryGid)
      }
      const laneLayerRenderedData =
        megmapStore.layerRenderedData[MegMapLayerType.LANE]
      const laneLayerEles = megmapStore.layerElements[MegMapLayerType.LANE]
      await megmapStore.drawLayerData(MegMapLayerType.LANE, data)
      for (const laneUid of queriedLaneUids) {
        mapEle.push(laneLayerEles[laneUid]) // 后续用于setFitView
        laneLayerRenderedData[laneUid].color = 'red'
      }
    }
  }

  if (megmapStore.layersVisible.includes(MegMapLayerType.BASELINE_PATH)) {
    const baselineDataset =
      megmapStore.megmapDataset?.layers[MegMapLayerType.BASELINE_PATH]
    let queriedLaneUids: string[] = []
    for (const laneUid of baselineDataset?.allIds || []) {
      if (
        laneUid.startsWith(rslId.roadId) ||
        laneUid.startsWith(`${rslId.roadId}_${rslId.sectionId}`) ||
        laneUid.startsWith(`${rslId.roadId}_${rslId.sectionId}_${rslId.laneId}`)
      ) {
        queriedLaneUids.push(laneUid)
      }
    }
    if (queriedLaneUids.length > 0) {
      const data = await baselineDataset?.getLocalData(queriedLaneUids)
      // for (const laneData of Object.values(data || {})) {
      //   queriedLaneBoundaryGids.add(laneData.leftBoundaryGid);
      //   queriedLaneBoundaryGids.add(laneData.rightBoundaryGid);
      // }
      await megmapStore.drawLayerData(MegMapLayerType.BASELINE_PATH, data)
      const baselineLayerRenderedData =
        megmapStore.layerRenderedData[MegMapLayerType.BASELINE_PATH]
      const baselineLayerEles =
        megmapStore.layerElements[MegMapLayerType.BASELINE_PATH]
      for (const laneUid of queriedLaneUids) {
        mapEle.push(baselineLayerEles[laneUid]) // 后续用于setFitView
        baselineLayerRenderedData[laneUid].color = 'red'
      }
    }
  }

  if (queriedLaneBoundaryGids.size > 0) {
    queryLaneBoundary(Array.from(queriedLaneBoundaryGids))
  }
  loading.close()
  return mapEle
}
const handleQuery = async () => {
  const { roadIds, objSigIds } = queryIds

  let mapEles: Array<any> = []
  for (const rslId of roadIds) {
    if (!rslId.roadId) continue
    mapEles = mapEles.concat(queryRoadSection(rslId))
    mapEles = mapEles.concat(queryReferenceLine(rslId))
    mapEles = mapEles.concat(await queryLane(rslId))
  }

  if (mapEles.length > 0)
    megmapStore.megmapDataset?.megmap.setFitView(mapEles, true)
}
const submitQuery = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      await handleQuery()
    } else {
      if (queryIds.roadIds.length === 1 && queryIds.objSigIds.length === 1) {
        ElNotification({
          message: '至少有一个查询条件',
          type: 'error',
          duration: 1000,
        })
        return false
      }
      ElNotification({
        message: '其他查询条件不能为空',
        type: 'error',
        duration: 1000,
      })
      return false
    }
  })
}
</script>

<template>
  <el-dialog
    title="地图元素查询"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    width="30%"
    ref="queryToolRef"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    center
    @open="handleOpen"
    @close="$emit('closed')"
    @closed="handleClosed"
  >
    <el-scrollbar max-height="600px">
      <el-form
        label-position="top"
        ref="ruleFormRef"
        label-width="100px"
        :model="queryIds"
      >
        <el-form-item
          :label="`Object / Signal 查询 ${index + 1}`"
          mb="18px"
          v-for="(objSigId, index) in queryIds.objSigIds"
          :key="objSigId.key"
          :prop="`objSigIds.${index}`"
          :rules="objSigIdRules"
        >
          <el-row w="55%">
            <el-col :span="21">
              <el-input
                v-model="objSigId.value"
                placeholder="Object / Signal Id"
              />
            </el-col>
            <el-col :span="3" class="text-center">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="deleteObjSigIds(index)"
              />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item
          :label="`车道查询 ${index + 1}`"
          v-for="(roadId, index) in queryIds.roadIds"
          :key="roadId.key"
          :rules="roadIdRules"
          :prop="`roadIds.${index}`"
          mb="18px"
        >
          <el-row>
            <el-col :span="6">
              <el-input v-model="roadId.roadId" placeholder="Road Id" />
            </el-col>
            <el-col :span="1" class="text-center">
              <span class="text-gray-500">-</span>
            </el-col>
            <el-col :span="6">
              <el-input v-model="roadId.sectionId" placeholder="Section Id" />
            </el-col>
            <el-col :span="1" class="text-center">
              <span class="text-gray-500">-</span>
            </el-col>
            <el-col :span="6">
              <el-input v-model="roadId.laneId" placeholder="Lane Id" />
            </el-col>
            <el-col :span="3" class="text-center">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="deleteRoadIds(index)"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <template #footer>
      <el-button @click="addRoadIds">+ 车道查询</el-button>
      <el-button @click="addObjSigIds">+ Object / Signal 查询</el-button>
      <el-button @click="resetForm(ruleFormRef)" type="danger">重置</el-button>
      <el-button @click="submitQuery(ruleFormRef)" type="primary">
        查询
      </el-button>
    </template>
  </el-dialog>
</template>

<style></style>
