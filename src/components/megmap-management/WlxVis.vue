<script lang="ts" setup>
import { Delete } from '@element-plus/icons-vue'
import { ElLoading } from 'element-plus'

import { useWlxVisStore } from '@store/wlx-vis'
import { useToolSideStore } from '@store/tool-side'

const wlxVisStore = useWlxVisStore()
const toolSideStore = useToolSideStore()

// props
defineProps({
  isOpened: Boolean,
})

const defaultRange = computed(() => {
  const formatDate = (date: Date) => {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('')
  }
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
  return [formatDate(start), formatDate(end)] as [string, string]
})

const queryRanges = reactive([
  {
    key: 1,
    value: defaultRange.value as [string, string],
  },
])
const queryDates = ref<any>([])

const shortcuts = [
  {
    text: '近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// inject
const megmap = inject('megmap')

// methods

const handleConfirm = async () => {
  wlxVisStore.clear()

  const loading = ElLoading.service({
    lock: true,
    text: '正在加载轨迹数据',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  let dateRanges = toRaw(queryRanges)
    .filter((v) => {
      if (v.value[0] && v.value[1]) {
        return true
      }
      return false
    })
    .map((v) => {
      return v.value
    })

  let dates = toRaw(queryDates.value)

  let querStr = ''
  if (dates && dates.length > 0) {
    querStr = dates.join(';')
  }
  if (dateRanges.length > 0) {
    let rangeStr = ''
    dateRanges.forEach((v) => {
      rangeStr += `${v[0]}-${v[1]};`
    })
    if (querStr !== '') querStr += ';'
    querStr += rangeStr.slice(0, -1)
  }

  if (querStr === '') {
    await wlxVisStore.fetchHeatmapData()
  } else {
    await wlxVisStore.fetchHeatmapData(querStr)
  }

  if (wlxVisStore.heatmapRenderDataList.length === 0) {
    ElNotification({
      title: '提示',
      message: '无轨迹数据',
      type: 'warning',
    })
    loading.close()
    return
  }

  wlxVisStore.isVisible = true
  loading.close()

  nextTick(() => {
    ;(megmap as any).value.setFitView()
  })
}

const handleDeleteRange = (key: number) => {
  queryRanges.splice(
    queryRanges.findIndex((v) => v.key === key),
    1,
  )
}

const handleAddRange = () => {
  queryRanges.push({
    key: queryRanges.length + 1,
    value: ['', ''] as [string, string],
  })
}
</script>

<template>
  <el-card
    :class="
      'fixed z-9999 top-25 ' +
      (toolSideStore.isCollapse ? 'left-30' : 'left-60')
    "
    shadow="never"
    v-if="Object.keys(wlxVisStore.colorMap).length !== 0"
  >
    <div mb="15px">颜色映射</div>
    <div
      class="flex items-center justify-center"
      v-for="[k, v] in Object.entries(wlxVisStore.colorMap)"
      :key="k"
    >
      <div :style="{ color: v }" mb="15px">
        <i :style="{ textDecoration: 'line-through', color: v }">
          &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp
        </i>
        &nbsp
        {{ k }}
      </div>
    </div>
  </el-card>
  <el-dialog
    title="万里行轨迹可视化"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    center
    @open="handleConfirm"
    @close="$emit('closed')"
  >
    <el-row class="items-center" mb="30px" w="40%">
      <el-col :span="24">
        <span mr="35px">选择日期</span>
        <el-date-picker
          v-model="queryDates"
          type="dates"
          placeholder="请选择一个或多个日期"
          value-format="YYYYMMDD"
          :disabled-date="(date: Date) => date.getTime() > Date.now()"
        />
      </el-col>
    </el-row>

    <el-row
      class="items-center"
      mb="30px"
      w="90%"
      v-for="queryRange in queryRanges"
      :key="queryRange.key"
    >
      <el-col :span="24">
        <span mr="35px">时间范围</span>
        <el-date-picker
          v-model="queryRange.value"
          type="daterange"
          unlink-panels
          range-separator="到"
          start-placeholder="起始日期"
          end-placeholder="终止日期"
          value-format="YYYYMMDD"
          :shortcuts="shortcuts"
          :disabled-date="(date: Date) => date.getTime() > Date.now()"
        />
        <el-button
          ml="35px"
          circle
          type="danger"
          :icon="Delete"
          @click="handleDeleteRange(queryRange.key)"
        />
      </el-col>
    </el-row>

    <template #footer>
      <el-button @click="handleAddRange">增加范围过滤</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
      <el-button @click="$emit('closed')">取消</el-button>
      <el-button type="danger" @click="wlxVisStore.clear()">清空轨迹</el-button>
    </template>
  </el-dialog>
</template>

<style>
.ep-table__row .ep-table__cell {
  cursor: pointer;
  user-select: none;
}
</style>
