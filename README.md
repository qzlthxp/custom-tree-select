# custom-tree-select 使用指南

**提示：**使用该插件前确保你已经导入 `uni-popup` `uni-icons` `uni-easyinput` 插件。

当前插件主要作为表单中选择器来使用，如果只是作为弹窗会出现数据状态无法重置，此时推荐使用 [`custom-tree-popup`](https://ext.dcloud.net.cn/plugin?name=custom-tree-popup) 组件。 

**如果在微信小程序中使用，在 `main.js` 文件中添加以下代码**

```js
// #ifdef MP-WEIXIN
  Vue.prototype.$bus = new Vue()
// #endif
```

## 优势

💪：基于 `uni-popup` `uni-icons` `uni-easyinput`插件进行开发，默认样式与 `uni-easyinput` 样式对标。

⚡：全面支持懒加载应对大量数据。

🚀：v-model 绑定数据、数据回显、移除选项。

⚙  ：提供更多配置项。

📦：开箱即用。

## Props

|        属性名         |      类型       |     默认值      |                             说明                             |
| :-------------------: | :-------------: | :-------------: | :----------------------------------------------------------: |
|       animation       |     Boolean     |      ture       |                       是否开启弹窗动画                       |
|     is-mask-click     |     Boolean     |      true       |                       点击遮罩关闭弹窗                       |
| mask-background-color |     String      | rgba(0,0,0,0.4) |                蒙版颜色，建议使用 rgba 颜色值                |
|   background-color    |     String      |      none       |                         主窗口背景色                         |
|       safe-area       |     Boolean     |      true       |                      是否适配底部安全区                      |
|      choseParent      |     Boolean     |      true       |                        父节点是否可选                        |
|        linkage        |     Boolean     |      false      |                       父子节点是否联动                       |
|      placeholder      |     String      |        -        |                   空状态信息提示、弹窗标题                   |
|      confirmText      |     String      |      完成       |                         确定按钮文字                         |
|   confirmTextColor    |     String      |     #007aff     |                       确定按钮文字颜色                       |
|       listData        |      Array      |        -        |                          展示的数据                          |
|       dataLabel       |     String      |      name       |                   listData中对应数据的key                    |
|       dataValue       |     String      |       id        |                  listData中对应数据的value                   |
|     dataChildren      |     String      |    children     |              listData中对应数据的children的key               |
|       clearable       |     Boolean     |      false      |             是否显示清除按钮，点击清除所有已选项             |
|        mutiple        |     Boolean     |      false      |                         是否可以多选                         |
|       disabled        |     Boolean     |      false      |                         是否允许修改                         |
|        search         |     Boolean     |      false      |             是否可以搜索（常用于数据较多的情况）             |
|           -           | Array \| String |       [ ]       | 已选择的值，通过 v-model 进行绑定，例如：v-model="formData.selectedList" ，根据你绑定数据的类型自动返回相同类型的数据，String类型通过 `,` 进行分隔。如果没有使用 v-model 绑定数据，那么默认为 `Array` 类型，`selectedChange` 事件接受的数据也是 `Array` 类型 |

## Events

| 事件名称  | 说明                     | 返回值                              |
| --------- | ------------------------ | ----------------------------------- |
| change    | 弹窗组件状态发生变化触发 | e={show: true｜false,type:当前模式} |
| maskClick | 点击遮罩层触发           |                                     |

## 基础使用示例

```vue
<template>
  <!--/pages/index/index-->
  <custom-tree-select :listData="listData" v-model="formData.selected1" placeholder="请选择" />
  <custom-tree-select :listData="listData" v-model="formData.selected2" placeholder="请选择" />
</template>

<script>
export default {
  data() {
    return {
      formData: {
        selected1: [],
        selected2: ''
      },
      listData: [
        {
          id: 1,
          name: '城市1',
          children: [
            {
              id: 3,
              name: '街道1',
              children: [
                {
                  id: 4,
                  name: '小区1'
                },
                {
                  id: 5,
                  name: '小区2'
                }
              ]
            }
          ]
        },
        {
          id: 2,
          name: '城市2',
          children: [
            {
              id: 6,
              name: '街道2'
            }
          ]
        },
        {
          id: 7,
          name: '城市3',
          children: [
            {
              id: 8,
              name: '街道1'
            },
            {
              id: 9,
              name: '街道2'
            },
            {
              id: 10,
              name: '街道10'
            }
          ]
        }
      ]
    }
  }
}
</script>
```

## 禁用某些选项，或隐藏某些选项

```vue
<template>
  <!--/pages/index/index-->
  <custom-tree-select
    placeholder="请选择"
    dataLabel="text"
    dataValue="value"
    :mutiple="true"
    :listData="listData"
    :linkage="true"
    :clearable="true"
    :search="true"
    v-model="selected"
  ></custom-tree-select>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        selected: ''
      },
      listData: [
        {
          value: 1,
          text: '城市1',
          children: [
            {
              value: 3,
              text: '街道1',
              children: [
                {
                  value: 4,
                  text: '小区1',
                  disabled: true
                },
                {
                  value: 5,
                  text: '小区2'
                }
              ]
            }
          ]
        },
        {
          value: 2,
          text: '城市2',
          children: [
            {
              value: 6,
              text: '街道2'
            }
          ]
        },
        {
          value: 7,
          text: '城市3',
          visible: false,
          children: [
            {
              value: 8,
              text: '街道1'
            },
            {
              value: 9,
              text: '街道2'
            },
            {
              value: 10,
              text: '街道10'
            }
          ]
        }
      ]
    }
  }
}
</script>
```

