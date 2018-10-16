
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

var echarts = require("../../echarts");

var _roamHelper = require("../../action/roamHelper");

var updateCenterAndZoom = _roamHelper.updateCenterAndZoom;

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
echarts.registerAction({
  type: 'treeExpandAndCollapse',
  event: 'treeExpandAndCollapse',
  update: 'update'
}, function (payload, ecModel, api) {
  ecModel.eachComponent({
    mainType: 'series',
    subType: 'tree',
    query: payload
  }, function (seriesModel) {
    var dataIndex = payload.dataIndex;
    var dataName = payload.dataName;
    var data = seriesModel.getData();
    var tree = data.tree;
    var node = dataIndex && tree.getNodeByDataIndex(dataIndex) || dataName && tree.getNodeListByName(dataName);

    if (Array.isArray(node)) {
      node = node.length === 1 ? node[0] : node.find(item => data.getRawDataItem(item.dataIndex).key === payload.dataKey);
    }

    if (!node) {
      payload = null;
      return;
    }

    if (node.isExpand && node.isActive) {
      node.isExpand = false;
      payload.expand = false;
    } else {
      if (node.children.length !== 0 && !node.isExpand) {
        payload.expand = true;
      }

      node.isExpand = true;
    }

    if (node.children.length !== 0 && node.isExpand) {
      payload.zoom = true;
    }

    payload.dataIndex = node.dataIndex;
    payload.depth = node.depth;
    tree.root.eachNode(function (item) {
      item.isActive = false;
      var el = data.getItemGraphicEl(item.dataIndex);
      el && el.downplay();
      el && el.__edge && el.__edge.trigger('normal');
    });
    node.getAncestors(true).forEach(function (item) {
      if (!item.isActive) {
        item.isActive = true;
        var el = data.getItemGraphicEl(item.dataIndex);
        el && el.highlight();
        el && el.__edge && el.__edge.trigger('emphasis');
      }
    });
  });
});
echarts.registerAction({
  type: 'treeSearchHighlight',
  event: 'treeSearchHighlight',
  update: 'update'
}, function (payload, ecModel) {
  ecModel.eachComponent({
    mainType: 'series',
    subType: 'tree',
    query: payload
  }, function (seriesModel) {
    var dataName = payload.dataName;
    var data = seriesModel.getData();
    var tree = data.tree;
    var nodeList = tree.getNodeListByName(dataName);
    tree.root.eachNode(function (item) {
      item.isActive = false;
      var el = data.getItemGraphicEl(item.dataIndex);
      el && el.downplay();
      el && el.__edge && el.__edge.trigger('normal');
    });
    nodeList.forEach(node => {
      // data.getItemGraphicEl(node.dataIndex);
      node.getAncestors(true).forEach(item => {
        if (!item.isActive) {
          // item.isActive = true;
          var el = data.getItemGraphicEl(item.dataIndex);
          el && el.highlight();
          el && el.__edge && el.__edge.trigger('emphasis');
        }

        if (!item.isExpand) {
          item.isExpand = true;
        }
      });
      node.isActive = true;
    });
  });
});
echarts.registerAction({
  type: 'treeRoam',
  event: 'treeRoam',
  // Here we set 'none' instead of 'update', because roam action
  // just need to update the transform matrix without having to recalculate
  // the layout. So don't need to go through the whole update process, such
  // as 'dataPrcocess', 'coordSystemUpdate', 'layout' and so on.
  update: 'none'
}, function (payload, ecModel) {
  ecModel.eachComponent({
    mainType: 'series',
    subType: 'tree',
    query: payload
  }, function (seriesModel) {
    var coordSys = seriesModel.coordinateSystem;
    var res = updateCenterAndZoom(coordSys, payload);
    seriesModel.setCenter && seriesModel.setCenter(res.center);
    seriesModel.setZoom && seriesModel.setZoom(res.zoom);
  });
});