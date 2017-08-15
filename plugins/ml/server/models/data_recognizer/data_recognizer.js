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

import fs from 'fs';

const ML_DIR = 'ml';
const KIBANA_DIR = 'kibana';

export class DataRecognizer {
  constructor(callWithRequest) {
    this.callWithRequest = callWithRequest;
    this.configDir = `${__dirname}/configs`;
  }

  // list all directories under the given directory
  async listDirs(dirName) {
    const dirs = [];
    return new Promise((resolve, reject) => {
      fs.readdir(dirName, (err, fileNames) => {
        if (err) {
          reject(err);
        }
        fileNames.forEach((fileName) => {
          const path = `${dirName}/${fileName}`;
          if (fs.lstatSync(path).isDirectory()) {
            dirs.push(fileName);
          }
        });
        resolve(dirs);
      });
    });
  }

  async readFile(fileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  }

  async loadConfigs() {
    const configs = [];
    const dirs = await this.listDirs(this.configDir);
    await Promise.all(dirs.map(async (dir) => {
      const file = await this.readFile(`${this.configDir}/${dir}/index.json`);
      configs.push({
        dirName: dir,
        json: JSON.parse(file)
      });
    }));

    return configs;
  }

  // called externally by an endpoint
  async findMatches(indexPattern) {
    const configs = await this.loadConfigs();
    const results = [];

    await Promise.all(configs.map(async (c) => {
      const config = c.json;
      const match = await this.searchForFields(config, indexPattern);
      if (match) {
        let logo = null;
        if (config.logoFile) {
          try {
            logo = await this.readFile(`${this.configDir}/${c.dirName}/${config.logoFile}`);
            logo = JSON.parse(logo);
          } catch(e) {
            logo = null;
          }
        }
        results.push({
          id: config.id,
          title: config.title,
          query: config.query,
          logo
        });
      }
    }));

    return results;
  }

  async searchForFields(config, indexPattern) {
    const index = indexPattern;
    const size = 0;
    const body = {
      query: config.query
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    return (resp.hits.total !== 0);
  }

  // called externally by an endpoint
  async getConfigs(id) {
    let indexJSON = null;
    let dirName = null;
    const configs = await this.loadConfigs();

    const results = configs.filter(c => c.json.id === id);
    if (results.length) {
      indexJSON = results[0].json;
      dirName = results[0].dirName;
    }
    else {
      // should throw an error here.
      // needs to trigger a 404
      return;
    }

    const jobs = [];
    const datafeeds = [];
    const kibana = {};
    // load all of the job configs
    await Promise.all(indexJSON.jobs.map(async (job) => {
      const jobConfig = await this.readFile(`${this.configDir}/${dirName}/${ML_DIR}/${job.file}`);
      // use the file name for the id
      const jobId = job.file.replace('.json', '');
      jobs.push({
        id: jobId,
        config: JSON.parse(jobConfig)
      });
    }));

    // load all of the datafeed configs
    await Promise.all(indexJSON.datafeeds.map(async (datafeed) => {
      const datafeedConfig = await this.readFile(`${this.configDir}/${dirName}/${ML_DIR}/${datafeed.file}`);
      const datafeedId = datafeed.file.replace('.json', '');
      // use the file name, minus "datafeed_" for the id
      const jobId = datafeedId.replace(/^datafeed_/, '');
      const config = JSON.parse(datafeedConfig);
      config.job_id = jobId;

      datafeeds.push({
        id: datafeedId,
        config
      });
    }));

    // load all of the kibana saved objects
    const kkeys = Object.keys(indexJSON.kibana);
    await Promise.all(kkeys.map(async (key) => {
      kibana[key] = [];
      await Promise.all(indexJSON.kibana[key].map(async (obj) => {
        const kConfig = await this.readFile(`${this.configDir}/${dirName}/${KIBANA_DIR}/${key}/${obj.file}`);
        // use the file name for the id
        const kId = obj.file.replace('.json', '');
        const config = JSON.parse(kConfig);
        kibana[key].push({
          id: kId,
          title: config.title,
          config
        });
      }));
    }));

    return {
      jobs,
      datafeeds,
      kibana
    };
  }
}
