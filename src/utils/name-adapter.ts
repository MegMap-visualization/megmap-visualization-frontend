import humps from 'humps'

export function keysToCamelCase(obj: any): any {
  return humps.camelizeKeys(obj)
}

export function keysToSnakeCase(obj: any): any {
  return humps.decamelizeKeys(obj)
}
