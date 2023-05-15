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
          <view
            v-if="mutiple && canSelectAll"
            class="left"
            @click="handleSelectAll"
          >
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
            @confirm="handleSearch(false)"
            @clear="handleSearch(true)"
          ></uni-easyinput>
          <button
            type="primary"
            size="mini"
            class="search-btn"
            @click="handleSearch(false)"
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
import { isString, paging } from './utils'
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
      default: false
    },
    safeArea: {
      type: Boolean,
      default: true
    },
    search: {
      type: Boolean,
      default: false
    },
    clearResetSearch: {
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
      isSelectedAll: false,
      clickOpenTimer: null,
      scrollTop: 0,
      searchStr: ''
    }
  },
  computed: {
    selectList() {
      const newVal = this.value === null ? '' : this.value
      return isString(newVal)
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
          this.isSelectedAll = true
          this.treeData = this.initData(newVal)
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
        this.changeStatus(this.treeData, ids, true)
        this.changeStatus(this.filterTreeData, ids, true)
      }
    }
  },
  mounted() {
    this.getContentHeight(uni.getSystemInfoSync())
  },
  methods: {
    // 搜索完成返回顶部
    goTop() {
      this.scrollTop = 10
      this.$nextTick(() => {
        this.scrollTop = 0
      })
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
    // 处理搜索
    handleSearch(isClear = false) {
      this.resetClearTimerList()
      if (isClear) {
        // 点击清空按钮并且设置清空按钮会重置搜索
        if (this.clearResetSearch) {
          this.renderTree(this.treeData)
        }
      } else {
        this.renderTree(this.searchValue(this.searchStr, this.treeData))
      }
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
      const pagingArr = paging(arr)
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
    // 中断懒加载
    resetClearTimerList() {
      const list = [...this.clearTimerList]
      this.clearTimerList.splice(0, this.clearTimerList.length)
      list.forEach((item) => item())
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
        uni.$on('custom-tree-select-node-click', this.handleNodeClick)
        uni.$on('custom-tree-select-name-click', this.handleHideChildren)
      } else {
        uni.$off('custom-tree-select-node-click', this.handleNodeClick)
        uni.$off('custom-tree-select-name-click', this.handleHideChildren)
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
    // 点击遮罩
    maskClick() {
      this.$emit('maskClick')
    },
    // 初始化数据
    initData(arr, parentVisible) {
      if (!Array.isArray(arr)) return []
      const res = []

      for (let i = 0; i < arr.length; i++) {
        const obj = {
          [this.dataLabel]: arr[i][this.dataLabel],
          [this.dataValue]: arr[i][this.dataValue]
        }

        obj.checked = this.selectList.includes(
          arr[i][this.dataValue].toString()
        )

        obj.disabled = Boolean(arr[i].disabled)

        const parentVisibleState =
          parentVisible === undefined ? true : parentVisible
        const curVisibleState =
          arr[i].visible === undefined ? true : Boolean(arr[i].visible)
        if (parentVisibleState === curVisibleState) {
          obj.visible = parentVisibleState
        } else if (!parentVisibleState || !curVisibleState) {
          obj.visible = false
        } else {
          obj.visible = true
        }

        obj.showChildren =
          'showChildren' in arr[i] && arr[i].showChildren != undefined
            ? arr[i].showChildren
            : this.showChildren

        if (arr[i].visible && !arr[i].disabled && !arr[i].checked) {
          this.isSelectedAll = false
        }

        if (arr[i][this.dataChildren]?.length) {
          obj[this.dataChildren] = this.initData(
            arr[i][this.dataChildren],
            obj.visible
          )
        }

        res.push(obj)
      }

      return res
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
          if (typeof childRes === 'boolean' && childRes) {
            res = [arr[i]]
          } else if (Array.isArray(childRes) && childRes.length) {
            res = [...childRes, arr[i]]
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
          isString(this.value) ? emitData.join(',') : emitData
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
            isString(this.value) ? emitData.join(',') : emitData
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
              // 有父元素 如果父元素下所有子元素全部选中，选中父元素
              while (parentNodes.length) {
                const item = parentNodes.shift()
                if (!item.disabled) {
                  const allChecked = item[this.dataChildren]
                    .filter((node) => node.visible)
                    .every((node) => node.checked)
                  if (allChecked) {
                    item.checked = true
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
            isString(this.value) ? emitData.join(',') : emitData
          )
        }
      }
    },
    // 点击名称折叠或展开
    handleHideChildren(node) {
      const status = !node.showChildren
      this.getTruthNode(node).showChildren = status
      this.getFilterTreeNode(node).showChildren = status
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
    changeStatus(list, ids, checkedState) {
      const arr = [...list]
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

        if (!item.checked) {
          this.isSelectedAll = false
        }

        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }

      return null
    },
    // 移除选项
    removeSelectedItem(id) {
      this.changeStatus(this.treeData, [id], false)
      const emitData = this.selectList.filter((item) => item !== id)
      this.$emit('input', isString(this.value) ? emitData.join(',') : emitData)
    },
    // 全部选中
    handleSelectAll() {
      if (this.isSelectedAll) return
      this.isSelectedAll = true
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
      this.$emit('input', isString(this.value) ? emitData.join(',') : emitData)
    },
    // 清空选项
    clear() {
      if (this.disabled) return
      this.$emit('input', isString(this.value) ? '' : [])
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
