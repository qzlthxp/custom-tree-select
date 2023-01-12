<template>
  <view class="custom-tree-select-content">
    <view v-if="node.visible" class="custom-tree-select-item">
      <view class="item-content" :style="{ paddingLeft: `${level * 10}px` }">
        <view class="left" @click.stop="nameClick(node)">
          <view
            :class="[
              'icon',
              {
                active: node.showChildren
              },
              { 'last-level': !node[dataChildren] || (node[dataChildren] && !node[dataChildren].length) }
            ]"
          ></view>
          <view class="name" :style="node.disabled ? 'color: #999' : ''">
            <text>{{ node[dataLabel] }}</text>
          </view>
        </view>
        <checkbox
          v-if="
            choseParent ||
            (!choseParent && !node[dataChildren]) ||
            (!choseParent && node[dataChildren] && !node[dataChildren].length)
          "
          :disabled="node.disabled"
          :value="node[dataValue].toString()"
          :checked="node.checked"
          @click.stop="nodeClick(node)"
        />
      </view>
    </view>
    <view v-if="node.showChildren && node[dataChildren] && node[dataChildren].length">
      <data-select-item
        v-for="item in node[dataChildren]"
        :key="item[dataValue]"
        :node="item"
        :dataLabel="dataLabel"
        :dataValue="dataValue"
        :dataChildren="dataChildren"
        :choseParent="choseParent"
        :level="level + 1"
      ></data-select-item>
    </view>
  </view>
</template>

<script>
import dataSelectItem from './data-select-item.vue'
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
    level: {
      type: Number,
      default: 0
    }
  },
  methods: {
    nameClick(node) {
      // #ifdef MP-WEIXIN
      this.$bus.$emit('custom-tree-select-name-click', node)
      // #endif

      // #ifndef MP-WEIXIN
      node.handleHideChildren(node)
      // #endif
    },
    nodeClick(node) {
      if (!node.disabled) {
        // #ifdef MP-WEIXIN
        this.$bus.$emit('custom-tree-select-node-click', node)
        // #endif

        // #ifndef MP-WEIXIN
        node.handleNodeClick(node)
        // #endif
      }
    }
  },
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.custom-tree-select-content {
  /deep/ .uni-checkbox-input {
    margin: 0 !important;
  }

  .item-content {
    margin: 16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:first-child {
      margin-top: 0;
    }

    .left {
      padding-right: 10px;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .icon {
      margin: 0 5px;
      border-style: solid;
      border-color: transparent;
      border-width: 5px 0 5px 5px;
      border-left-color: #000;
      transition: transform 0.2s ease;

      &.active {
        transform: rotate(90deg);
      }

      &.last-level {
        width: 5px;
        height: 5px;
        border-radius: 5px;
        background-color: #000;
        border: none;
      }
    }

    .name {
      flex: 1;
      height: auto;
      word-break: break-all;
    }
  }
}
</style>
