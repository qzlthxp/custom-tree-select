<template>
  <view class="custom-tree-select-content">
    <view
      :class="['select-list', { disabled }, { active: selectList.length }]"
      @click="open"
    >
      <view class="left">
        <view v-if="selectList.length" class="select-items">
          <view class="select-item" v-for="item in selectList" :key="item">
            <view class="name">
              <text>{{ getName(item) }}</text>
            </view>
            <view
              v-if="!disabled"
              class="close"
              @click.stop="removeSelectedItem(item)"
            >
              <uni-icons type="closeempty" size="16" color="#999"></uni-icons>
            </view>
          </view>
        </view>
        <view v-if="!selectList.length" style="color: #6a6a6a" class="no-data">
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
          <view class="center">
            <text>{{ placeholder }}</text>
          </view>
          <view
            :style="{ color: confirmTextColor }"
            class="right"
            @click="close()"
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
      let curVal = this.value === null ? '' : this.value
      return typeof curVal === 'string'
        ? curVal.length
          ? curVal.split(',')
          : []
        : curVal.map((item) => item.toString())
    }
  },
  watch: {
    listData: {
      deep: true,
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.treeData = this.deepCopy(newVal)
          this.initData(this.treeData)
          if (this.showPopup) {
            this.resetClearTimerList()
            this.renderTree(this.treeData)
          }
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
            item[this.dataLabel].toLowerCase().indexOf(str.toLowerCase()) > -1
          ) {
            res.push(item)
          } else {
            if (item[this.dataChildren]?.length) {
              const data = this.searchValue(str, item[this.dataChildren])
              if (data?.length) {
                if (!item.showChildren && item[this.dataChildren]?.length) {
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
    getContentHeight({ screenHeight }) {
      this.contentHeight = `${Math.floor(screenHeight * 0.7)}px`
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
    // 获取某个节点所有兄弟元素
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
    // 某个节点下一层所有节点是否都被选中
    allChecked(value, arr) {
      for (let i = 0; i < arr.length; i++) {
        if (!value.includes(arr[i][this.dataValue].toString())) {
          return false
        }
      }
      return true
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
    // 点击checkbox
    handleNodeClick(node) {
      node = this.getTruthNode(node)
      node.checked = !node.checked
      // 如果是单选不考虑其他情况
      if (!this.mutiple) {
        if (node.checked) {
          this.$emit(
            'input',
            this.isString(this.value)
              ? node[this.dataValue].toString()
              : [node[this.dataValue].toString()]
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
          let childrenVal = []
          if (node[this.dataChildren]?.length) {
            childrenVal = this.getChildren(node)
              .filter((item) => !item.disabled)
              .map((item) => item[this.dataValue].toString())
          }
          const contiguousNodes = this.getContiguousNodes(
            node,
            this.treeData
          ).filter((item) => !item.disabled)
          const [_, ...parentNodes] = this.getParentNode(node, this.treeData)
          if (node.checked) {
            // 选中
            emitData = Array.from(
              new Set([...emitData, node[this.dataValue].toString()])
            )
            if (childrenVal.length) {
              // 选中全部子节点
              emitData = Array.from(new Set([...emitData, ...childrenVal]))
            }
            if (
              parentNodes.length &&
              this.allChecked(emitData, contiguousNodes)
            ) {
              // 有父元素 如果父元素下所有子元素全部选中，选中父元素
              while (parentNodes.length) {
                const item = parentNodes.shift()
                if (!item.disabled) {
                  const children = this.getChildren(item).filter(
                    (child) => !child.disabled
                  )
                  if (this.allChecked(emitData, children)) {
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
            if (childrenVal.length) {
              // 取消选中全部子节点
              childrenVal.forEach((childVal) => {
                emitData = emitData.filter((id) => id !== childVal)
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
      this.getFilterTreeNode(node).showChildren =
        !this.getFilterTreeNode(node).showChildren
    },
    // 根据id展示内容
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
    // 移除选项
    removeSelectedItem(id) {
      const emitData = this.selectList.filter((item) => item !== id)
      this.$emit(
        'input',
        this.isString(this.value) ? emitData.join(',') : emitData
      )
    },
    // 清空选项
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
