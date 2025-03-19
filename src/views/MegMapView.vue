<script lang="ts" setup>
import '@amap/amap-jsapi-types'

const megmap = ref<AMap.Map>()
provide('megmap', megmap)
</script>

<template>
  <div class="flex main-container">
    <ToolSide />
    <MegMap
      @after-init="
        (map: AMap.Map) => {
          megmap = map
        }
      "
    />
  </div>
</template>

<style>
.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 5px);
}
</style>
