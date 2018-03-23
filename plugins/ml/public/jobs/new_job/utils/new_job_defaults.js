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

let defaults = {};
let limits = {};

export function loadNewJobDefaults(ml) {
  return new Promise((resolve) => {
    ml.mlInfo()
      .then((resp) => {
        defaults = resp.defaults;
        limits = resp.limits;
        resolve({ defaults, limits });
      })
      .catch(() => {
        resolve({ defaults, limits });
      });
  });
}

export function newJobDefaults() {
  return defaults;
}

export function newJobLimits() {
  return limits;
}

