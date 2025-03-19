<script setup lang="ts">
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
const locale = zhCn
</script>

<template>
  <el-config-provider namespace="ep" :locale="locale">
    <BaseHeader />
    <MegMapView />
  </el-config-provider>
</template>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}
</style>
