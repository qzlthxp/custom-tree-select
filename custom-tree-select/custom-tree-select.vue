<template>
  <view class="custom-tree-select-content">
    <view
      :class="['select-list', { disabled }, { active: selectList.length }]"
      @click="open"
    >
      <view class="left">
        <view v-if="selectList.length" class="select-items">
          <view
            class="select-item"
            v-for="item in selectedListBaseinfo"
            :key="item[dataValue]"
          >
            <view class="name">
              <text>{{ item[dataLabel] }}</text>
            </view>
            <view
              v-if="!disabled"
              class="close"
              @click.stop="removeSelectedItem(item[dataValue])"
            >
              <uni-icons type="closeempty" size="16" color="#999"></uni-icons>
            </view>
          </view>
        </view>
        <view v-else style="color: #6a6a6a" class="no-data">
          <text>{{ placeholder }}</text>
        </view>
      </view>
      <view class="right">
        <uni-icons
          v-if="!selectList.length || !clearable"
          type="bottom"
          size="14"
          color="#999"
        ></uni-icons>
        <uni-icons
          v-if="selectList.length && clearable"
          type="clear"
          size="24"
          color="#c0c4cc"
          @click.native.stop="clear"
        ></uni-icons>
      </view>
    </view>
    <uni-popup
      v-if="showPopup"
      ref="popup"
      :animation="animation"
      :is-mask-click="isMaskClick"
      :mask-background-color="maskBackgroundColor"
      :background-color="backgroundColor"
      :safe-area="safeArea"
      type="bottom"
      @change="change"
      @maskClick="maskClick"
    >
      <view class="popup-content" :style="{ height: contentHeight }">
        <view class="title">
          <view v-if="canSelectAll" class="left" @click="handleSelectAll">
            <text>全选</text>
          </view>
          <view class="center">
            <text>{{ placeholder }}</text>
          </view>
          <view
            class="right"
            :style="{ color: confirmTextColor }"
            @click="close"
          >
            <text>{{ confirmText }}</text>
          </view>
        </view>
        <view v-if="search" class="search-box">
          <uni-easyinput
            :maxlength="-1"
            prefixIcon="search"
            placeholder="搜索"
            v-model="searchStr"
            confirm-type="search"
            @confirm="handleSearch"
          ></uni-easyinput>
          <button
            type="primary"
            size="mini"
            class="search-btn"
            @click="handleSearch"
          >
            搜索
          </button>
        </view>
        <view v-if="treeData.length" class="select-content">
          <scroll-view
            class="scroll-view-box"
            :scroll-top="scrollTop"
            scroll-y="true"
            @touchmove.stop
          >
            <view v-if="!filterTreeData.length" class="no-data center">
              <text>暂无数据</text>
            </view>
            <data-select-item
              v-for="item in filterTreeData"
              :key="item[dataValue]"
              :node="item"
              :dataLabel="dataLabel"
              :dataValue="dataValue"
              :dataChildren="dataChildren"
              :choseParent="choseParent"
              :border="border"
            ></data-select-item>
            <view class="sentry" />
          </scroll-view>
        </view>
        <view v-else class="no-data center">
          <text>暂无数据</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import dataSelectItem from './data-select-item.vue'
export default {
  name: 'custom-tree-select',
  components: {
    dataSelectItem
  },
  model: {
    prop: 'value',
    event: 'input'
  },
  props: {
    canSelectAll: {
      type: Boolean,
      default: true
    },
    safeArea: {
      type: Boolean,
      default: true
    },
    search: {
      type: Boolean,
      default: false
    },
    animation: {
      type: Boolean,
      default: true
    },
    'is-mask-click': {
      type: Boolean,
      default: true
    },
    'mask-background-color': {
      type: String,
      default: 'rgba(0,0,0,0.4)'
    },
    'background-color': {
      type: String,
      default: 'none'
    },
    'safe-area': {
      type: Boolean,
      default: true
    },
    choseParent: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    confirmText: {
      type: String,
      default: '完成'
    },
    confirmTextColor: {
      type: String,
      default: '#007aff'
    },
    listData: {
      type: Array,
      default: () => []
    },
    dataLabel: {
      type: String,
      default: 'name'
    },
    dataValue: {
      type: String,
      default: 'id'
    },
    dataChildren: {
      type: String,
      default: 'children'
    },
    linkage: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    mutiple: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showChildren: {
      type: Boolean,
      default: true
    },
    border: {
      type: Boolean,
      default: false
    },
    value: {
      type: [Array, String],
      default: () => []
    }
  },
  data() {
    return {
      contentHeight: '500px',
      treeData: [],
      filterTreeData: [],
      clearTimerList: [],
      showPopup: false,
      clickOpenTimer: null,
      scrollTop: 0,
      searchStr: ''
    }
  },
  computed: {
    selectList() {
      const newVal = this.value === null ? '' : this.value
      return this.isString(newVal)
        ? newVal.length
          ? newVal.split(',')
          : []
        : newVal.map((item) => item.toString())
    },
    selectedListBaseinfo() {
      const ids = this.value === null ? '' : this.value
      return this.getselectedInfo(ids)
    }
  },
  watch: {
    listData: {
      deep: true,
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.treeData = this.deepClone(newVal)
          this.initData(this.treeData)
          if (this.showPopup) {
            this.resetClearTimerList()
            this.renderTree(this.treeData)
          }
        }
      }
    },
    value: {
      immediate: true,
      handler(newVal) {
        const ids = newVal
          ? Array.isArray(newVal)
            ? newVal
            : newVal.split(',')
          : []
        this.changeStatus(ids, true)
        this.updateTreeData(this.filterTreeData)
      }
    }
  },
  mounted() {
    this.getContentHeight(uni.getSystemInfoSync())
  },
  methods: {
    // 更新试图 搜索的数据如果是父子联动有时候不能正常显示
    updateTreeData(arr) {
      if (!arr.length) return
      for (let i = 0; i < arr.length; i++) {
        const truthNode = this.getTruthNode(arr[i])
        if (truthNode) {
          arr[i].checked = truthNode.checked
          if (arr[i][this.dataChildren]?.length) {
            this.updateTreeData(arr[i][this.dataChildren])
          }
        }
      }
    },
    // 获取treeData中对应数据
    getTruthNode(node) {
      const arr = [...this.treeData]
      while (arr.length) {
        const item = arr.shift()
        if (item[this.dataValue] === node[this.dataValue]) {
          return item
        }
        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }
      return null
    },
    // 获取 filterTreeData 中对应数据
    getFilterTreeNode(node) {
      const arr = [...this.filterTreeData]
      while (arr.length) {
        const item = arr.shift()
        if (item[this.dataValue] === node[this.dataValue]) {
          return item
        }
        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }
      return null
    },
    getContentHeight({ screenHeight }) {
      this.contentHeight = `${Math.floor(screenHeight * 0.7)}px`
    },
    isString(data) {
      return typeof data === 'string'
    },
    deepClone(obj, cache = new WeakMap()) {
      if (obj === null || typeof obj !== 'object') return obj
      if (cache.has(obj)) return cache.get(obj)
      let clone
      if (obj instanceof Date) {
        clone = new Date(obj.getTime())
      } else if (obj instanceof RegExp) {
        clone = new RegExp(obj)
      } else if (obj instanceof Map) {
        clone = new Map(
          Array.from(obj, ([key, value]) => [key, this.deepClone(value, cache)])
        )
      } else if (obj instanceof Set) {
        clone = new Set(
          Array.from(obj, (value) => this.deepClone(value, cache))
        )
      } else if (Array.isArray(obj)) {
        clone = obj.map((value) => this.deepClone(value, cache))
      } else if (Object.prototype.toString.call(obj) === '[object Object]') {
        clone = Object.create(Object.getPrototypeOf(obj))
        cache.set(obj, clone)
        for (const [key, value] of Object.entries(obj)) {
          clone[key] = this.deepClone(value, cache)
        }
      } else {
        clone = Object.assign({}, obj)
      }
      cache.set(obj, clone)
      return clone
    },
    // 分页
    paging(data, PAGENUM = 50) {
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
    },
    // 搜索完成返回顶部
    goTop() {
      this.scrollTop = 10
      this.$nextTick(() => {
        this.scrollTop = 0
      })
    },
    // 处理搜索
    handleSearch() {
      this.resetClearTimerList()
      this.renderTree(this.searchValue(this.searchStr, this.treeData))
      this.goTop()
      uni.hideKeyboard()
    },
    // 具体搜索方法
    searchValue(str, arr) {
      const res = []
      arr.forEach((item) => {
        if (item.visible) {
          if (
            item[this.dataLabel]
              .toString()
              .toLowerCase()
              .indexOf(str.toLowerCase()) > -1
          ) {
            res.push(item)
          } else {
            if (item[this.dataChildren]?.length) {
              const data = this.searchValue(str, item[this.dataChildren])
              if (data?.length) {
                if (
                  str &&
                  !item.showChildren &&
                  item[this.dataChildren]?.length
                ) {
                  item.showChildren = true
                }
                res.push({
                  ...item,
                  [this.dataChildren]: data
                })
              }
            }
          }
        }
      })
      return res
    },
    // 懒加载
    renderTree(arr) {
      const pagingArr = this.paging(arr)
      this.filterTreeData.splice(
        0,
        this.filterTreeData.length,
        ...(pagingArr?.[0] || [])
      )
      this.lazyRenderList(pagingArr, 1)
    },
    // 懒加载具体逻辑
    lazyRenderList(arr, startIndex) {
      for (let i = startIndex; i < arr.length; i++) {
        let timer = null
        timer = setTimeout(() => {
          this.filterTreeData.push(...arr[i])
        }, i * 500)
        this.clearTimerList.push(() => clearTimeout(timer))
      }
    },
    // 打开弹窗
    open() {
      // disaled模式下禁止打开弹窗
      if (this.disabled) return
      this.showPopup = true
      this.$nextTick(() => {
        this.$refs.popup.open()
        this.renderTree(this.treeData)
      })
    },
    // 关闭弹窗
    close() {
      this.$refs.popup.close()
    },
    // 弹窗状态变化 包括点击回显框和遮罩
    change(data) {
      if (data.show) {
        // #ifdef MP-WEIXIN
        this.$bus.$on('custom-tree-select-node-click', (node) => {
          this.handleNodeClick(node)
        })
        this.$bus.$on('custom-tree-select-name-click', (node) => {
          this.handleHideChildren(node)
        })
        // #endif
      } else {
        // #ifdef MP-WEIXIN
        this.$bus.$off('custom-tree-select-node-click')
        this.$bus.$off('custom-tree-select-name-click')
        // #endif
        this.resetClearTimerList()
        this.searchStr = ''
        if (this.animation) {
          setTimeout(() => {
            this.showPopup = false
          }, 200)
        } else {
          this.showPopup = false
        }
      }
      this.$emit('change', data)
    },
    // 中断懒加载
    resetClearTimerList() {
      const list = [...this.clearTimerList]
      this.clearTimerList.splice(0, this.clearTimerList.length)
      list.forEach((item) => item())
    },
    // 点击遮罩
    maskClick() {
      this.$emit('maskClick')
    },
    // 初始化数据
    initData(arr) {
      for (let i = 0; i < arr.length; i++) {
        if (this.selectList.includes(arr[i][this.dataValue].toString())) {
          this.$set(arr[i], 'checked', true)
        } else {
          this.$set(arr[i], 'checked', false)
        }
        if (arr[i].disabled) {
          this.$set(arr[i], 'disabled', true)
        } else {
          this.$set(arr[i], 'disabled', false)
        }
        if (JSON.stringify(arr[i].visible) === 'false') {
          this.$set(arr[i], 'visible', false)
          if (arr[i][this.dataChildren]?.length) {
            for (let j = 0; j < arr[i][this.dataChildren].length; j++) {
              arr[i][this.dataChildren][j].visible = false
            }
          }
        } else {
          this.$set(arr[i], 'visible', true)
        }
        if ('showChildren' in arr[i] && arr[i].showChildren != undefined) {
          this.$set(arr[i], 'showChildren', arr[i].showChildren)
        } else {
          this.$set(arr[i], 'showChildren', this.showChildren)
        }
        // #ifndef MP-WEIXIN
        if (!arr[i].handleNodeClick) {
          this.$set(arr[i], 'handleNodeClick', this.handleNodeClick)
        }
        if (!arr[i].handleHideChildren) {
          this.$set(arr[i], 'handleHideChildren', this.handleHideChildren)
        }
        // #endif
        if (arr[i][this.dataChildren]?.length) {
          this.initData(arr[i][this.dataChildren])
        }
      }
    },
    // 获取某个节点所有子元素
    getChildren(node) {
      if (!node[this.dataChildren]?.length) return []
      const res = node[this.dataChildren].reduce((pre, val) => {
        if (val.visible) {
          return [...pre, val]
        }
        return pre
      }, [])
      for (let i = 0; i < node[this.dataChildren].length; i++) {
        res.push(...this.getChildren(node[this.dataChildren][i]))
      }
      return res
    },
    // 获取某个节点所有父元素
    getParentNode(target, arr) {
      let res = []

      for (let i = 0; i < arr.length; i++) {
        if (arr[i][this.dataValue] === target[this.dataValue]) {
          return true
        }

        if (arr[i][this.dataChildren]?.length) {
          const childRes = this.getParentNode(target, arr[i][this.dataChildren])
          if (arr[i].visible) {
            if (typeof childRes === 'boolean' && childRes) {
              res = [arr[i]]
            } else if (Array.isArray(childRes) && childRes.length) {
              res = [...childRes, arr[i]]
            }
          }
        }
      }

      return res
    },
    // 点击checkbox
    handleNodeClick(data) {
      const node = this.getTruthNode(data)
      node.checked = !node.checked
      // 如果是单选不考虑其他情况
      if (!this.mutiple) {
        let emitData = []
        if (node.checked) {
          emitData = [node[this.dataValue].toString()]
        }
        this.$emit(
          'input',
          this.isString(this.value) ? emitData.join(',') : emitData
        )
      } else {
        // 多选情况
        if (!this.linkage) {
          // 不需要联动
          let emitData = null
          if (node.checked) {
            emitData = Array.from(
              new Set([...this.selectList, node[this.dataValue].toString()])
            )
          } else {
            emitData = this.selectList.filter(
              (id) => id !== node[this.dataValue].toString()
            )
          }
          this.$emit(
            'input',
            this.isString(this.value) ? emitData.join(',') : emitData
          )
        } else {
          // 需要联动
          let emitData = [...this.selectList]
          const parentNodes = this.getParentNode(node, this.treeData)
          const childrenVal = this.getChildren(node).filter(
            (item) => !item.disabled
          )
          if (node.checked) {
            // 选中
            emitData = Array.from(
              new Set([...emitData, node[this.dataValue].toString()])
            )
            if (childrenVal.length) {
              emitData = Array.from(
                new Set([
                  ...emitData,
                  ...childrenVal.map((item) => item[this.dataValue].toString())
                ])
              )
            }
            if (parentNodes.length) {
              console.log(parentNodes)
              // 有父元素 如果父元素下所有子元素全部选中，选中父元素
              while (parentNodes.length) {
                const item = parentNodes.shift()
                if (!item.disabled) {
                  const allChecked = item[this.dataChildren].every(
                    (node) => node.checked
                  )
                  if (allChecked) {
                    emitData = Array.from(
                      new Set([...emitData, item[this.dataValue].toString()])
                    )
                  } else {
                    break
                  }
                }
              }
            }
          } else {
            // 取消选中
            emitData = emitData.filter(
              (id) => id !== node[this.dataValue].toString()
            )
            if (parentNodes.length) {
              parentNodes.forEach((parentNode) => {
                emitData = emitData.filter(
                  (id) => id !== parentNode[this.dataValue].toString()
                )
              })
            }
            if (childrenVal.length) {
              // 取消选中全部子节点
              childrenVal.forEach((childNode) => {
                emitData = emitData.filter(
                  (id) => id !== childNode[this.dataValue].toString()
                )
              })
            }
          }
          this.$emit(
            'input',
            this.isString(this.value) ? emitData.join(',') : emitData
          )
        }
      }
    },
    // 点击名称折叠或展开
    handleHideChildren(node) {
      if (this.searchStr) {
        this.getFilterTreeNode(node).showChildren =
          !this.getFilterTreeNode(node).showChildren
        this.getTruthNode(node).showChildren =
          !this.getTruthNode(node).showChildren
      } else {
        this.getTruthNode(node).showChildren =
          !this.getTruthNode(node).showChildren
      }
    },
    // 根据id展示内容
    getselectedInfo(ids) {
      if (!ids.length) return []
      const res = []
      const arr = this.treeData.length ? [...this.treeData] : [...this.listData]
      const data =
        typeof ids === 'string'
          ? ids.split(',')
          : ids.map((item) => item.toString())

      while (arr.length) {
        const item = arr.shift()
        if (data.includes(item[this.dataValue].toString())) {
          res.push({
            [this.dataLabel]: item[this.dataLabel],
            [this.dataValue]: item[this.dataValue].toString()
          })
        }
        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }

      return res
    },
    // 根据 dataValue 找节点
    changeStatus(ids, checkedState) {
      const arr = [...this.treeData]
      const data =
        typeof ids === 'string'
          ? ids.split(',')
          : ids.map((item) => item.toString())

      while (arr.length) {
        const item = arr.shift()

        if (data.includes(item[this.dataValue].toString())) {
          this.$set(item, 'checked', checkedState)
        } else {
          this.$set(item, 'checked', !checkedState)
        }

        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }

      return null
    },
    // 移除选项
    removeSelectedItem(id) {
      this.changeStatus([id], false)
      const emitData = this.selectList.filter((item) => item !== id)
      this.$emit(
        'input',
        this.isString(this.value) ? emitData.join(',') : emitData
      )
    },
    // 全部选中
    handleSelectAll() {
      if (!this.mutiple) {
        uni.showToast({
          title: '单选模式下不能全选',
          icon: 'none',
          duration: 1000
        })
        return
      }
      let emitData = []
      this.treeData.forEach((item) => {
        if (item.visible && !item.disabled) {
          emitData = Array.from(
            new Set([...emitData, item[this.dataValue].toString()])
          )
          if (item[this.dataChildren]?.length) {
            emitData = Array.from(
              new Set([
                ...emitData,
                ...this.getChildren(item)
                  .filter((item) => !item.disabled)
                  .map((item) => item[this.dataValue].toString())
              ])
            )
          }
        }
      })
      this.$emit(
        'input',
        this.isString(this.value) ? emitData.join(',') : emitData
      )
    },
    // 清空选项
    clear() {
      if (this.disabled) return

      this.changeStatus(this.selectList, false)

      this.$emit('input', this.isString(this.value) ? '' : [])
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-tree-select-content {
  .select-list {
    padding-left: 10px;
    min-height: 35px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.active {
      padding: 4px 0 4px 10px;
    }

    .left {
      flex: 1;

      .select-items {
        display: flex;
        flex-wrap: wrap;
      }

      .select-item {
        margin: 4px 10px 4px 0;
        padding: 4px 5px;
        max-width: auto;
        height: auto;
        background-color: #eaeaea;
        border-radius: 4px;
        color: #333;
        display: flex;
        align-items: center;

        .name {
          flex: 1;
          padding-right: 10px;
          font-size: 14px;
        }

        .close {
          width: 18px;
          height: 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
      }
    }

    .right {
      margin-right: 5px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    &.disabled {
      background-color: #f5f7fa;

      .left {
        .select-item {
          .name {
            padding: 0;
          }
        }
      }
    }
  }

  .popup-content {
    flex: 1;
    background-color: #fff;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    display: flex;
    flex-direction: column;

    .title {
      padding: 8px 3rem;
      border-bottom: 1px solid $uni-border-color;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      position: relative;
      .left {
        position: absolute;
        left: 10px;
      }
      .center {
        flex: 1;
        text-align: center;
      }
      .right {
        position: absolute;
        right: 10px;
      }
    }

    .search-box {
      margin: 8px 10px 0;
      background-color: #fff;
      display: flex;
      align-items: center;

      .search-btn {
        margin-left: 10px;
        height: 35px;
        line-height: 35px;
      }
    }

    .select-content {
      margin: 8px 10px;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .scroll-view-box {
      touch-action: none;
      flex: 1;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
    .sentry {
      height: 48px;
    }
  }

  .no-data {
    width: auto;
    color: #999;
    font-size: 12px;
  }

  .no-data.center {
    text-align: center;
  }
}
</style>
