/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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

let mlNodeCount = 0;

export function checkMlNodesAvailable(ml, kbnUrl) {
  getMlNodeCount(ml).then((nodes) => {
    if (nodes.count !== undefined && nodes.count > 0) {
      Promise.resolve();
    } else {
      kbnUrl.redirect('/jobs');
      Promise.reject();
    }
  });
}

export function getMlNodeCount(ml) {
  return new Promise((resolve) => {
    ml.mlNodeCount()
      .then((nodes) => {
        mlNodeCount = nodes.count;
        resolve(nodes);
      })
      .catch(() => {
        mlNodeCount = 0;
        resolve({ count: 0 });
      });
  });
}

export function mlNodesAvailable() {
  return (mlNodeCount !== 0);
}
