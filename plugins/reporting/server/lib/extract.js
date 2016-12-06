import fs from 'fs';
import { Extract as extractZip } from 'unzip';
import bz2Stream from 'unbzip2-stream';
import tar from 'tar-fs';

export function unzip(filepath, target) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(filepath)
    .pipe(extractZip({ path: target }))
    .on('error', function () {
      reject(new Error('Failed to unzip file'));
    })
    .on('close', resolve);
  });
};

export function bunzip2(filepath, target) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(filepath)
    .pipe(bz2Stream())
    .on('error', function () {
      reject(new Error('Failed to unpack tar.bz2 file'));
    })
    .pipe(tar.extract(target))
    .on('error', function () {
      reject(new Error('Failed to unpack tar.bz2 file'));
    })
    .on('finish', resolve);
  });
};