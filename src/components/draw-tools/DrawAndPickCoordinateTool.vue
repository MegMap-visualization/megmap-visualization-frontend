<script setup lang="ts">
import { JsonViewer } from 'vue3-json-viewer'
import 'vue3-json-viewer/dist/index.css'

import { useDrawToolStore } from '@store/draw-tool'
import { MouseToolType } from '@interfaces/common'
import { isDark } from '@composables/dark'
import copyTextToClipboard from '@utils/clipboard'
import downloadObjectAsJson from '@utils/export-data'
import { getCurrentTime } from '@utils/date-string'

defineProps({
  isOpened: Boolean,
})
const emit = defineEmits(['closed'])
const result = ref<any>(null)

const drawToolStore = useDrawToolStore()

const drawData = (type: MouseToolType) => {
  result.value = null
  drawToolStore.mouseToolType = type
  drawToolStore.mouseToolObj?.$$open()
  emit('closed')
}

const copyKeyData = (key: string) => {
  if (!(key in result.value)) {
    return
  }
  copyTextToClipboard(JSON.stringify(result.value[key]))
  ElNotification({
    title: `复制${key}成功`,
    type: 'success',
  })
}

const copyData = async () => {
  await copyTextToClipboard(JSON.stringify(result.value))
  ElNotification({
    title: '复制成功',
    type: 'success',
  })
}

const exportData = () => {
  const fileName = `draw-result-${getCurrentTime()}.json`
  downloadObjectAsJson(result.value, fileName)
}

const emptyData = () => {
  result.value = null
  drawToolStore.mouseToolObj?.$$clear()
}

const handleClosed = () => {
  if (result.value) {
    result.value = null
    drawToolStore.mouseToolOpened = false
  }
}

const handleOpen = () => {
  drawToolStore.mouseToolOpened = true
  nextTick(() => {
    drawToolStore.mouseToolObj?.$$close(false)
  })
}

watch(
  () => drawToolStore.result,
  (val) => {
    if (val) {
      result.value = val
    }
  },
)
</script>

<template>
  <el-dialog
    title="拾取坐标"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    :center="true"
    @open="handleOpen"
    @close="$emit('closed')"
    @closed="handleClosed"
  >
    <el-row flex justify-center items-center mb="38px">
      <el-col :span="2" text-center>支持的功能</el-col>
      <el-col :span="22">
        <el-button plain size="large" @click="drawData('marker')">
          取点
        </el-button>
        <el-button plain size="large" @click="drawData('polyline')">
          绘制线
        </el-button>
        <el-button plain size="large" @click="drawData('polygon')">
          绘制多边形
        </el-button>
        <el-button plain size="large" @click="drawData('rectangle')">
          绘制矩形
        </el-button>
        <el-button plain size="large" @click="drawData('measureArea')">
          计算面积
        </el-button>
        <el-button plain size="large" @click="drawData('rule')">
          计算距离
        </el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col flex justify-center items-center v-if="result === null">
        <el-empty />
      </el-col>
      <el-col v-else>
        <el-scrollbar h="400px">
          <json-viewer
            @onKeyClick="copyKeyData"
            :value="result"
            :theme="isDark ? 'dark' : 'light'"
            :expand-depth="2"
            sort
          />
        </el-scrollbar>
      </el-col>
    </el-row>
    <template #footer>
      <el-button
        :disabled="result === null"
        type="primary"
        size="large"
        @click="copyData"
      >
        复制结果
      </el-button>
      <el-button
        :disabled="result === null"
        type="primary"
        size="large"
        @click="exportData"
      >
        导出结果
      </el-button>
      <el-button
        :disabled="result === null"
        type="danger"
        size="large"
        @click="emptyData"
      >
        清空绘制
      </el-button>
    </template>
  </el-dialog>
</template>
