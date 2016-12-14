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

import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
const prelertConfigFile = path.join(__dirname, '..', 'prelert.yml');

/*
 * Reads in the Prelert plugin configuration file, returning an object containing the
 * settings loaded from the file.
 */
module.exports = function () {

  const settings = yaml.safeLoad(fs.readFileSync(prelertConfigFile, 'utf8')) || {};

  return settings;

};
