export function isString(data) {
  return typeof data === 'string'
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
