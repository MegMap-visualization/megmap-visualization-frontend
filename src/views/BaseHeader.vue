<script lang="ts" setup>
import { toggleDark } from '~/composables'
</script>

<template>
  <el-menu class="megmap-header" mode="horizontal" :ellipsis="false">
    <div class="flex items-center">
      <img src="@assets/logo.png" class="h-11 mt-1 ml-2" />
      <span class="text-xl font-bold ml-2">Map Visualization</span>
    </div>
    <div class="flex-grow" />
    <el-menu-item h="full" @click="toggleDark()">
      <button
        class="border-none w-full bg-transparent cursor-pointer"
        style="height: var(--ep-menu-item-height)"
      >
        <i inline-flex i="dark:ep-moon ep-sunny" />
      </button>
    </el-menu-item>
    <el-menu-item h="full" @click="">
      <el-link
        class="border-none w-full bg-transparent cursor-pointer"
        style="height: var(--ep-menu-item-height)"
        href="dingtalk://dingtalkclient/action/sendmsg?spm=dingtalk_id=coderchen01"
        target="_blank"
        :underline="false"
      >
        <i inline-flex i="ep-service" />
      </el-link>
    </el-menu-item>
    <el-menu-item h="full" @click="">
      <el-link
        class="border-none w-full bg-transparent cursor-pointer"
        style="height: var(--ep-menu-item-height)"
        href="https://wiki.megvii-inc.com/x/UNbqHw"
        target="_blank"
        :underline="false"
      >
        <i inline-flex i="ep-question-filled" />
      </el-link>
    </el-menu-item>
  </el-menu>
</template>
