export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

export interface ResponseData {
  code: number
  status: ResponseStatus
  message: string
  data: any
}

export enum MegMapLayerType {
  LANE = 'lane',
  INTERSECTION = 'intersection',
  STOP_LINE = 'stop_line',
  CROSSWALK = 'crosswalk',
  TRAFFIC_LIGHT = 'traffic_light',
  LANE_CONNECTOR = 'lane_connector',
  BASELINE_PATH = 'baseline_path',
  LANE_BOUNDARY = 'lane_boundary',
  LANE_GROUP_POLYGON = 'lane_group_polygon',
  REFERENCE_LINE = 'reference_line',
}

export interface IMegMapInfo {
  mapRemark: string
  mapMd5: string
  mapS3Path: string
  availableLayers: string[]
  mapType: string
  layerIdNameMap: Record<string, string>
}

export type MouseToolType =
  | 'polygon'
  | 'rectangle'
  | 'polyline'
  | 'measureArea'
  | 'rule'
  | 'marker'
