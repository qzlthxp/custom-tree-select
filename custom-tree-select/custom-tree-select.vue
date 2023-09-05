<template>
  <view class="custom-tree-select-content">
    <view
      :class="['select-list', { disabled }, { active: selectList.length }]"
      @click.stop="open"
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
              v-if="!disabled && !item.disabled"
              class="close"
              @click.stop="removeSelectedItem(item)"
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
      <view
        class="popup-content"
        :style="{ height: contentHeight || defaultContentHeight }"
      >
        <view class="title">
          <view
            v-if="mutiple && canSelectAll"
            class="left"
            @click.stop="handleSelectAll"
          >
            <text>{{ isSelectedAll ? '取消全选' : '全选' }}</text>
          </view>
          <view class="center">
            <text>{{ placeholder }}</text>
          </view>
          <view
            class="right"
            :style="{ color: confirmTextColor }"
            @click.stop="close"
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
          >
          </uni-easyinput>
          <button
            type="primary"
            size="mini"
            class="search-btn"
            @click.stop="handleSearch(false)"
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
              :linkage="linkage"
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
const partCheckedSet = new Set()
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
    contentHeight: {
      type: String
    },
    disabledList: {
      type: Array,
      default: () => []
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
      defaultContentHeight: '500px',
      treeData: [],
      filterTreeData: [],
      clearTimerList: [],
      selectedListBaseinfo: [],
      showPopup: false,
      clickOpenTimer: null,
      isSelectedAll: false,
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
    }
  },
  watch: {
    listData: {
      deep: true,
      immediate: true,
      handler(newVal) {
        if (newVal) {
          partCheckedSet.clear()
          this.treeData = this.initData(newVal)

          if (this.value !== null) {
            const ids = Array.isArray(this.value)
              ? this.value
              : typeof this.value === 'string'
              ? this.value.split(',')
              : []
            this.changeStatus(this.treeData, ids, true)
            this.filterTreeData.length &&
              this.changeStatus(this.filterTreeData, ids)
          }
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
        if (newVal !== null) {
          const ids = Array.isArray(newVal)
            ? newVal
            : typeof newVal === 'string'
            ? newVal.split(',')
            : []
          this.changeStatus(this.treeData, ids, true)
          this.filterTreeData.length &&
            this.changeStatus(this.filterTreeData, ids)
        }
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
    // 获取对应数据
    getReflectNode(node, arr) {
      const array = [...arr]
      while (array.length) {
        const item = array.shift()
        if (item[this.dataValue] === node[this.dataValue]) {
          return item
        }
        if (item[this.dataChildren]?.length) {
          array.push(...item[this.dataChildren])
        }
      }
      return {}
    },
    getContentHeight({ screenHeight }) {
      this.defaultContentHeight = `${Math.floor(screenHeight * 0.7)}px`
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
      this.clearTimerList = []
      list.forEach((fn) => fn())
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
          ...arr[i],
          [this.dataLabel]: arr[i][this.dataLabel],
          [this.dataValue]: arr[i][this.dataValue]
        }

        obj.checked = this.selectList.includes(
          arr[i][this.dataValue].toString()
        )

        obj.disabled = false
        if (
          Boolean(arr[i].disabled) ||
          this.disabledList.includes(obj[this.dataValue].toString())
        ) {
          obj.disabled = true
        }

        //半选
        obj.partChecked = Boolean(
          arr[i].partChecked === undefined ? false : arr[i].partChecked
        )
        obj.partChecked && obj.partCheckedSet.add(obj[this.dataValue])
        !obj.partChecked && (this.isSelectedAll = false)

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

        if (arr[i][this.dataChildren]?.length) {
          const childrenVal = this.initData(
            arr[i][this.dataChildren],
            obj.visible
          )
          obj[this.dataChildren] = childrenVal
          if (
            !obj.checked &&
            childrenVal.some((item) => item.checked || item.partChecked)
          ) {
            obj.partChecked = true
            partCheckedSet.add(obj[this.dataValue])
          }
        }

        res.push(obj)
      }

      return res
    },
    // 获取某个节点后面所有元素
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
    // 获取某个节点所有祖先元素
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
    handleNodeClick(data, status) {
      const node = this.getReflectNode(data, this.treeData)
      node.checked = typeof status === 'boolean' ? status : !node.checked
      node.partChecked = false
      partCheckedSet.delete(node[this.dataValue])
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
              // 孩子节点全部选中并且清除半选状态
              childrenVal.forEach((childNode) => {
                childNode.partChecked = false
                partCheckedSet.delete(childNode[this.dataValue])
              })
            }
            if (parentNodes.length) {
              let flag = false
              // 有父元素 如果父元素下所有子元素全部选中，选中父元素
              while (parentNodes.length) {
                const item = parentNodes.shift()
                if (!item.disabled) {
                  if (flag) {
                    // 前一个没选中并且为半选那么之后的全为半选
                    item.partChecked = true
                    partCheckedSet.add(item[this.dataValue])
                  } else {
                    const allChecked = item[this.dataChildren]
                      .filter((node) => node.visible && !node.disabled)
                      .every((node) => node.checked)
                    if (allChecked) {
                      item.checked = true
                      item.partChecked = false
                      partCheckedSet.delete(item[this.dataValue])
                      emitData = Array.from(
                        new Set([...emitData, item[this.dataValue].toString()])
                      )
                    } else {
                      item.partChecked = true
                      partCheckedSet.add(item[this.dataValue])
                      flag = true
                    }
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
              childrenVal.forEach((childNode) => {
                emitData = emitData.filter(
                  (id) => id !== childNode[this.dataValue].toString()
                )
              })
            }
            if (parentNodes.length) {
              parentNodes.forEach((parentNode) => {
                if (emitData.includes(parentNode[this.dataValue].toString())) {
                  parentNode.checked = false
                }
                emitData = emitData.filter(
                  (id) => id !== parentNode[this.dataValue].toString()
                )
                const hasChecked = parentNode[this.dataChildren]
                  .filter((node) => node.visible && !node.disabled)
                  .some((node) => node.checked || node.partChecked)

                parentNode.partChecked = hasChecked
                if (hasChecked) {
                  partCheckedSet.add(parentNode[this.dataValue])
                } else {
                  partCheckedSet.delete(parentNode[this.dataValue])
                }
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
      this.getReflectNode(node, this.treeData).showChildren = status
      this.getReflectNode(node, this.filterTreeData).showChildren = status
    },
    // 根据 dataValue 找节点
    changeStatus(list, ids, needEmit = false) {
      const arr = [...list]
      let flag = true
      needEmit && (this.selectedListBaseinfo = [])

      while (arr.length) {
        const item = arr.shift()

        if (ids.includes(item[this.dataValue].toString())) {
          this.$set(item, 'checked', true)
          needEmit && this.selectedListBaseinfo.push(item)
          // 数据被选中清除半选状态
          item.partChecked = false
          partCheckedSet.delete(item[this.dataValue])
        } else {
          this.$set(item, 'checked', false)
          if (item.visible && !item.disabled) {
            flag = false
          }
          if (partCheckedSet.has(item[this.dataValue])) {
            this.$set(item, 'partChecked', true)
          } else {
            this.$set(item, 'partChecked', false)
          }
        }

        if (item[this.dataChildren]?.length) {
          arr.push(...item[this.dataChildren])
        }
      }
      this.isSelectedAll = flag
      needEmit && this.$emit('selectChange', [...this.selectedListBaseinfo])
    },
    // 移除选项
    removeSelectedItem(node) {
      this.isSelectedAll = false
      if (this.linkage) {
        this.handleNodeClick(node, false)
        this.$emit('removeSelect', node)
      } else {
        const emitData = this.selectList.filter(
          (item) => item !== node[this.dataValue].toString()
        )
        this.$emit('removeSelect', node)
        this.$emit(
          'input',
          isString(this.value) ? emitData.join(',') : emitData
        )
      }
    },
    // 全部选中
    handleSelectAll() {
      this.isSelectedAll = !this.isSelectedAll
      if (this.isSelectedAll) {
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
          if (item.visible || (item.disabled && item.checked)) {
            emitData = Array.from(
              new Set([...emitData, item[this.dataValue].toString()])
            )
            if (item[this.dataChildren]?.length) {
              emitData = Array.from(
                new Set([
                  ...emitData,
                  ...this.getChildren(item)
                    .filter(
                      (item) =>
                        !item.disabled || (item.disabled && item.checked)
                    )
                    .map((item) => item[this.dataValue].toString())
                ])
              )
            }
          }
        })
        this.$emit(
          'input',
          isString(this.value) ? emitData.join(',') : emitData
        )
      } else {
        this.clear()
      }
    },
    // 清空选项
    clear() {
      if (this.disabled) return
      const emitData = []
      partCheckedSet.clear()
      this.selectedListBaseinfo.forEach((node) => {
        if (node.visible && node.checked && node.disabled) {
          emitData.push(node[this.dataValue])
        }
      })
      this.$emit('input', isString(this.value) ? emitData.join(',') : emitData)
    }
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #007aff;
$col-sm: 4px;
$col-base: 8px;
$col-lg: 12px;
$row-sm: 5px;
$row-base: 10px;
$row-lg: 15px;
$radius-sm: 3px;
$radius-base: 6px;

.custom-tree-select-content {
  .select-list {
    padding-left: $row-base;
    min-height: 35px;
    border: 1px solid #e5e5e5;
    border-radius: $radius-sm;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.active {
      padding: calc(#{$col-sm} / 2) 0 calc(#{$col-sm} / 2) $row-base;
    }

    .left {
      flex: 1;

      .select-items {
        display: flex;
        flex-wrap: wrap;
      }

      .select-item {
        margin: $col-sm $row-base $col-sm 0;
        padding: $col-sm $row-sm;
        max-width: auto;
        height: auto;
        background-color: #eaeaea;
        border-radius: $radius-sm;
        color: #333;
        display: flex;
        align-items: center;

        .name {
          flex: 1;
          padding-right: $row-base;
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
      margin-right: $row-sm;
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
      padding: $col-base 3rem;
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
      margin: $col-base $row-base 0;
      background-color: #fff;
      display: flex;
      align-items: center;

      .search-btn {
        margin-left: $row-base;
        height: 35px;
        line-height: 35px;
      }
    }

    .select-content {
      margin: $col-base $row-base;
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
