<template>
  <view class="custom-tree-select-content">
    <view :class="['select-list', { disabled }, { active: selectList.length }]" @click="open">
      <view class="left">
        <view v-if="selectList.length">
          <view class="select-item" v-for="item in selectList" :key="item">
            <view class="name">
              <text>{{ getName(item) }}</text>
            </view>
            <view v-if="!disabled" class="close" @click.stop="removeSelectedItem(item)">
              <uni-icons type="closeempty" size="18" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
        <view v-if="!selectList.length" style="color: #6a6a6a" class="no-data">
          <text>{{ placeholder }}</text>
        </view>
      </view>
      <view class="right">
        <uni-icons
          v-if="(!selectList.length || !clearable) && !clickOpen"
          type="bottom"
          size="14"
          color="#999"
        ></uni-icons>
        <uni-icons
          v-if="selectList.length && clearable && !clickOpen"
          type="clear"
          size="24"
          color="#c0c4cc"
          @click.native.stop="clear"
        ></uni-icons>
        <uni-icons v-if="clickOpen" class="rotating" type="spinner-cycle" size="16"></uni-icons>
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
          <view class="center">
            <text>{{ placeholder }}</text>
          </view>
          <view :style="{ color: confirmTextColor }" class="right" @click="close()">
            <text>{{ confirmText }}</text>
          </view>
        </view>
        <view v-if="search" class="search-box">
          <uni-easyinput :maxlength="-1" prefixIcon="search" placeholder="搜索" @input="handleSearch"></uni-easyinput>
        </view>
        <view v-if="treeData.length" class="select-content">
          <scroll-view class="scroll-view-box" scroll-y="true" @touchmove.stop>
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
            ></data-select-item>
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
      clickOpen: false,
      clickOpenTimer: null,
      timer: null
    }
  },
  computed: {
    selectList() {
      return typeof this.value === 'string'
        ? this.value.length
          ? this.value.split(',')
          : []
        : this.value.map((item) => item.toString())
    }
  },
  watch: {
    listData: {
      deep: true,
      immediate: true,
      handler(newVal) {
        this.treeData = this.deepCopy(newVal)
        this.initData(this.treeData)
        if (this.clickOpen) {
          this.clickOpen = false
          this.open()
        }
      }
    },
    value: {
      deep: true,
      handler() {
        this.initData(this.treeData)
        this.updateTreeData(this.filterTreeData)
      }
    }
  },
  mounted() {
    this.getContentHeight(uni.getSystemInfoSync())
  },
  methods: {
    paging(data, PAGENUM = 50) {
      if (!data instanceof Array || !data.length) return data
      const pages = []
      data.forEach((item, index) => {
        const i = Math.floor(index / PAGENUM)
        if (!pages[i]) {
          pages[i] = []
        }
        pages[i].push(Object.freeze(item))
      })
      return pages
    },
    handleSearch(str) {
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.resetClearTimerList()
        const pagingArr = this.paging(this.searchValue(str, this.treeData))
        this.filterTreeData.splice(0, this.filterTreeData.length, ...(pagingArr?.[0] || []))
        this.lazyRenderList(pagingArr, 1)
        uni.hideKeyboard()
      }, 300)
    },
    searchValue(str, arr) {
      const res = []
      arr.forEach((item) => {
        if (item[this.dataLabel].toLowerCase().indexOf(str.toLowerCase()) > -1) {
          res.push(item)
        } else {
          if (item[this.dataChildren]?.length) {
            const data = this.searchValue(str, item[this.dataChildren])
            if (data?.length) {
              res.push({
                ...item,
                [this.dataChildren]: data
              })
            }
          }
        }
      })
      return res
    },
    updateTreeData(arr) {
      if (arr.length) {
        for (let i = 0; i < arr.length; i++) {
          arr[i].checked = this.getTruthNode(arr[i]).checked
          if (arr[i][this.dataChildren]?.length) {
            this.updateTreeData(arr[i][this.dataChildren])
          }
        }
      }
    },
    getContentHeight({ screenHeight }) {
      this.contentHeight = `${Math.floor(screenHeight * 0.7)}px`
    },
    open() {
      if (this.disabled || this.clickOpen) return
      if (!this.treeData.length) {
        if (!this.clickOpen) {
          this.clickOpen = true
          this.clickOpenTimer = setTimeout(() => {
            if (this.clickOpen) {
              this.clickOpen = false
              uni.showToast({
                title: '暂无数据项',
                icon: 'none',
                duration: 1000
              })
            }
          }, 2000)
        }
        return
      }
      this.$bus.$on('custom-tree-select-node-click', (node) => {
        this.handleNodeClick(node)
      })
      this.$bus.$on('custom-tree-select-name-click', (node) => {
        this.handleHideChildren(node)
      })
      const pagingArr = this.paging(this.treeData)
      this.filterTreeData.push(...(pagingArr?.[0] || []))
      this.showPopup = true
      this.$nextTick(() => {
        this.$refs.popup.open()
        this.lazyRenderList(pagingArr, 1)
      })
    },
    lazyRenderList(arr, startIndex) {
      for (let i = startIndex; i < arr.length; i++) {
        let timer = null
        timer = setTimeout(() => {
          this.filterTreeData.push(...arr[i])
        }, i * 500)
        this.clearTimerList.push(() => clearTimeout(timer))
      }
    },
    close() {
      this.$refs.popup.close()
      this.showPopup = false
      this.$bus.$off('custom-tree-select-node-click')
      this.$bus.$off('custom-tree-select-name-click')
    },
    change(data) {
      if (!data.show) {
        this.resetClearTimerList()
        this.filterTreeData.splice(0, this.filterTreeData.length)
      }
      this.$emit('change', data)
    },
    resetClearTimerList() {
      const list = [...this.clearTimerList]
      this.clearTimerList.splice(0, this.clearTimerList.length)
      list.forEach((item) => item())
    },
    maskClick() {
      this.$emit('maskClick')
    },
    deepCopy(target) {
      let copyed_objs = [] //此数组解决了循环引用和相同引用的问题，它存放已经递归到的目标对象
      function _deepCopy(target) {
        if (typeof target !== 'object' || !target) {
          return target
        }
        for (let i = 0; i < copyed_objs.length; i++) {
          if (copyed_objs[i].target === target) {
            return copyed_objs[i].copyTarget
          }
        }
        let obj = {}
        if (Array.isArray(target)) {
          obj = [] //处理target是数组的情况
        }
        copyed_objs.push({ target: target, copyTarget: obj })
        Object.keys(target).forEach((key) => {
          if (obj[key]) {
            return
          }
          obj[key] = _deepCopy(target[key])
        })
        return obj
      }
      return _deepCopy(target)
    },
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
        this.$set(arr[i], 'showChildren', arr[i].showChildren ?? true)
        if (!arr[i].handleNodeClick) {
          this.$set(arr[i], 'handleNodeClick', this.handleNodeClick)
        }
        if (!arr[i].handleHideChildren) {
          this.$set(arr[i], 'handleHideChildren', this.handleHideChildren)
        }
        if (arr[i][this.dataChildren]?.length) {
          this.initData(arr[i][this.dataChildren])
        }
      }
    },
    isString(data) {
      return typeof data === 'string'
    },
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
    getParentNode(target, arr) {
      let res = []

      for (let i = 0; i < arr.length; i++) {
        if (arr[i][this.dataValue] === target[this.dataValue]) {
          return [arr[i]]
        }

        if (arr[i][this.dataChildren]?.length) {
          const result = this.getParentNode(target, arr[i][this.dataChildren])
          if (result.length && arr[i].visible) {
            res = [...result, arr[i]]
          }
        }
      }
      return res
    },
    getContiguousNodes(target, arr) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i][this.dataValue] === target[this.dataValue]) {
          return arr.reduce((pre, val) => {
            if (val.visible) {
              return [...pre, val]
            }
            return pre
          }, [])
        }

        if (arr[i][this.dataChildren]?.length) {
          const res = this.getContiguousNodes(target, arr[i][this.dataChildren])
          if (res.length) return res
        }
      }

      return []
    },
    allChecked(value, arr) {
      for (let i = 0; i < arr.length; i++) {
        if (!value.includes(arr[i][this.dataValue].toString())) {
          return false
        }
      }
      return true
    },
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
    handleNodeClick(node) {
      node = this.getTruthNode(node)
      node.checked = !node.checked
      // 如果是单选不考虑其他情况
      if (!this.mutiple) {
        if (node.checked) {
          this.$emit(
            'input',
            this.isString(this.value) ? node[this.dataValue].toString() : [node[this.dataValue].toString()]
          )
        } else {
          this.$emit('input', this.isString(this.value) ? '' : [])
        }
        this.close()
      } else {
        // 多选情况
        if (!this.linkage) {
          // 不需要联动
          let emitData = null
          if (node.checked) {
            emitData = Array.from(new Set([...this.selectList, node[this.dataValue].toString()]))
          } else {
            emitData = this.selectList.filter((id) => id !== node[this.dataValue].toString())
          }
          this.$emit('input', this.isString(this.value) ? emitData.join(',') : emitData)
        } else {
          // 需要联动
          let emitData = [...this.selectList]
          let childrenVal = []
          if (node[this.dataChildren]?.length) {
            childrenVal = this.getChildren(node)
              .filter((item) => !item.disabled)
              .map((item) => item[this.dataValue].toString())
          }
          const contiguousNodes = this.getContiguousNodes(node, this.treeData).filter((item) => !item.disabled)
          const [_, ...parentNodes] = this.getParentNode(node, this.treeData)
          if (node.checked) {
            // 选中
            emitData = Array.from(new Set([...emitData, node[this.dataValue].toString()]))
            if (childrenVal.length) {
              // 选中全部子节点
              emitData = Array.from(new Set([...emitData, ...childrenVal]))
            }
            if (parentNodes.length && this.allChecked(emitData, contiguousNodes)) {
              // 有父元素 如果父元素下所有子元素全部选中，选中父元素
              while (parentNodes.length) {
                const item = parentNodes.shift()
                if (!item.disabled) {
                  const children = this.getChildren(item).filter((child) => !child.disabled)
                  if (this.allChecked(emitData, children)) {
                    emitData = Array.from(new Set([...emitData, item[this.dataValue].toString()]))
                  } else {
                    break
                  }
                }
              }
            }
          } else {
            // 取消选中
            emitData = emitData.filter((id) => id !== node[this.dataValue].toString())
            if (childrenVal.length) {
              // 取消选中全部子节点
              childrenVal.forEach((childVal) => {
                emitData = emitData.filter((id) => id !== childVal)
              })
            }
          }
          this.$emit('input', this.isString(this.value) ? emitData.join(',') : emitData)
        }
      }
    },
    handleHideChildren(node) {
      if (!node[this.dataChildren]?.length) return
      this.$set(node, 'showChildren', !node.showChildren)
    },
    getName(id) {
      const arr = [...this.treeData]

      while (arr.length) {
        const item = arr.shift()

        if (item[this.dataValue].toString() === id) {
          return item[this.dataLabel]
        }

        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }

      return ''
    },
    removeSelectedItem(id) {
      const emitData = this.selectList.filter((item) => item !== id)
      this.$emit('input', this.isString(this.value) ? emitData.join(',') : emitData)
    },
    clear() {
      if (this.disabled) return
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
    align-items: center;

    &.active {
      padding: 4px 0 4px 10px;
    }

    .left {
      flex: 1;
      display: flex;
      flex-wrap: wrap;

      .select-item {
        margin: 4px 10px 4px 0;
        padding: 4px 5px;
        max-width: auto;
        height: auto;
        background-color: #007aff;
        border-radius: 4px;
        color: #fff;
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
  }

  .no-data {
    width: auto;
    color: #999;
    font-size: 12px;
  }

  .no-data.center {
    text-align: center;
  }

  .rotating {
    animation: ROTATING 1s infinite linear;
  }

  @keyframes ROTATING {
    form {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
