<script lang="ts" setup>
import { ElNotification, genFileId } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadProps, UploadRawFile } from 'element-plus'
import SparkMD5 from 'spark-md5'

import { keysToCamelCase } from '@utils/name-adapter'
import { useLocalMapListStore } from '@store/local-map-list'
import { useMegMapLoad } from '@composables/megmap-loader'
import { MegMapDataset } from '@services/megmap-dataset'
import copyTextToClipboard from '@utils/clipboard'

import type {
  ILocalMapInfoData,
  IUploadLocalMapInfo,
  ITaskLog,
} from '@interfaces/local-map-list'
import { ca, tr } from 'element-plus/es/locale'
import { BlobOptions } from 'buffer'

const localMapListStore = useLocalMapListStore()
const megmap = inject<AMap.Map>('megmap')
const megmapDataset: Ref<MegMapDataset | null> = ref(null)

const chunkSize = 9 * 1024 * 1024
const uploadUrl = `${
  import.meta.env.VITE_BASE_URL
}/megmap-layer-builder/upload-map`

defineProps({
  isOpened: Boolean,
})

const uploadRef = ref()
const mapType = ref('apollo')
const activeMode = ref('mapUpload')
const isOpenedLocalMapView = ref(false)
const viewMapFileMd5 = ref('')
const taskInfoViewReqIntervalId = ref<NodeJS.Timeout | null>(null)

/**
 * 分片读取文件 MD5
 */
const getFileMd5 = (file: Blob): Promise<string> => {
  const blobSlice =
    File.prototype.slice ||
    (File.prototype as any).mozSlice ||
    (File.prototype as any).webkitSlice

  const fileReader = new FileReader()

  // 计算分片数
  const totalChunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0

  const spark = new SparkMD5.ArrayBuffer()

  function loadNext() {
    const start = currentChunk * chunkSize
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize
    // 注意这里的 fileRaw
    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
  }

  loadNext()
  return new Promise((resolve) => {
    fileReader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        spark.append((e.target as FileReader).result as ArrayBuffer)
      } catch (error) {
        console.log('获取Md5错误：' + currentChunk)
      }
      if (currentChunk < totalChunks) {
        currentChunk++
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = () => {
      // window.$message.error('读取Md5失败，文件读取错误');
      resolve('')
    }
  })
}

/**
 * 获取通知信息从localMapInfoData
 */
const getNotificationMsgFromLocalMapInfoData = (
  localMapinfoData: ILocalMapInfoData,
) => {
  return `<p><strong>地图文件名：</strong><br/>
    ${localMapinfoData.fileName}</p>
    <p><strong>地图文件MD5：</strong><br/>
      ${localMapinfoData.fileMd5}</p>`
}

/**
 * 上传成功后更新结果
 * @param response
 * @param uploadFile
 */
const onUploadSuccess: UploadProps['onSuccess'] = async (
  response,
  uploadFile,
) => {
  console.log(response, uploadFile)
  const fileMd5 = localMapListStore.getMd5FromFileObj(uploadFile.raw as File)
  if (fileMd5 === null) {
    // 这种情况不会发生，因为上传前已经计算过了。
    return
  }
  const localMapinfoData = localMapListStore.localMapInfoDataRecord[fileMd5]

  if (response.status === 'success') {
    const { hasMap, fileMd5, taskId, megmapInfo } = keysToCamelCase(
      response.data,
    ) as IUploadLocalMapInfo
    if (hasMap) {
      // 这种情况说明上传前查询是否存在失败了，但是上传的请求成功了。
      localMapinfoData.isSuccess = true
      localMapinfoData.megmapInfo = megmapInfo
      localMapinfoData.taskId = taskId
      localMapinfoData.message = '提取成功'
      localMapinfoData.messageType = 'success'
    } else {
      // 上传成功，但是地图还没有生成，需要轮询查询
      localMapinfoData.isSuccess = false
      localMapinfoData.taskId = taskId
      localMapinfoData.message = '数据提取中'
      localMapinfoData.messageType = 'warning'

      // 开始轮询
      const interval = setInterval(async () => {
        await localMapListStore.getLocalMapExtractionTaskLog(fileMd5)
        if (localMapinfoData.isSuccess) {
          clearInterval(interval)
        }
      }, 5000)
    }
  } else {
    // 上传失败
    ElNotification({
      title: '该地图上传失败，请重试！',
      dangerouslyUseHTMLString: true,
      message: getNotificationMsgFromLocalMapInfoData(localMapinfoData),
      type: 'error',
    })
    localMapinfoData.isSuccess = false
    localMapinfoData.message = '文件上传失败'
    localMapinfoData.messageType = 'danger'
  }
}

const checkFileType = async (file: File, message: string): Promise<boolean> => {
  if (file.type === 'application/xml' && mapType.value === 'memo') {
    try {
      await ElMessageBox.confirm(
        `<p><strong>当前文件类型为xml, 而当前的选择的地图类型是记忆行车地图, 是否继续该文件的上传？</strong></p>
      ${message}`,
        '异常操作',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true,
        },
      )
      return true
    } catch {
      return false
    }
  }
  if (file.type === 'application/json' && mapType.value === 'apollo') {
    try {
      await ElMessageBox.confirm(
        `<p><strong>当前文件类型为json, 而当前的选择的地图类型是Apollo地图, 是否继续该文件的上传？</strong></p>
      ${message}`,
        '异常操作',
        {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning',
          closeOnClickModal: false,
          dangerouslyUseHTMLString: true,
          lockScroll: false,
          draggable: true,
        },
      )
      return true
    } catch {
      return false
    }
  }
  return true
}

/**
 * 在上传之前，先判断该文件是否已经上传过了。
 * @param rawFile
 */
const beforeUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  console.log('Starting upload with URL:', uploadUrl)
  const md5 = await getFileMd5(rawFile)
  const message = `<p>地图文件名：<br/>${rawFile.name}</p>
  <p>地图文件MD5: <br/>${md5}</p>`

  // md5计算错误就视为失败。
  if (md5 === '') {
    ElNotification({
      title: '地图文件MD5计算错误，请重试！',
      message: message,
      dangerouslyUseHTMLString: true,
      type: 'error',
    })
    return false
  }

  // 判断文件类型是否正确，是否上传由用户决定
  if (!(await checkFileType(rawFile, message))) {
    ElNotification({
      title: '已取消该文件的上传',
      message: message,
      dangerouslyUseHTMLString: true,
      type: 'warning',
    })
    return false
  }

  if (
    md5 in localMapListStore.localMapInfoDataRecord &&
    localMapListStore.localMapInfoDataRecord[md5].megmapInfo
  ) {
    const localMapinfoData = localMapListStore.localMapInfoDataRecord[md5]
    localMapinfoData.mapType =
      localMapinfoData.megmapInfo?.mapType ||
      localMapListStore.localMapInfoDataRecord[md5].mapType
    localMapinfoData.isSuccess = true
    // 已经操作过该文件且该文件已经上传成功了，跳过。
    ElNotification({
      title: '该地图已经上传，请直接查看',
      dangerouslyUseHTMLString: true,
      message: message,
      type: 'success',
    })
    return false
  }

  localMapListStore.localMapInfoDataRecord[md5] = {
    isSuccess: false,
    fileName: rawFile.name,
    fileLastModified: rawFile.lastModified,
    filesize: rawFile.size,
    fileType: rawFile.type,
    fileMd5: md5,
    taskId: '',
    taskLogs: [] as ITaskLog[],
    errorNum: 0,
    message: '上传文件中',
    mapType: mapType.value,
    messageType: 'info',
  } as ILocalMapInfoData
  const localMapinfoData = localMapListStore.localMapInfoDataRecord[md5]

  // 判断地图是否已经存在
  const rv = await localMapListStore.getLocalMapInfo(md5)
  if (!rv) {
    // 查询失败，放行上传
    ElNotification({
      title: '无法确认该地图是否已经上传',
      dangerouslyUseHTMLString: true,
      message: message,
      type: 'warning',
    })
    return true
  }

  const { hasMap, megmapInfo } = rv
  if (hasMap) {
    // 已经存在就不再上传，地图上传成功
    localMapinfoData.isSuccess = true
    localMapinfoData.megmapInfo = megmapInfo
    localMapinfoData.message = '提取成功'
    localMapinfoData.messageType = 'success'
    localMapinfoData.mapType = megmapInfo?.mapType || localMapinfoData.mapType
    ElNotification({
      title: '该地图已经上传，请直接查看',
      dangerouslyUseHTMLString: true,
      message: message,
      type: 'success',
    })
    return false
  }

  // 放行上传
  return true
}

/**
 * 复制表格内容到剪切板
 * @param row
 * @param column
 */
const handleMapViewTableCellClick = async (
  row: ILocalMapInfoData,
  column: any,
) => {
  if (column.property === undefined) {
    return
  }
  const { property } = column
  const _ = await copyTextToClipboard(
    row[property as keyof ILocalMapInfoData] as string,
  )
  ElNotification({
    message: '已复制到剪切板',
    type: 'success',
    duration: 1000,
  })
}

/**
 * 查看任务日志
 * @param fileMd5
 */
const handleTaskLogViewClick = (fileMd5: string) => {
  if (taskInfoViewReqIntervalId.value) {
    clearInterval(taskInfoViewReqIntervalId.value)
  }
  viewMapFileMd5.value = fileMd5
  isOpenedLocalMapView.value = true
  const localMapinfoData = localMapListStore.localMapInfoDataRecord[fileMd5]
  if (localMapinfoData.taskId === '') {
    // 说明还没有开始提取，不需要轮询
    return
  }
  if (localMapinfoData.isSuccess) {
    // 说明已经提取成功了，不需要轮询
    return
  }
  taskInfoViewReqIntervalId.value = setInterval(async () => {
    await localMapListStore.getLocalMapExtractionTaskLog(fileMd5)
  }, 500)
}

/**
 * 任务日志对话框关闭，不再进行快速轮询
 */
const handleTaskInfoDialogClose = () => {
  isOpenedLocalMapView.value = false
  if (taskInfoViewReqIntervalId.value) {
    clearInterval(taskInfoViewReqIntervalId.value)
  }
}

/**
 * 加载地图
 * @param fileMd5
 */
const handleMapViewClick = async (fileMd5: string) => {
  const localMapinfoData = localMapListStore.localMapInfoDataRecord[fileMd5]
  if (localMapinfoData.isSuccess && !localMapinfoData.megmapInfo) {
    const localMapInfo = await localMapListStore.getLocalMapInfo(fileMd5)
    if (!localMapInfo || !localMapInfo.megmapInfo) {
      ElNotification({
        title: '【异常操作】该地图还未提取成功，请稍后再试',
        dangerouslyUseHTMLString: true,
        message: getNotificationMsgFromLocalMapInfoData(localMapinfoData),
        type: 'error',
      })
      return
    }
    localMapinfoData.megmapInfo = localMapInfo.megmapInfo
  }
  await useMegMapLoad(megmap, localMapinfoData.megmapInfo, megmapDataset)
}

/**
 * 删除地图本地缓存
 * @param fileMd5
 */
const handleMapDeleteClick = (fileMd5: string) => {
  const localMapinfoData = localMapListStore.localMapInfoDataRecord[fileMd5]
  localMapListStore.deleteLocalMapInfoData(fileMd5)
  ElNotification({
    title: '该地图已经被删除',
    dangerouslyUseHTMLString: true,
    message: getNotificationMsgFromLocalMapInfoData(localMapinfoData),
    type: 'warning',
  })
}

/**
 * 处理超过五个文件的清空
 * @param files
 */
const handleExceed: UploadProps['onExceed'] = (files) => {
  uploadRef.value!.clearFiles()
  let fileNames = []
  for (const file of files.slice(5, files.length)) {
    fileNames.push(file.name)
  }
  ElNotification({
    title: '每次最多上传5个文件',
    message: `文件 ${fileNames} 超过了限制，无法上传`,
    type: 'warning',
  })
  for (const file of files.slice(0, 5)) {
    let rawFile = file as UploadRawFile
    rawFile.uid = genFileId()
    uploadRef.value!.handleStart(file)
  }
  uploadRef.value!.submit()
}

/**
 * 过滤地图类型
 * @param value
 * @param row
 */
const filterMapType = (value: string, row: ILocalMapInfoData) => {
  return row.mapType === value
}

/**
 * 过滤提取成功的地图
 * @param value
 * @param row
 */
const filterIsSuccess = (value: string, row: ILocalMapInfoData) => {
  return row.isSuccess.toString() === value
}
</script>

<template>
  <el-dialog
    title="MegMap提取进度"
    :model-value="isOpenedLocalMapView"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    @close="handleTaskInfoDialogClose"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    center
    draggable
  >
    <el-scrollbar height="400px">
      <el-empty
        description="暂无任务日志"
        v-if="
          localMapListStore.localMapInfoDataRecord[viewMapFileMd5].taskLogs
            ?.length === 0
        "
      />
      <el-timeline v-else>
        <el-timeline-item
          placement="top"
          v-for="(taskLog, index) in localMapListStore.localMapInfoDataRecord[
            viewMapFileMd5
          ].taskLogs"
          :type="taskLog.type"
          :key="`${viewMapFileMd5}_${index}`"
          :timestamp="taskLog.timestamp"
        >
          {{ taskLog.message }}
        </el-timeline-item>
      </el-timeline>
    </el-scrollbar>
  </el-dialog>
  <el-dialog
    title="MegMap查看"
    :model-value="isOpened"
    :modal="false"
    :close-on-click-modal="false"
    :lock-scroll="false"
    modal-class="tool-dialog-modal"
    style="pointer-events: auto"
    align-center
    draggable
    center
    @close="$emit('closed')"
  >
    <el-tabs v-model="activeMode" class="local-map-tool-tabs">
      <el-tab-pane label="上传" name="mapUpload">
        <el-row mb="10px">
          <el-col :span="2" class="flex items-center justify-center">
            地图类型选择
          </el-col>
          <el-col :span="22">
            <el-radio-group v-model="mapType">
              <el-radio-button label="apollo" />
              <el-radio-button label="memo" />
            </el-radio-group>
          </el-col>
        </el-row>
        <el-upload
          :auto-upload="true"
          :data="{ map_type: mapType }"
          :limit="5"
          ref="uploadRef"
          class="upload-megmap"
          :action="uploadUrl"
          :on-success="onUploadSuccess"
          :before-upload="beforeUpload"
          :on-exceed="handleExceed"
          multiple
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽上传 或
            <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip text-red">每次支持最多上传5个文件</div>
          </template>
        </el-upload>
      </el-tab-pane>
      <el-tab-pane label="查看" name="taskInfo">
        <el-table
          :data="localMapListStore.allLocalMapInfoData"
          @cell-click="handleMapViewTableCellClick"
        >
          <el-table-column
            prop="mapType"
            align="center"
            header-align="center"
            label="地图类型"
            :filters="[
              { text: 'Apollo地图', value: 'apollo' },
              { text: '记忆行车', value: 'memo' },
            ]"
            :filter-method="filterMapType"
          />
          <el-table-column
            prop="isSuccess"
            align="center"
            header-align="center"
            label="状态"
            :filters="[
              { text: '可查看', value: 'true' },
              { text: '暂不可查看', value: 'false' },
            ]"
            :filter-method="filterIsSuccess"
            :filter-multiple="false"
          >
            <template #default="scope">
              <el-tag :type="scope.row.messageType" disable-transitions>
                {{ scope.row.message }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="fileName"
            header-align="center"
            align="center"
            label="地图文件名称"
          />
          <el-table-column
            prop="fileMd5"
            header-align="center"
            label="地图文件md5"
          />
          <el-table-column align="right">
            <template #header>
              <el-popconfirm
                title="是否清空本地缓存?"
                confirm-button-text="确认"
                cancel-button-text="取消"
                @confirm="localMapListStore.$reset()"
              >
                <template #reference>
                  <el-button type="danger" size="small">清空地图</el-button>
                </template>
              </el-popconfirm>
            </template>
            <template #default="scope">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleTaskLogViewClick(scope.row.fileMd5)"
              >
                查看提取日志
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="!scope.row.isSuccess"
                @click="handleMapViewClick(scope.row.fileMd5)"
              >
                查看地图
              </el-button>
              <el-popconfirm
                title="是否删除该地图的本地缓存?"
                confirm-button-text="确认"
                cancel-button-text="取消"
                @confirm="handleMapDeleteClick(scope.row.fileMd5)"
              >
                <template #reference>
                  <el-button link type="danger" size="small">
                    删除地图
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>
