/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
/**
 * @file Register the actions of the tree
 * @author Deqing Li(annong035@gmail.com)
 */
import * as echarts from '../../echarts'
import { updateCenterAndZoom } from '../../action/roamHelper'

echarts.registerAction({
  type: 'treeExpandAndCollapse',
  event: 'treeExpandAndCollapse',
  update: 'update'
}, function (payload, ecModel, api) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var dataIndex = payload.dataIndex
    var dataName = payload.dataName
    var dataKey = payload.dataKey
    var data = seriesModel.getData()
    var tree = data.tree
    var node = null
    if (dataIndex) {
      node = tree.getNodeByDataIndex(dataIndex)
    } else if (dataName) {
      node = tree.getNodeListByName(dataName)
      node = node.length === 1
             ? node[0]
             : node.find(function (item) {
          return data.getRawDataItem(item.dataIndex).key === dataKey
        })
    } else if (dataKey) {
      try {
        data.each(function (idx) {
          if (data.getRawDataItem(idx).key === dataKey) {
            node = tree.getNodeByDataIndex(idx)
            throw new Error('break')
          }
        })
      } catch (e) { }
    }
    if (!node) {//can't find node
      payload = null
      return
    }
    payload.dataIndex = node.dataIndex
    payload.hasChild = node.children.length > 0
    payload.depth = node.depth
    // expandable
    if (node.expandable) {
      node.expandable = false
      // replace name
      var oldDataNode = data.getRawDataItem(node.dataIndex)
      data._nameList[node.dataIndex] = oldDataNode.__name
      oldDataNode.name = oldDataNode.__name
      node.name = oldDataNode.__name

      var count = 0
      var targetNode = 0
      var children = node.parentNode.children
      try {
        children.forEach(function (item, index) {
          if (item.isHide) {
            count++
            item.isHide = false
          }
          if (item === node) {
            targetNode = index
          }
          if (count === 4) {
            item.expandable = true
            // replace name
            var newDataNode = data.getRawDataItem(item.dataIndex)
            newDataNode.__name = item.name
            newDataNode.name = '加载更多'
            data._nameList[item.dataIndex] = '加载更多'
            item.name = '加载更多'

            throw new Error('break')
          }
        })
      } catch (e) { }
      return
    }

    node.isExpand = !(node.isExpand && node.isActive)

    if (payload.expand !== undefined) {
      node.isExpand = payload.expand
    }

    tree.root.eachNode(function (item) {
      item.isActive = false
      var el = data.getItemGraphicEl(item.dataIndex)
      el && el.downplay()
      el && el.__edge && el.__edge.trigger('normal')
    })
    node.getAncestors(true).forEach(function (item) {
      if (!item.isActive) {
        item.isActive = true
        var el = data.getItemGraphicEl(item.dataIndex)
        el && el.highlight()
        el && el.__edge && el.__edge.trigger('emphasis')
      }
    })
  })
})
echarts.registerAction({
  type: 'treeExpand',
  event: 'treeExpand',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var data = seriesModel.getData()
    var tree = data.tree
    tree.root.eachNode(function (item) {
      item.isExpand = true
    })
  })
})
echarts.registerAction({
  type: 'treeClip',
  event: 'treeClip',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var data = seriesModel.getData()
    var tree = data.tree
    tree.root.eachNode(function (item) {
      if (payload.clip) {
        if (!item.isActive) {
          item.invisible = true
        }
      } else {
        item.invisible = false
      }
    })
  })
})
echarts.registerAction({
  type: 'treeCollapse',
  event: 'treeCollapse',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var data = seriesModel.getData()
    var tree = data.tree
    var initialTreeDepth = seriesModel.get('initialTreeDepth')
    if (payload.highlight) {
      tree.root.eachNode(function (node) {
        if (!node.isActive) {
          node.isExpand = false
        }
      })
    } else {
      tree.root.eachNode(function (node) {
        var item = node.hostTree.data.getRawDataItem(node.dataIndex)
        node.isExpand = (item && item.collapsed != null)
                        ? !item.collapsed
                        : node.depth <= initialTreeDepth
        if (node.isActive) {
          node.isExpand = true
        }
        if (node.isHide || node.expandable) {
          node.isExpand = false
        }
      })
    }
  })
})

echarts.registerAction({
  type: 'treeDownplay',
  event: 'treeDownplay',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var data = seriesModel.getData()
    var tree = data.tree
    tree.root.eachNode(function (item) {
      item.isActive = false
      var el = data.getItemGraphicEl(item.dataIndex)
      el && el.downplay()
      el && el.__edge && el.__edge.trigger('normal')
    })
  })
})
echarts.registerAction({
  type: 'treeSearchHighlight',
  event: 'treeSearchHighlight',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var dataName = payload.dataName
    var data = seriesModel.getData()
    var tree = data.tree
    var dataKey = payload.dataKey
    var nodeList = []
    if (dataName) {
      nodeList = tree.getNodeListByName(dataName)
      if (dataKey) {
        nodeList = nodeList.filter(function (item) {
          return item.key === dataKey
        })
      }
    } else if (dataKey) {
      if (Array.isArray(dataKey)) {
        try {
          data.each(function (idx) {
            if (nodeList.length === dataKey.length) {
              throw new Error('break')
            }
            var key = data.getRawDataItem(idx).key
            dataKey.indexOf(key) !== -1 && nodeList.push(tree.getNodeByDataIndex(idx))
          })
        } catch (e) { }
      } else {
        try {
          data.each(function (idx) {
            if (data.getRawDataItem(idx).key === dataKey) {
              nodeList.push(tree.getNodeByDataIndex(idx))
              throw new Error('break')
            }
          })
        } catch (e) { }
      }
    }
    nodeList.forEach(function (node) {
      node.getAncestors(true).forEach(function (item) {
        item.isExpand = true
        if (!item.isActive) {
          item.isActive = true
          var el = data.getItemGraphicEl(item.dataIndex)
          el && el.highlight()
          el && el.__edge && el.__edge.trigger('emphasis')
        }
      })
    })
  })
})
echarts.registerAction({
  type: 'treeRoam',
  event: 'treeRoam',
  // Here we set 'none' instead of 'update', because roam action
  // just need to update the transform matrix without having to recalculate
  // the layout. So don't need to go through the whole update process, such
  // as 'dataPrcocess', 'coordSystemUpdate', 'layout' and so on.
  update: 'none'
}, function (payload, ecModel) {
  ecModel.eachComponent({ mainType: 'series', subType: 'tree', query: payload }, function (seriesModel) {
    var coordSys = seriesModel.coordinateSystem
    var res = updateCenterAndZoom(coordSys, payload)
    seriesModel.setCenter
    && seriesModel.setCenter(res.center)
    seriesModel.setZoom
    && seriesModel.setZoom(res.zoom)
    payload.realZoom = res.zoom
  })
})
