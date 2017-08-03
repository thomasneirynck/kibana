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

const fs = require('fs');

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
          query: config.query,
          jobs: config.jobs,
          datafeeds: config.datafeeds,
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
    let config = null;
    let dirName = null;
    const configs = await this.loadConfigs();

    const results = configs.filter(c => c.json.id === id);
    if (results.length) {
      config = results[0].json;
      dirName = results[0].dirName;
    }
    else {
      // should throw an error here.
      // needs to trigger a 404
      return;
    }
    const jobs = [];
    const datafeeds = [];
    await Promise.all(config.jobs.map(async (job) => {
      const jobConfig = await this.readFile(`${this.configDir}/${dirName}/${job.file}`);
      jobs.push(JSON.parse(jobConfig));
    }));

    await Promise.all(config.datafeeds.map(async (datafeed) => {
      const datafeedConfig = await this.readFile(`${this.configDir}/${dirName}/${datafeed.file}`);
      // substitute the job_id????
      datafeeds.push(JSON.parse(datafeedConfig));
    }));

    return {
      jobs,
      datafeeds
    };
  }
}
