export function isString(data) {
  return typeof data === 'string'
}

export function deepClone(obj, cache = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj
  if (cache.has(obj)) return cache.get(obj)
  let clone
  if (obj instanceof Date) {
    clone = new Date(obj.getTime())
  } else if (obj instanceof RegExp) {
    clone = new RegExp(obj)
  } else if (obj instanceof Map) {
    clone = new Map(
      Array.from(obj, ([key, value]) => [key, deepClone(value, cache)])
    )
  } else if (obj instanceof Set) {
    clone = new Set(Array.from(obj, (value) => deepClone(value, cache)))
  } else if (Array.isArray(obj)) {
    clone = obj.map((value) => deepClone(value, cache))
  } else if (Object.prototype.toString.call(obj) === '[object Object]') {
    clone = Object.create(Object.getPrototypeOf(obj))
    cache.set(obj, clone)
    for (const [key, value] of Object.entries(obj)) {
      clone[key] = deepClone(value, cache)
    }
  } else {
    clone = Object.assign({}, obj)
  }
  cache.set(obj, clone)
  return clone
}

// 分页
export function paging(data, PAGENUM = 50) {
  if (!Array.isArray(data) || !data.length) return data
  const pages = []
  data.forEach((item, index) => {
    const i = Math.floor(index / PAGENUM)
    if (!pages[i]) {
      pages[i] = []
    }
    pages[i].push(item)
  })
  return pages
}
