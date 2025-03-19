<script lang="ts" setup>
import { ElNotification } from 'element-plus'

import { useMegMapLoad } from '@composables/megmap-loader'
import copyTextToClipboard from '@utils/clipboard'
import { useOnlineMapListStore } from '@store/online-map-list'
import { useMegMapStore } from '@store/megmap'
import { IMegMapInfo } from '@interfaces/megmap-layer'
import { MegMapDataset } from '@services/megmap-dataset'

const onlineMapListStore = useOnlineMapListStore()

interface IOnlineMapTableRowData extends IMegMapInfo {
  isLoaded: boolean
}

// props
defineProps({
  isOpened: Boolean,
})

// inject
const megmap = inject<AMap.Map>('megmap')

// data
const serarchInput: Ref<string> = ref('')
const filterTableData = computed(() =>
  onlineMapListStore.onlineMapList
    .filter(
      (data) =>
        !serarchInput.value ||
        data.mapRemark
          .toLowerCase()
          .includes(serarchInput.value.toLowerCase()) ||
        data.mapMd5.toLowerCase().includes(serarchInput.value.toLowerCase()),
    )
    .map((data) => ({
      ...data,
      isLoaded: false,
    })),
)
const currentRowData: Ref<IOnlineMapTableRowData | null> = ref(null)
const megmapDataset: Ref<MegMapDataset | null> = ref(null)
let internalId: NodeJS.Timeout | null = null

// methods
// 加载地图列表
const handleOpen = async () => {
  await onlineMapListStore.fetchOnlineMapList()
  internalId = setInterval(async () => {
    await onlineMapListStore.fetchOnlineMapList()
  }, 10000)
}

const handleClosed = () => {
  if (internalId) {
    clearInterval(internalId)
  }
}

// 复制到剪切板
const handleCellClick = async (row: IMegMapInfo, column: any) => {
  if (column.property === undefined) {
    return
  }
  const { property } = column
  const _ = await copyTextToClipboard(
    row[property as keyof IMegMapInfo] as string,
  )
  ElNotification({
    message: '已复制到剪切板',
    type: 'success',
    duration: 1000,
  })
}

// 可视化地图
const handleLoadMap = async (rowData: IOnlineMapTableRowData) => {
  await useMegMapLoad(megmap, rowData, megmapDataset)
  if (currentRowData.value?.mapMd5 !== rowData.mapMd5) {
    if (currentRowData.value?.isLoaded) {
      currentRowData.value.isLoaded = false
    }
    rowData.isLoaded = true
    currentRowData.value = rowData
  }
}
</script>

<template>
  <el-dialog
    title="共享MegMap列表"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    center
    @open="handleOpen"
    @close="$emit('closed')"
    @closed="handleClosed"
  >
    <el-table
      :data="filterTableData"
      v-loading="onlineMapListStore.onlineMapListLoading"
      h="100"
      @cell-click="handleCellClick"
    >
      <el-table-column prop="mapType" class="cursor-pointer" label="地图类型" />
      <el-table-column
        prop="mapRemark"
        class="cursor-pointer"
        label="地图名称"
      />
      <el-table-column class="cursor-pointer" prop="mapMd5" label="地图MD5" />
      <el-table-column
        class="cursor-pointer"
        prop="mapS3Path"
        label="地图路径"
      />
      <el-table-column
        class="cursor-pointer"
        prop="availableLayers"
        label="地图数据层"
      />
      <el-table-column fixed="right" align="center" label="操作" width="150">
        <template #header>
          <el-input
            v-model="serarchInput"
            size="small"
            placeholder="输入搜索"
          />
        </template>
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            :disabled="scope.row.isLoaded"
            @click="handleLoadMap(scope.row)"
          >
            {{ scope.row.isLoaded ? '已加载' : '加载地图' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<style>
.ep-table__row .ep-table__cell {
  cursor: pointer;
  user-select: none;
}
</style>
