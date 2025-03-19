import { BlobOptions } from 'buffer'
import { IMegMapInfo } from './common'

export interface ILocalMapInfo {
  hasMap: boolean
  megmapInfo: IMegMapInfo | null
}

export interface ITaskLog {
  timestamp: string
  message: string
  type: 'info' | 'danger' | 'warning' | 'success'
}

export interface ILocalMapInfoData {
  isSuccess: boolean
  message: MessageType
  messageType: MessageStatus
  megmapInfo: IMegMapInfo | null
  taskId: string | null
  fileName: string | null
  fileLastModified: number | null
  filesize: number | null
  fileType: string | null
  fileMd5: string | null
  mapType: string | null
  taskLogs: ITaskLog[] | null
  errorNum: number | null
}

export interface IUploadLocalMapInfo {
  hasMap: boolean
  taskId: string | null
  fileMd5: string
  megmapInfo: IMegMapInfo | null
}

export interface ILocalMapExtractionTaskLog {
  status: 'running' | 'success' | 'error'
  messages: string[][]
  path: string
  fileMd5: string
}

export type MessageType =
  | '上传文件中'
  | '文件上传失败'
  | '数据提取中'
  | '进度查询失败'
  | '提取成功'
  | '提取失败'

export type MessageStatus = 'success' | 'warning' | 'danger' | 'info'
