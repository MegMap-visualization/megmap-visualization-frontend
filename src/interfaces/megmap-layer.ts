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

export interface IBaseLayerData {
  gid: number
  points: [number, number][]
  [key: string]: any
}

export interface IRenderedData {
  id: number | string
  dispalyedData: Record<string, any>
  pres: string[] | null
  sucs: string[] | null
  rightSameNeighbors: string[] | null
  leftSameNeighbors: string[] | null
  rightOppositeNeighbors: string[] | null
  leftOppositeNeighbors: string[] | null
  objectReferences: string[] | null
  signalReferences: string[] | null
  junctionReferences: string[] | null
  path: [number, number][]
  color: string
  defaultColor: string
  strokeWeight: number
  defaultStrokeWeight: number
  storkeColor: string
  defaultStrokeColor: string
  fillColor: string
  defaultFillColor: string
  fillOpacity: number
  defaultFillOpacity: number
  strokeOpacity: number
  defaultStrokeOpacity: number
  strokeStyle: string
  defaultStrokeStyle: string
  isOutline: boolean | null
  outlineColor: string | null
  defaultOutlineColor: string | null
  lineJoin: string | null
  showDir: boolean | null
  dirColor: string | null
  defaultDirColor: string | null
}
