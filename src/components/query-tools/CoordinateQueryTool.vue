<script setup lang="ts">
import { useCoordQueryStore } from '@store/coord-query'

const coordQueryStore = useCoordQueryStore()

const megmap = inject('megmap')

// props
defineProps({
  isOpened: Boolean,
})

// data
const x = ref()
const y = ref()
const zone = ref()
const coordType = ref('utm')

const handleConfirm = () => {
  if (!x || !y) {
    ElNotification({
      title: '请输入坐标',
      type: 'warning',
    })
  }
  if (coordType.value === 'utm' && !zone) {
    ElNotification({
      title: '请输入UTM Zone ID',
      type: 'warning',
    })
  }
  coordQueryStore.addCoord(coordType.value, [x.value, y.value], zone.value)
  coordQueryStore.isVisible = true
}
</script>

<template>
  <el-dialog
    title="坐标查询"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    width="30%"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    center
    @close="$emit('closed')"
  >
    <el-row mb="30px" class="items-center">
      <el-col :span="24">
        <el-radio-group v-model="coordType">
          <el-radio label="wgs84">WGS84</el-radio>
          <el-radio label="gcj02">GCJ02</el-radio>
          <el-radio label="utm">UTM</el-radio>
        </el-radio-group>
      </el-col>
    </el-row>
    <el-row mb="30px" class="items-center">
      <el-col :span="4">
        <span mr="10px" v-if="coordType !== 'utm'">经度</span>
        <span mr="10px" v-else>X</span>
      </el-col>
      <el-col :span="20">
        <el-input-number
          v-model="x"
          :controls="false"
          size="large"
          placeholder="请输入坐标"
        />
      </el-col>
    </el-row>
    <el-row mb="30px" class="items-center">
      <el-col :span="4">
        <span mr="10px" v-if="coordType !== 'utm'">纬度</span>
        <span mr="10px" v-else>Y</span>
      </el-col>
      <el-col :span="20">
        <el-input-number
          v-model="y"
          :controls="false"
          size="large"
          placeholder="请输入坐标"
        />
      </el-col>
    </el-row>
    <el-row class="items-center" v-if="coordType === 'utm'">
      <el-col :span="4">
        <span mr="10px">UTM Zone ID</span>
      </el-col>
      <el-col :span="20">
        <el-input-number
          v-model="zone"
          :controls="false"
          size="large"
          placeholder="请输入ID"
        />
      </el-col>
    </el-row>
    <template #footer>
      <el-button @click="(x = null), (y = null), (zone = null)">
        重 置
      </el-button>
      <el-button type="primary" @click="handleConfirm">确 定</el-button>
      <el-button @click="$emit('closed')">取 消</el-button>
      <el-button type="danger" @click="coordQueryStore.clear()">
        清 空
      </el-button>
    </template>
  </el-dialog>
</template>

<style></style>
