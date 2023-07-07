<template>
  <view
    class="custom-tree-select-content"
    :class="{
      border:
        border &&
        node[dataChildren] &&
        node[dataChildren].length &&
        node.showChildren
    }"
    :style="{ marginLeft: `${level ? 14 : 0}px` }"
  >
    <view v-if="node.visible" class="custom-tree-select-item">
      <view class="item-content">
        <view class="left">
          <view
            v-if="node[dataChildren] && node[dataChildren].length"
            :class="['right-icon', { active: node.showChildren }]"
          >
            <uni-icons type="right" size="14" color="#333"></uni-icons>
          </view>
          <view v-else class="smallcircle-filled">
            <uni-icons
              class="smallcircle-filled-icon"
              type="smallcircle-filled"
              size="10"
              color="#333"
            ></uni-icons>
          </view>
          <view
            class="name"
            :style="node.disabled ? 'color: #999' : ''"
            @click.stop="nameClick(node)"
          >
            <text>{{ node[dataLabel] }}</text>
          </view>
        </view>
        <view
          v-if="
            choseParent ||
            (!choseParent && !node[dataChildren]) ||
            (!choseParent && node[dataChildren] && !node[dataChildren].length)
          "
          :class="['check-box', { disabled: node.disabled }]"
          @click.stop="nodeClick(node)"
        >
          <view
            v-if="!node.checked && node.partChecked"
            class="part-checked"
          ></view>
          <uni-icons
            v-if="node.checked"
            type="checkmarkempty"
            size="18"
            :color="node.disabled ? '#333' : '#007aff'"
          ></uni-icons>
        </view>
      </view>
    </view>
    <view
      v-if="
        node.showChildren && node[dataChildren] && node[dataChildren].length
      "
    >
      <data-select-item
        v-for="item in listData"
        :key="item[dataValue]"
        :node="item"
        :dataLabel="dataLabel"
        :dataValue="dataValue"
        :dataChildren="dataChildren"
        :choseParent="choseParent"
        :border="border"
        :level="level + 1"
      ></data-select-item>
    </view>
  </view>
</template>

<script>
import dataSelectItem from './data-select-item.vue'
import { paging } from './utils'
export default {
  name: 'data-select-item',
  components: {
    'data-select-item': dataSelectItem
  },
  props: {
    node: {
      type: Object,
      default: () => ({})
    },
    choseParent: {
      type: Boolean,
      default: true
    },
    dataLabel: {
      type: String,
      default: 'name'
    },
    dataValue: {
      type: String,
      default: 'value'
    },
    dataChildren: {
      type: String,
      default: 'children'
    },
    border: {
      type: Boolean,
      default: false
    },
    level: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      listData: [],
      clearTimerList: []
    }
  },
  computed: {
    watchData() {
      const { node, dataChildren } = this

      return {
        node,
        dataChildren
      }
    }
  },
  watch: {
    watchData: {
      immediate: true,
      handler(newVal) {
        const { node, dataChildren } = newVal
        if (
          node.showChildren &&
          node[dataChildren] &&
          node[dataChildren].length
        ) {
          this.resetClearTimerList()
          this.renderTree(node[dataChildren])
        }
      }
    }
  },
  methods: {
    // 懒加载
    renderTree(arr) {
      const pagingArr = paging(arr)
      this.listData.splice(0, this.listData.length, ...(pagingArr?.[0] || []))
      this.lazyRenderList(pagingArr, 1)
    },
    // 懒加载具体逻辑
    lazyRenderList(arr, startIndex) {
      for (let i = startIndex; i < arr.length; i++) {
        let timer = null
        timer = setTimeout(() => {
          this.listData.push(...arr[i])
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
    nameClick(node) {
      if (
        !node.showChildren &&
        node[this.dataChildren] &&
        node[this.dataChildren].length
      ) {
        // 打开
        this.renderTree(node[this.dataChildren])
      } else {
        // 关闭
        this.resetClearTimerList()
        this.listData.splice(0, this.listData.length)
      }
      uni.$emit('custom-tree-select-name-click', node)
    },
    nodeClick(node) {
      if (!node.disabled) {
        uni.$emit('custom-tree-select-node-click', node)
      }
    }
  },
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

$primary-color: #007aff;
$col-sm: 4px;
$col-base: 8px;
$col-lg: 12px;
$row-sm: 5px;
$row-base: 10px;
$row-lg: 15px;
$radius-sm: 3px;
$radius-base: 6px;
$border-color: #c8c7cc;

.custom-tree-select-content {
  &.border {
    border-left: 1px solid $border-color;
  }

  /deep/ .uni-checkbox-input {
    margin: 0 !important;
  }

  .item-content {
    margin: 0 0 $col-lg;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 3px;
      background-color: #fff;
      transform: translateX(-2px);
      z-index: 1;
    }

    .left {
      flex: 1;
      display: flex;
      align-items: center;

      .right-icon {
        transition: 0.15s ease;

        &.active {
          transform: rotate(90deg);
        }
      }

      .smallcircle-filled {
        width: 14px;
        height: 13.6px;
        display: flex;
        align-items: center;

        .smallcircle-filled-icon {
          transform-origin: center;
          transform: scale(0.55);
        }
      }

      .name {
        flex: 1;
      }
    }
  }
}

.check-box {
  width: 23.6px;
  height: 23.6px;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  display: flex;
  justify-content: center;
  align-items: center;

  &.disabled {
    background-color: rgb(225, 225, 225);
  }

  .part-checked {
    width: 60%;
    height: 2px;
    background-color: $primary-color;
  }
}
</style>
