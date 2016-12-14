/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

const module = require('ui/modules').get('apps/prelert')

.controller('TabController', function ($scope) {
  // space and tab characters don't display nicely in html
  // so show the words 'space' and 'tab' instead
  $scope.formatDelimiter = function (del) {
    let txt = del;
    switch (del) {
      case ' ':
        txt = 'space';
        break;
      case '\t':
        txt = 'tab';
        break;
      default:
        txt = del;
        break;
    }
    return txt;
  };
});

