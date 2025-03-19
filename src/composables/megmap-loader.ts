import { ElNotification } from 'element-plus'
import { useMegMapStore } from '@store/megmap'
import { MegMapDataset } from '@services/megmap-dataset'

import type { IMegMapInfo } from '@interfaces/megmap-layer'

export const useMegMapLoad = async (
  megmap: AMap.Map | null | undefined,
  megmapInfo: IMegMapInfo | null | undefined,
  megmapDataset: Ref<MegMapDataset | null>,
) => {
  if (!megmapInfo) {
    return
  }
  const megmapStore = useMegMapStore()

  if (!megmap) {
    ElNotification({
      message: '地图引擎加载失败',
      type: 'error',
      duration: 1000,
    })
    return
  }

  if (
    megmapDataset.value &&
    megmapDataset.value.megMapInfo.mapMd5 === megmapInfo.mapMd5
  ) {
    ElNotification({
      message: '地图已加载',
      type: 'warning',
      duration: 1000,
    })
    return
  }

  megmapStore.$reset()
  megmapDataset.value = new MegMapDataset(megmap, megmapInfo)
  const loading = ElLoading.service({
    text: '加载地图信息',
    background: 'rgba(0, 0, 0, 0.5)',
  })

  await megmapDataset.value.getMapBounds()

  let allFeature = []
  for (const layer of Object.values(megmapDataset.value.layers)) {
    allFeature.push(layer.getAllIds())
  }

  await Promise.all(allFeature).then(() => {
    loading.close()
    megmapStore.megmapDataset = megmapDataset.value
  })
}
