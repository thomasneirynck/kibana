const fs = require('fs');
const hasha = require('hasha');
const mkdirp = require('mkdirp');
const path = require('path');
const promisify = require('bluebird').promisify;
const request = require('request');
const rimraf = require('rimraf');
const logger = require('./logger');

const fsp = {
  mkdirp: promisify(mkdirp),
  readdir: promisify(fs.readdir, fs),
  rimraf: promisify(rimraf),
};

const cleanArchives = async (archivesPath, allowedFiles) => {
  const deletedFiles = [];

  const allFiles = await fsp.readdir(archivesPath);
  for (const file of allFiles) {
    const filepath = path.join(archivesPath, file);
    const checksum = await hasha.fromFile(filepath, { algorithm: 'md5' });
    const allowedFile = allowedFiles.find(f => f.filename === file);
    if (!allowedFile || checksum !== allowedFile.checksum) {
      logger(`Deleting ${file}, it's a bad apple`);
      await fsp.rimraf(filepath);
      deletedFiles.push(file);
    }
  }

  return deletedFiles;
};

const downloadFile = (url, archivePath) => {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(archivePath);
    ws.on('finish', resolve);
    request(url).on('error', reject).pipe(ws);
  });
};

async function downloadBrowsers(browsers) {
  for (const browserKey of Object.keys(browsers)) {
    const browser = browsers[browserKey];
    const paths = browser.paths;
    const archivesPath = paths.archivesPath;

    await fsp.mkdirp(archivesPath);

    const files = paths.packages.map(({ archiveFilename, archiveChecksum }) => ({
      filename: archiveFilename,
      checksum: archiveChecksum
    }));

    logger(`Cleaning archives`);
    await cleanArchives(archivesPath, files);

    for (const { filename } of files) {
      const archivePath = path.join(archivesPath, filename);
      if (!fs.existsSync(archivePath)) {
        const url = `${paths.baseUrl}${filename}`;
        logger(`Downloading ${url}`);
        await downloadFile(url, archivePath);
      }
    }

    const deletedFiles = await cleanArchives(archivesPath, files);
    if (deletedFiles.length !== 0) {
      throw new Error(`Error downloading browsers, checksums incorrect for ${deletedFiles.join(',')}`);
    }
  }
}

module.exports = downloadBrowsers;
