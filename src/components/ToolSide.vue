<script lang="ts" setup>
import {
  MapLocation,
  ArrowRightBold,
  ArrowLeftBold,
  Search,
  Edit,
  Check,
} from '@element-plus/icons-vue'
import '@amap/amap-jsapi-types'

import { useToolSideStore } from '@store/tool-side'

const toolSideStore = useToolSideStore()
</script>

<template>
  <!-- 可视化本地地图 -->
  <local-map-loader
    :is-opened="toolSideStore.isLocalMapLoaderVisible"
    @closed="toolSideStore.isLocalMapLoaderVisible = false"
  />
  <!-- 在线地图列表 -->
  <online-map-list
    :is-opened="toolSideStore.isOnlineMapListVisible"
    @closed="toolSideStore.isOnlineMapListVisible = false"
  />
  <!-- 万里行轨迹 -->
  <wlx-vis
    :is-opened="toolSideStore.isWLXVisible"
    @closed="toolSideStore.isWLXVisible = false"
  />
  <!-- 坐标查询 -->
  <coordinate-query-tool
    :is-opened="toolSideStore.isCoordinateQueryVisible"
    @closed="toolSideStore.isCoordinateQueryVisible = false"
  />
  <!-- 地图元素查询 -->
  <ele-query-tool
    :is-opened="toolSideStore.isEleQueryVisible"
    @closed="toolSideStore.isEleQueryVisible = false"
  />
  <!-- 位置查询 -->
  <location-query-tool
    :is-opened="toolSideStore.isLocationQueryVisible"
    @closed="toolSideStore.isLocationQueryVisible = false"
  />
  <!-- 车道关键点查询 -->
  <lane-key-point-query-tool
    :is-opened="toolSideStore.isLaneKeyPointQueryVisible"
    @closed="toolSideStore.isLaneKeyPointQueryVisible = false"
  />
  <!-- 从文件绘制 -->
  <draw-from-file-tool
    :is-opened="toolSideStore.isDrawFromFileVisible"
    @closed="toolSideStore.isDrawFromFileVisible = false"
  />
  <!-- 绘制并拾取坐标 -->
  <draw-and-pick-coordinate-tool
    :is-opened="toolSideStore.isDrawAndPickCoordinateVisible"
    @closed="toolSideStore.isDrawAndPickCoordinateVisible = false"
  />
  <!-- 测试结果验证 -->
  <test-result-validation-tool
    :is-opened="toolSideStore.isTestResultValidationVisible"
    @closed="toolSideStore.isTestResultValidationVisible = false"
  />
  <!-- 地图连通性验证 -->
  <map-connectivity-validation-tool
    :is-opened="toolSideStore.isMapConnectivityValidationVisible"
    @closed="toolSideStore.isMapConnectivityValidationVisible = false"
  />
  <!-- 路径规划验证 -->
  <path-planning-validation-tool
    :is-opened="toolSideStore.isPathPlanningValidationVisible"
    @closed="toolSideStore.isPathPlanningValidationVisible = false"
  />

  <el-menu default-active="2" :collapse="toolSideStore.isCollapse">
    <el-menu-item
      index="0"
      @click="toolSideStore.isCollapse = !toolSideStore.isCollapse"
    >
      <el-icon v-if="toolSideStore.isCollapse"><arrow-right-bold /></el-icon>
      <div v-else>
        <el-icon><arrow-left-bold /></el-icon>
        <span>折叠菜单</span>
      </div>
    </el-menu-item>

    <el-sub-menu index="1">
      <template #title>
        <el-icon><map-location /></el-icon>
        <span>地图管理</span>
      </template>
      <el-menu-item
        index="1-0"
        @click="toolSideStore.isLocalMapLoaderVisible = true"
      >
        <i class="inline-flex" i="ep-folder-opened" m="r-2"></i>
        MegMap查看
      </el-menu-item>
      <el-menu-item
        index="1-1"
        @click="toolSideStore.isOnlineMapListVisible = true"
      >
        <i class="inline-flex" i="ep-menu" m="r-2"></i>
        共享MegMap列表
      </el-menu-item>

      <el-menu-item index="1-2" @click="toolSideStore.isWLXVisible = true">
        <i class="inline-flex" i="ep-ship" m="r-2"></i>
        万里行轨迹
      </el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="2">
      <template #title>
        <el-icon><search /></el-icon>
        <span>查询工具</span>
      </template>
      <el-menu-item
        index="2-0"
        @click="toolSideStore.isCoordinateQueryVisible = true"
      >
        <i class="inline-flex" i="ep-location-filled" m="r-2"></i>
        坐标查询
      </el-menu-item>
      <el-menu-item index="2-1" @click="toolSideStore.isEleQueryVisible = true">
        <i class="inline-flex" i="ep-flag" m="r-2"></i>
        地图元素查询
      </el-menu-item>
      <el-menu-item
        index="2-2"
        @click="toolSideStore.isLocationQueryVisible = true"
      >
        <i class="inline-flex" i="ep-compass" m="r-2"></i>
        位置查询
      </el-menu-item>
      <el-menu-item
        index="2-3"
        @click="toolSideStore.isLaneKeyPointQueryVisible = true"
      >
        <i class="inline-flex" i="ep-place" m="r-2"></i>
        车道关键点查询
      </el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="3">
      <template #title>
        <el-icon><edit /></el-icon>
        <span>绘制工具</span>
      </template>
      <el-menu-item
        index="3-0"
        @click="toolSideStore.isDrawFromFileVisible = true"
      >
        <i class="inline-flex" i="ep-folder-opened" m="r-2"></i>
        从文件绘制
      </el-menu-item>
      <el-menu-item
        index="3-1"
        @click="toolSideStore.isDrawAndPickCoordinateVisible = true"
      >
        <i class="inline-flex" i="ep-edit-pen" m="r-2"></i>
        绘制并拾取坐标
      </el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="4">
      <template #title>
        <el-icon><check /></el-icon>
        <span>结果验证工具</span>
      </template>
      <el-menu-item
        index="4-0"
        @click="toolSideStore.isTestResultValidationVisible = true"
      >
        <i class="inline-flex" i="ep-histogram" m="r-2"></i>
        测试结果验证
      </el-menu-item>
      <el-menu-item
        index="4-1"
        @click="toolSideStore.isMapConnectivityValidationVisible = true"
      >
        <i class="inline-flex" i="ep-guide" m="r-2"></i>
        地图连通性验证
      </el-menu-item>
      <el-menu-item
        index="4-2"
        @click="toolSideStore.isPathPlanningValidationVisible = true"
      >
        <i class="inline-flex" i="ep-van" m="r-2"></i>
        路径规划验证
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<style></style>

<style>
.tool-dialog-modal {
  pointer-events: none;
}
</style>
