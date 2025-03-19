import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

export const useToolSideStore = defineStore({
  id: 'tool-side',
  state: () => ({
    isCollapse: false,

    // 可视化本地地图
    isLocalMapLoaderVisible: false,

    // 在线地图列表
    isOnlineMapListVisible: false,

    // 万里行轨迹可视化
    isWLXVisible: false,

    // 坐标查询
    isCoordinateQueryVisible: false,

    // 地图元素查询
    isEleQueryVisible: false,

    // 位置查询
    isLocationQueryVisible: false,

    // 车道关键点查询
    isLaneKeyPointQueryVisible: false,

    // 从文件绘制
    isDrawFromFileVisible: false,

    // 绘制并拾取坐标
    isDrawAndPickCoordinateVisible: false,

    // 测试结果验证
    isTestResultValidationVisible: false,

    // 地图连通性验证
    isMapConnectivityValidationVisible: false,

    // 路径规划验证
    isPathPlanningValidationVisible: false,
  }),
})
