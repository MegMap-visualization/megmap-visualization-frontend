/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  forceWebGL: boolean
}

declare module 'vue3-json-viewer' {
  import {
    AllowedComponentProps,
    App,
    Component,
    ComponentCustomProps,
    VNodeProps,
  } from 'vue'
  interface JsonViewerProps {
    value: Object | Array<any> | string | number | boolean //对象
    expanded: boolean //是否自动展开
    expandDepth: number //展开层级
    copyable: boolean | object //是否可复制
    sort: boolean //是否排序
    boxed: boolean //是否boxed
    theme: string //主题 jv-dark | jv-light
    previewMode: boolean //是否可复制
    timeformat: (value: any) => string
  }
  type JsonViewerType = JsonViewerProps &
    VNodeProps &
    AllowedComponentProps &
    ComponentCustomProps
  const JsonViewer: Component<JsonViewerType>
  export { JsonViewer }
  const def: { install: (app: App) => void }
  export default def
}
