export interface GCJ2WGS842UTMData {
  wgs84: [number, number][]
  utm: {
    data: [number, number][]
    zone: number
    letter: string
  }
}

export interface UTM2WGS2GCJData {
  wgs84: [number, number][]
  gcj02: [number, number][]
  utmZoneNumber: number
  utmZoneLetter: string
}

export interface WGS2GCJUTMData {
  gcj02: [number, number][]
  utm: {
    data: [number, number][]
    zone: number
    letter: string
  }
}
